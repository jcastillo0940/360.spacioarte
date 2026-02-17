<?php

namespace App\Http\Controllers\Ventas;

use App\Http\Controllers\Controller;
use App\Models\OrdenVenta;
use App\Models\OrdenProduccion;
use App\Models\Proceso;
use App\Models\DisenoHistorial;
use App\Events\ChatMessageEvent;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

use App\Enums\OrdenEstado;

class CustomerPortalController extends Controller
{
    public function show($token)
    {
        $orden = OrdenVenta::with(['vendedor', 'sucursal', 'detalles.item', 'disenoHistorial'])
            ->where('tracking_token', $token)
            ->firstOrFail();

        $config = \App\Models\TenantConfig::getSettings();

        return Inertia::render('Public/Tracking/Show', [
            'orden' => $orden,
            'max_intentos' => $config->max_intentos_diseno
        ]);
    }

    public function sendMessage(Request $request, $token)
    {
        $orden = OrdenVenta::where('tracking_token', $token)->firstOrFail();

        $request->validate([
            'mensaje_texto' => 'required|string',
            'emisor' => 'required|in:cliente,staff'
        ]);

        // SEGURIDAD: Prevenir que un cliente se haga pasar por staff
        $emisorReal = $request->emisor;
        if ($emisorReal === 'staff' && !auth()->check()) {
            $emisorReal = 'cliente';
        }

        $msgObj = [
            'texto' => $request->mensaje_texto,
            'emisor' => $emisorReal,
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
            $orden->update([
                'estado_diseno' => 'Aprobado',
                'estado' => OrdenEstado::NESTING->value // Pasa a Pre-prensa
            ]);

            // Guardar en historial
            DisenoHistorial::create([
                'orden_venta_id' => $orden->id,
                'imagen' => $orden->imagen_diseno,
                'comentarios_cliente' => 'Aprobado por el cliente desde el portal.',
                'estado' => 'Aprobado',
                'intento' => $orden->diseno_intentos
            ]);

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
                        'estado'         => OrdenEstado::PENDIENTE->value, // Pendiente de Nesting/Pliego
                        'fecha_entrega_proyectada' => $this->calcularFechaProyectada($item->proceso_id, $detalle->cantidad)
                    ]);
                }
            }

            DB::commit();
            return back()->with('success', '¡Gracias! Tu diseño ha sido aprobado y tus productos ya están en cola de producción.');

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error("Error en aprobación de diseño (Token: $token): " . $e->getMessage());
            return back()->with('error', 'Error al procesar la aprobación: ' . $e->getMessage());
        }
    }

    public function rejectDesign(Request $request, $token)
    {
        $request->validate(['comentarios' => 'required|string']);
        
        $orden = OrdenVenta::where('tracking_token', $token)->firstOrFail();
        
        if ($orden->estado_diseno !== 'Enviado') {
            return back()->with('error', 'No hay un diseño pendiente de aprobación.');
        }

        DB::beginTransaction();
        try {
            $orden->update([
                'estado_diseno' => 'Rechazado',
                'estado' => OrdenEstado::DISENO->value // Vuelve a diseño
            ]);

            DisenoHistorial::create([
                'orden_venta_id' => $orden->id,
                'imagen' => $orden->imagen_diseno,
                'comentarios_cliente' => $request->comentarios,
                'estado' => 'Rechazado',
                'intento' => $orden->diseno_intentos
            ]);

            $msgObj = [
                'texto' => '❌ DISEÑO RECHAZADO POR EL CLIENTE. Razón: ' . $request->comentarios,
                'emisor' => 'sistema',
                'created_at' => now()->toIso8601String(),
                'requiere_aprobacion' => false
            ];
            
            broadcast(new ChatMessageEvent($msgObj, $token));

            DB::commit();
            return back()->with('success', 'Hemos enviado tus comentarios al diseñador. Pronto recibirás una nueva versión.');

        } catch (\Exception $e) {
            DB::rollBack();
            return back()->with('error', 'Error al procesar el rechazo: ' . $e->getMessage());
        }
    }

    public function submitBrief(Request $request, $token)
    {
        $request->validate([
            'brief_cliente' => 'required|string',
            'archivo' => 'required|file|max:10240', // 10MB max
        ]);

        $orden = OrdenVenta::where('tracking_token', $token)->firstOrFail();

        DB::beginTransaction();
        try {
            $path = $request->file('archivo')->store('briefs', 'public');

            $orden->update([
                'brief_cliente' => $request->brief_cliente,
                'archivo_brief_path' => $path,
                'estado' => OrdenEstado::PENDIENTE->value // Archivos recibidos, pendiente de iniciar diseño
            ]);

            $msgObj = [
                'texto' => "📁 ARCHIVOS Y BRIEF RECIBIDOS DEL CLIENTE.\nDescripción: " . $request->brief_cliente,
                'emisor' => 'sistema',
                'created_at' => now()->toIso8601String(),
                'image_url' => \Illuminate\Support\Facades\Storage::url($path)
            ];
            
            broadcast(new ChatMessageEvent($msgObj, $token));

            DB::commit();
            return back()->with('success', '¡Información recibida! Nuestro equipo revisará los materiales y comenzará con el diseño.');

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error("Error en envío de brief (Token: $token): " . $e->getMessage());
            return back()->with('error', 'Error al procesar el envío: ' . $e->getMessage());
        }
    }

    private function calcularFechaProyectada($procesoId, $cantidadSolicitada)
    {
        $proceso = Proceso::find($procesoId);
        
        if (!$proceso || $proceso->capacidad_diaria <= 0) {
            return now()->addDays(2);
        }

        $cargaActual = OrdenProduccion::where('proceso_id', $procesoId)
            ->whereIn('estado', [
                OrdenEstado::PENDIENTE->value, 
                OrdenEstado::NESTING->value, 
                OrdenEstado::PRODUCCION->value
            ])
            ->sum('cantidad');

        if (($cargaActual + $cantidadSolicitada) > $proceso->capacidad_diaria) {
            return now()->addDays(2);
        }

        return now()->addDay();
    }

    /**
     * Cliente aprueba cobro por revisiones adicionales de diseño
     */
    public function approveBilling($token)
    {
        $orden = OrdenVenta::where('tracking_token', $token)->firstOrFail();

        if ($orden->diseno_cobro_aprobado) {
            return back()->with('info', 'El cobro ya fue aprobado previamente.');
        }

        $config = \App\Models\TenantConfig::getSettings();

        $orden->update([
            'diseno_cobro_aprobado' => true,
            'diseno_cobro_aprobado_at' => now()
        ]);

        // Notificar al equipo
        $msgObj = [
            'texto' => "✅ El cliente ha aprobado continuar con revisiones de pago. Tarifa: Primera hora \${$config->diseno_precio_primera_hora}, horas adicionales \${$config->diseno_precio_hora_adicional}.",
            'emisor' => 'sistema',
            'created_at' => now()->toIso8601String()
        ];
        
        broadcast(new ChatMessageEvent($msgObj, $token));

        return back()->with('success', 'Aprobación registrada. Las siguientes revisiones tendrán costo según las tarifas informadas.');
    }

    public function submitOwnDesign(Request $request, $token)
    {
        $request->validate([
            'archivo' => 'required|file|max:20480', // 20MB max para archivos pesados
        ]);

        $orden = OrdenVenta::with('detalles.item')->where('tracking_token', $token)->firstOrFail();

        DB::beginTransaction();
        try {
            $path = $request->file('archivo')->store('disenos_propios', 'public');

            // Actualizar orden como aprobada (Diseño propio es aprobación directa)
            // Pasa directo a NESTING (Pre-Prensa)
            $orden->update([
                'estado_diseno' => 'Aprobado',
                'estado' => OrdenEstado::NESTING->value,
                'imagen_diseno' => $path
            ]);

            // Guardar en historial con nota de responsabilidad
            DisenoHistorial::create([
                'orden_venta_id' => $orden->id,
                'imagen' => $path,
                'comentarios_cliente' => 'EL CLIENTE ENVIÓ DISEÑO PROPIO Y ACEPTÓ RESPONSABILIDAD TÉCNICA.',
                'estado' => 'Aprobado',
                'intento' => $orden->diseno_intentos + 1
            ]);

            $msgObj = [
                'texto' => '📁 DISEÑO PROPIO RECIBIDO. El cliente asume responsabilidad técnica. Liberado a producción.',
                'emisor' => 'sistema',
                'created_at' => now()->toIso8601String()
            ];
            
            broadcast(new ChatMessageEvent($msgObj, $token));

            // Generar tareas de producción
            foreach ($orden->detalles as $detalle) {
                $item = $detalle->item;
                if ($item && $item->proceso_id) {
                    OrdenProduccion::create([
                        'orden_venta_id' => $orden->id,
                        'proceso_id'     => $item->proceso_id,
                        'item_id'        => $item->item_base_id ?? $item->id,
                        'cantidad'       => $detalle->cantidad,
                        'estado'         => OrdenEstado::PENDIENTE->value,
                        'fecha_entrega_proyectada' => $this->calcularFechaProyectada($item->proceso_id, $detalle->cantidad)
                    ]);
                }
            }

            DB::commit();
            return back()->with('success', '¡Diseño recibido! Tu pedido ha sido enviado a producción bajo tu archivo suministrado.');

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error("Error en envío de diseño propio ($token): " . $e->getMessage());
            return back()->with('error', 'Falla al procesar el archivo: ' . $e->getMessage());
        }
    }
}