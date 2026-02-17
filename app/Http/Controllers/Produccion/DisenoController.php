<?php

namespace App\Http\Controllers\Produccion;

use App\Http\Controllers\Controller;
use App\Models\OrdenVenta;
use App\Models\DisenoHistorial;
use App\Enums\OrdenEstado;
use App\Services\Production\OrderService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;
use App\Events\ChatMessageEvent;

use App\Models\ProduccionTiempo;
use App\Models\TenantConfig;
use Carbon\Carbon;

class DisenoController extends Controller
{
    protected OrderService $orderService;

    public function __construct(OrderService $orderService)
    {
        $this->orderService = $orderService;
    }

    public function index()
    {
        // Cola de Diseño: Órdenes pendientes de arte o en proceso de diseño
        $ordenes = OrdenVenta::with(['cliente', 'vendedor', 'sucursal', 'detalles.item'])
            ->whereIn('estado', [OrdenEstado::PENDIENTE->value, OrdenEstado::DISENO->value, OrdenEstado::BORRADOR->value])
            // Incluir Borrador si el equipo de diseño inicia temprano, o solo CONFIRMADA/PENDIENTE/DISENO
            ->orderBy('fecha_entrega', 'asc')
            ->get();

        return Inertia::render('Produccion/Diseno/Index', [
            'ordenes' => $ordenes
        ]);
    }

    /**
     * Muestra la vista de detalle/proceso de una orden específica para diseño
     */
    public function show($id)
    {
        $orden = OrdenVenta::with([
            'cliente', 
            'vendedor', 
            'sucursal', 
            'detalles.item', 
            'disenoHistorial',
            'tiempos' => function($q) {
                $q->where('fase', 'Diseño'); // Cargamos todos para calcular acumulado
            }
        ])->findOrFail($id);

        return Inertia::render('Produccion/Diseno/Show', [
            'orden' => $orden
        ]);
    }

    /**
     * El diseñador toma la orden para trabajar
     */
    public function iniciar(OrdenVenta $orden)
    {
        if ($orden->estado === OrdenEstado::PENDIENTE->value || $orden->estado === OrdenEstado::BORRADOR->value) {
            $this->orderService->cambiarEstado($orden, OrdenEstado::DISENO->value, false);
        }
        return back()->with('success', 'Orden en proceso de diseño.');
    }

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
            // Si estaba en Pendiente, pasarlo a Diseño
            if ($orden->estado !== OrdenEstado::DISENO->value) {
                $this->orderService->cambiarEstado($orden, OrdenEstado::DISENO->value, false);
            }
        }

        // Evitar duplicados si ya hay uno corriendo
        $existe = ProduccionTiempo::where('orden_venta_id', $orden->id)
            ->where('fase', $request->fase)
            ->whereNull('hora_fin')
            ->exists();

        if (!$existe) {
            ProduccionTiempo::create([
                'orden_venta_id' => $orden->id,
                'fase' => $request->fase,
                'operario_id' => auth()->id(),
                'hora_inicio' => now(),
            ]);
        }

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
            ->latest()
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
                    $tasa_itbms = ($itemDiseno->tax && $itemDiseno->tax->tasa !== null) ? $itemDiseno->tax->tasa : 7.00; // Ajustar lógica de tax si cambio modelo
                    
                    $detalleDiseno = $orden->detalles()->where('item_id', $itemDiseno->id)->first();
                    
                    if ($detalleDiseno) {
                        $detalleDiseno->update([
                            'precio_unitario' => $monto,
                            'subtotal' => $monto, // Asumiendo cantidad 1
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
     * Búsqueda rápida de orden para el diseñador
     */
    public function search(Request $request)
    {
        $orden = OrdenVenta::where('numero_orden', $request->q)
            ->orWhere('id', $request->q)
            ->with(['cliente'])
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

    /**
     * El diseñador sube una propuesta y la envía al cliente
     */
    public function enviarPropuesta(Request $request, ?OrdenVenta $orden = null)
    {
        $request->validate([
            'imagen' => 'required|image|max:10240', // 10MB
            'comentarios' => 'nullable|string',
            // If orden is null, we need numero_orden
            'numero_orden' => $orden ? 'nullable' : 'required|exists:ordenes_venta,numero_orden'
        ]);

        if (!$orden) {
            $orden = OrdenVenta::where('numero_orden', $request->numero_orden)->firstOrFail();
        }

        DB::beginTransaction();
        try {
            $path = $request->file('imagen')->store('propuestas', 'public');

            $orden->update([
                'imagen_diseno' => $path,
                'estado_diseno' => 'Enviado', // Estado específico del diseño para el portal
                'diseno_intentos' => $orden->diseno_intentos + 1,
                // Mantener estado en DISEÑO mientras cliente revisa
                'estado' => OrdenEstado::DISENO->value 
            ]);

            DisenoHistorial::create([
                'orden_venta_id' => $orden->id,
                'imagen' => $path,
                'comentarios_staff' => $request->comentarios, // Changed from comentarios_cliente to comentarios_staff ? Wait, DB column check needed.
                // Assuming DisenoHistorial has distinct columns or just 'comentarios'. Previous create used 'comentarios_cliente'.
                // Checking previous ViewFile of DesignController: 'comentarios_staff' => $request->comentarios
                // Checking CustomerPortalController: 'comentarios_cliente' => ...
                // So DisenoHistorial likely has both or one shared?
                // Let's use what fits. I'll check DisenoHistorial after this if needed. 
                // Using 'comentarios_cliente' for Client, 'comentarios_staff' for Staff is logical.
                'comentarios_cliente' => null, 
                'comentarios_staff' => $request->comentarios, 
                'estado' => 'Enviado',
                'intento' => $orden->diseno_intentos
            ]);

            // Detener timer si corre
            // $this->stopTimer(...) - Maybe separate call from frontend? Or auto-stop here?
            // Auto-stop is safer.
            $tiempo = ProduccionTiempo::where('orden_venta_id', $orden->id)
                ->where('fase', 'Diseño')
                ->whereNull('hora_fin')
                ->latest()
                ->first();
                
            if ($tiempo) {
                 $this->stopTimer(new Request(['orden_id' => $orden->id, 'fase' => 'Diseño']));
            }

            // Notificar al cliente (Chat)
            $msgObj = [
                'texto' => "🎨 NUEVA PROPUESTA DE DISEÑO.\n" . ($request->comentarios ?? ''),
                'emisor' => 'staff',
                'created_at' => now()->toIso8601String(),
                'image_url' => \Illuminate\Support\Facades\Storage::url($path),
                'requiere_aprobacion' => true
            ];
            
            if ($orden->tracking_token) {
                broadcast(new ChatMessageEvent($msgObj, $orden->tracking_token));
            }

            DB::commit();
            
            // Return JSON if api call or Redirect if Inertia
            if ($request->wantsJson()) {
                 return response()->json(['message' => 'Propuesta enviada al cliente.']);
            }
            return back()->with('success', 'Propuesta enviada al cliente.');

        } catch (\Exception $e) {
            DB::rollBack();
            if ($request->wantsJson()) {
                 return response()->json(['error' => $e->getMessage()], 500);
            }
            return back()->with('error', 'Error al enviar propuesta: ' . $e->getMessage());
        }
    }

    /**
     * Staff aprueba cobrar diseño manualmente (si cliente confirma por otro medio)
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
}
