<?php

namespace App\Http\Controllers\Ventas;

use App\Http\Controllers\Controller;
use App\Models\OrdenVenta;
use App\Models\OrdenMensaje;
use App\Models\OrdenProduccion;
use App\Models\Proceso;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class CustomerPortalController extends Controller
{
    /**
     * Ver el portal con el token seguro (Sin Login)
     */
    public function show($token)
    {
        $orden = OrdenVenta::with(['mensajes.usuario', 'vendedor', 'sucursal', 'detalles.item'])
            ->where('tracking_token', $token)
            ->firstOrFail();

        return Inertia::render('Public/Tracking/Show', [
            'orden' => $orden
        ]);
    }

    /**
     * El cliente envía un mensaje o solicita cambios
     */
    public function sendMessage(Request $request, $token)
    {
        $orden = OrdenVenta::where('tracking_token', $token)->firstOrFail();

        $request->validate([
            'mensaje_texto' => 'required|string',
            'emisor' => 'required|in:cliente,staff'
        ]);

        OrdenMensaje::create([
            'orden_venta_id' => $orden->id,
            'user_id' => auth()->id(), // Será null si viene del cliente
            'emisor' => $request->emisor,
            'mensaje_texto' => $request->mensaje_texto,
            'requiere_aprobacion' => $request->requiere_aprobacion ?? false,
        ]);

        return back()->with('success', 'Mensaje enviado correctamente');
    }

    /**
     * El cliente aprueba el diseño (Disparador de Producción)
     */
    public function approveDesign($token)
    {
        $orden = OrdenVenta::with('detalles.item')->where('tracking_token', $token)->firstOrFail();
        
        // Evitar doble proceso si ya fue aprobada
        if ($orden->estado_diseno === 'Aprobado') {
            return back()->with('error', 'Este diseño ya ha sido aprobado previamente.');
        }

        DB::beginTransaction();
        try {
            // 1. Actualizar estado de diseño
            $orden->update(['estado_diseno' => 'Aprobado']);

            // 2. Registro de Auditoría (Actividad Log)
            OrdenMensaje::create([
                'orden_venta_id' => $orden->id,
                'emisor' => 'cliente',
                'mensaje_texto' => '✅ DISEÑO APROBADO POR EL CLIENTE. Liberado a producción automáticamente.',
            ]);

            // 3. FASE DE DESCOMPOSICIÓN: Venta -> Órdenes de Producción
            foreach ($orden->detalles as $detalle) {
                $item = $detalle->item;
                
                // Solo se crea orden de producción si el item tiene un proceso (máquina) asignado
                if ($item && $item->proceso_id) {
                    OrdenProduccion::create([
                        'orden_venta_id' => $orden->id,
                        'proceso_id'     => $item->proceso_id, // Centro de Trabajo asignado
                        'item_id'        => $item->item_base_id ?? $item->id, // Materia Prima Base
                        'cantidad'       => $detalle->cantidad,
                        'estado'         => 'Pendiente', // Cae automáticamente a la "Cola de Impresión"
                        'fecha_entrega_proyectada' => $this->calcularFechaProyectada($item->proceso_id, $detalle->cantidad)
                    ]);
                }
            }

            DB::commit();
            return back()->with('success', '¡Gracias! Tu diseño ha sido aprobado y tus productos ya están en cola de producción.');

        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error("Error en aprobación de diseño (Token: $token): " . $e->getMessage());
            return back()->with('error', 'Error al procesar la aprobación. Por favor contacte soporte.');
        }
    }

    /**
     * Cálculo Dinámico de Capacidad (Predictivo)
     */
    private function calcularFechaProyectada($procesoId, $cantidadSolicitada)
    {
        $proceso = Proceso::find($procesoId);
        
        if (!$proceso || $proceso->capacidad_diaria <= 0) {
            return now()->addDays(2); // Margen de seguridad por defecto
        }

        // Sumar todo lo que tiene asignada esa máquina para el día actual
        $cargaActual = OrdenProduccion::where('proceso_id', $procesoId)
            ->whereIn('estado', ['Pendiente', 'En Pliego', 'En Máquina'])
            ->sum('cantidad');

        // Si la carga actual + lo nuevo supera la capacidad diaria, proyectamos a mañana
        if (($cargaActual + $cantidadSolicitada) > $proceso->capacidad_diaria) {
            return now()->addDays(2); // Proyectado para el subsiguiente día útil
        }

        return now()->addDay();
    }
}