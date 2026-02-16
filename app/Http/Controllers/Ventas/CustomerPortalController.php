<?php

namespace App\Http\Controllers\Ventas;

use App\Http\Controllers\Controller;
use App\Models\OrdenVenta;
use App\Models\OrdenProduccion;
use App\Models\Proceso;
use App\Events\ChatMessageEvent;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class CustomerPortalController extends Controller
{
    public function show($token)
    {
        $orden = OrdenVenta::with(['vendedor', 'sucursal', 'detalles.item'])
            ->where('tracking_token', $token)
            ->firstOrFail();

        return Inertia::render('Public/Tracking/Show', [
            'orden' => $orden
        ]);
    }

    public function sendMessage(Request $request, $token)
    {
        $orden = OrdenVenta::where('tracking_token', $token)->firstOrFail();

        $request->validate([
            'mensaje_texto' => 'required|string',
            'emisor' => 'required|in:cliente,staff'
        ]);

        $msgObj = [
            'texto' => $request->mensaje_texto,
            'emisor' => $request->emisor,
            'created_at' => now()->toIso8601String(),
            'requiere_aprobacion' => $request->requiere_aprobacion ?? false
        ];

        broadcast(new ChatMessageEvent($msgObj, $token))->toOthers();

        return back()->with('success', 'Mensaje enviado correctamente');
    }

    public function approveDesign($token)
    {
        $orden = OrdenVenta::with('detalles.item')->where('tracking_token', $token)->firstOrFail();
        
        if ($orden->estado_diseno === 'Aprobado') {
            return back()->with('error', 'Este diseño ya ha sido aprobado previamente.');
        }

        DB::beginTransaction();
        try {
            $orden->update(['estado_diseno' => 'Aprobado']);

            $msgObj = [
                'texto' => '✅ DISEÑO APROBADO POR EL CLIENTE. Liberado a producción automáticamente.',
                'emisor' => 'sistema',
                'created_at' => now()->toIso8601String(),
                'requiere_aprobacion' => false
            ];
            
            broadcast(new ChatMessageEvent($msgObj, $token));

            foreach ($orden->detalles as $detalle) {
                $item = $detalle->item;
                
                if ($item && $item->proceso_id) {
                    OrdenProduccion::create([
                        'orden_venta_id' => $orden->id,
                        'proceso_id'     => $item->proceso_id,
                        'item_id'        => $item->item_base_id ?? $item->id,
                        'cantidad'       => $detalle->cantidad,
                        'estado'         => 'Pendiente',
                        'fecha_entrega_proyectada' => $this->calcularFechaProyectada($item->proceso_id, $detalle->cantidad)
                    ]);
                }
            }

            DB::commit();
            return back()->with('success', '¡Gracias! Tu diseño ha sido aprobado y tus productos ya están en cola de producción.');

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error("Error en aprobación de diseño (Token: $token): " . $e->getMessage());
            return back()->with('error', 'Error al procesar la aprobación. Por favor contacte soporte.');
        }
    }

    private function calcularFechaProyectada($procesoId, $cantidadSolicitada)
    {
        $proceso = Proceso::find($procesoId);
        
        if (!$proceso || $proceso->capacidad_diaria <= 0) {
            return now()->addDays(2);
        }

        $cargaActual = OrdenProduccion::where('proceso_id', $procesoId)
            ->whereIn('estado', ['Pendiente', 'En Pliego', 'En Máquina'])
            ->sum('cantidad');

        if (($cargaActual + $cantidadSolicitada) > $proceso->capacidad_diaria) {
            return now()->addDays(2);
        }

        return now()->addDay();
    }
}