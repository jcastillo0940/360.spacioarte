<?php

namespace App\Http\Controllers\Ventas;

use App\Http\Controllers\Controller;
use App\Models\OrdenVenta;
use App\Models\DisenoHistorial;
use App\Models\TenantConfig;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;
use App\Models\ProduccionTiempo;
use App\Events\ChatMessageEvent;
use Carbon\Carbon;

class DesignController extends Controller
{
    /**
     * Inicia el contador de tiempo para una fase (ej: Diseño)
     */
    public function startTimer(Request $request)
    {
        $request->validate([
            'orden_id' => 'required|exists:ordenes_venta,id',
            'fase' => 'required|string'
        ]);

        $orden = OrdenVenta::findOrFail($request->orden_id);
        
        // Cambiar estado según la fase
        if ($request->fase === 'Diseño') {
            $nuevoEstado = $orden->diseno_intentos > 0 ? 'Rediseñando' : 'En Proceso de Diseño';
            $orden->update(['estado' => $nuevoEstado]);
        } elseif ($request->fase === 'Impresión') {
            $orden->update(['estado' => 'En Impresión']);
        } elseif ($request->fase === 'Producción') {
            $orden->update(['estado' => 'En Producción']);
        }

        ProduccionTiempo::create([
            'orden_venta_id' => $orden->id,
            'fase' => $request->fase,
            'operario_id' => auth()->id(),
            'hora_inicio' => now(),
        ]);

        return response()->json(['message' => 'Contador iniciado']);
    }

    /**
     * Detiene el contador de tiempo y acumula si es facturable
     */
    public function stopTimer(Request $request)
    {
        $request->validate([
            'orden_id' => 'required|exists:ordenes_venta,id',
            'fase' => 'required|string'
        ]);

        $tiempo = ProduccionTiempo::where('orden_venta_id', $request->orden_id)
            ->where('fase', $request->fase)
            ->whereNull('hora_fin')
            ->first();

        if ($tiempo) {
            $fin = now();
            $inicio = Carbon::parse($tiempo->hora_inicio);
            $minutos = $inicio->diffInMinutes($fin);
            
            $tiempo->update([
                'hora_fin' => $fin,
                'tiempo_total_minutos' => $minutos
            ]);

            // Si es diseño y el cobro está aprobado, acumular tiempo
            $orden = OrdenVenta::with('detalles')->find($request->orden_id);
            if ($request->fase === 'Diseño' && $orden->diseno_cobro_aprobado) {
                $orden->diseno_minutos_acumulados += $minutos;
                
                // Calcular monto según tarifas configuradas
                $config = TenantConfig::getSettings();
                $horas = $orden->diseno_minutos_acumulados / 60;
                
                if ($horas <= 1) {
                    $monto = $config->diseno_precio_primera_hora;
                } else {
                    $horasAdicionales = ceil($horas - 1);
                    $monto = $config->diseno_precio_primera_hora + 
                             ($horasAdicionales * $config->diseno_precio_hora_adicional);
                }
                
                $orden->diseno_monto_calculado = $monto;

                // Sincronizar con ítem DIS-01 en la orden
                $itemDiseno = \App\Models\Item::where('codigo', 'DIS-01')->first();
                if ($itemDiseno) {
                    $tasa_itbms = ($itemDiseno->tax && $itemDiseno->tax->tasa !== null) ? $itemDiseno->tax->tasa : 7.00;
                    
                    $detalleDiseno = $orden->detalles()->where('item_id', $itemDiseno->id)->first();
                    
                    if ($detalleDiseno) {
                        $detalleDiseno->update([
                            'precio_unitario' => $monto,
                            'subtotal' => $monto,
                            'total' => $monto + ($monto * ($tasa_itbms / 100))
                        ]);
                    } else {
                        $orden->detalles()->create([
                            'item_id' => $itemDiseno->id,
                            'cantidad' => 1,
                            'precio_unitario' => $monto,
                            'subtotal' => $monto,
                            'porcentaje_itbms' => $tasa_itbms,
                            'total' => $monto + ($monto * ($tasa_itbms / 100))
                        ]);
                    }

                    // Recalcular totales de la orden
                    $orden->refresh();
                    $newSubtotal = $orden->detalles()->sum('subtotal');
                    $newItbms = $orden->detalles()->sum(DB::raw('subtotal * (porcentaje_itbms / 100)'));
                    
                    $orden->update([
                        'subtotal' => $newSubtotal,
                        'itbms_total' => $newItbms,
                        'total' => $newSubtotal + $newItbms
                    ]);
                } else {
                    $orden->save();
                }
            }
        }

        return response()->json([
            'message' => 'Contador detenido',
            'minutos_acumulados' => $orden->diseno_minutos_acumulados ?? 0,
            'monto_calculado' => $orden->diseno_monto_calculado ?? 0
        ]);
    }

    /**
     * Sube un nuevo diseño (usado por el diseñador)
     */
    public function upload(Request $request)
    {
        $request->validate([
            'numero_orden' => 'required|string',
            'imagen' => 'required|image|max:5120', // 5MB max
            'comentarios' => 'nullable|string'
        ]);

        $orden = OrdenVenta::where('numero_orden', $request->numero_orden)->first();

        if (!$orden) {
            return response()->json(['error' => 'Orden no encontrada'], 404);
        }

        if ($orden->estado_diseno === 'Aprobado') {
            return response()->json(['error' => 'Esta orden ya está aprobada'], 422);
        }

        $config = TenantConfig::getSettings();
        
        // CAMBIO CRÍTICO: Ya no bloqueamos, solo notificamos si se requiere aprobación
        $requiereAprobacion = $orden->diseno_intentos >= $config->diseno_revisiones_gratuitas 
                              && !$orden->diseno_cobro_aprobado;

        DB::beginTransaction();
        try {
            $path = $request->file('imagen')->store('disenos', 'public');

            $orden->diseno_intentos += 1;
            $orden->imagen_diseno = $path;
            $orden->estado_diseno = 'Enviado';
            $orden->estado = 'Enviado para Aprobación';
            $orden->save();

            // Detener timer de diseño si existe
            $this->stopTimer(new Request(['orden_id' => $orden->id, 'fase' => 'Diseño']));

            DisenoHistorial::create([
                'orden_venta_id' => $orden->id,
                'imagen' => $path,
                'comentarios_staff' => $request->comentarios,
                'estado' => 'Enviado',
                'intento' => $orden->diseno_intentos
            ]);

            // Notificar vía chat
            $mensaje = $requiereAprobacion 
                ? "🎨 NUEVO DISEÑO DISPONIBLE (Revisión #{$orden->diseno_intentos}). ⚠️ Esta revisión tiene costo adicional. Por favor revise las tarifas y apruebe para continuar."
                : "🎨 NUEVO DISEÑO DISPONIBLE (Revisión {$orden->diseno_intentos}/{$config->diseno_revisiones_gratuitas} gratuita). Por favor revise y apruebe.";
            
            $msgObj = [
                'texto' => $mensaje,
                'emisor' => 'staff',
                'created_at' => now()->toIso8601String(),
                'requiere_aprobacion' => true,
                'requiere_aprobacion_cobro' => $requiereAprobacion,
                'image_url' => Storage::url($path)
            ];
            
            broadcast(new ChatMessageEvent($msgObj, $orden->tracking_token));

            DB::commit();
            
            return response()->json([
                'message' => 'Diseño subido correctamente',
                'path' => Storage::url($path),
                'requiere_aprobacion_cobro' => $requiereAprobacion,
                'intento' => $orden->diseno_intentos
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['error' => 'Error al subir diseño: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Cliente aprueba continuar con cobro por diseño
     */
    public function approveBillingForDesign(Request $request)
    {
        $request->validate([
            'orden_id' => 'required|exists:ordenes_venta,id'
        ]);

        $orden = OrdenVenta::findOrFail($request->orden_id);

        if ($orden->diseno_cobro_aprobado) {
            return response()->json(['message' => 'El cobro ya fue aprobado previamente'], 200);
        }

        $orden->update([
            'diseno_cobro_aprobado' => true,
            'diseno_cobro_aprobado_at' => now()
        ]);

        return response()->json([
            'message' => 'Aprobación registrada. Las siguientes revisiones tendrán costo.',
            'aprobado_en' => $orden->diseno_cobro_aprobado_at
        ]);
    }


    /**
     * Búsqueda rápida de orden para el diseñador
     */
    public function search(Request $request)
    {
        $orden = OrdenVenta::where('numero_orden', $request->q)
            ->orWhere('id', $request->q)
            ->with('cliente')
            ->first();

        if (!$orden) return response()->json(['error' => 'No encontrada'], 404);

        return response()->json([
            'id' => $orden->id,
            'numero_orden' => $orden->numero_orden,
            'cliente' => $orden->cliente->razon_social,
            'estado_diseno' => $orden->estado_diseno,
            'intentos' => $orden->diseno_intentos,
            'detalle_diseno' => $orden->detalle_diseno,
            'brief_cliente' => $orden->brief_cliente,
            'archivo_brief_path' => $orden->archivo_brief_path ? \Illuminate\Support\Facades\Storage::url($orden->archivo_brief_path) : null
        ]);
    }
}
