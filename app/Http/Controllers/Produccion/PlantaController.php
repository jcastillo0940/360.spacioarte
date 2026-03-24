<?php

namespace App\Http\Controllers\Produccion;

use App\Http\Controllers\Controller;
use App\Models\OrdenProduccion;
use App\Models\Proceso;
use App\Models\ProduccionTiempo;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

use App\Enums\OrdenEstado;
use App\Services\InventoryMovementService;
use App\Services\Production\OrderService;
use App\Services\Production\InventoryService;

class PlantaController extends Controller
{
    protected OrderService $orderService;
    protected InventoryService $inventoryService;
    protected InventoryMovementService $movementService;

    public function __construct(
        OrderService $orderService,
        InventoryService $inventoryService,
        InventoryMovementService $movementService
    )
    {
        $this->orderService = $orderService;
        $this->inventoryService = $inventoryService;
        $this->movementService = $movementService;
    }

    public function index()
    {
        $procesos = Proceso::where('activo', true)->get();
        return Inertia::render('Produccion/Planta/Index', [
            'procesos' => $procesos
        ]);
    }

    public function mostrarCola($id)
    {
        $proceso = Proceso::findOrFail($id);
        // La cola de planta muestra lo que ya entró a PRODUCCIÓN (desde Pliegos o directo)
        // y aún no está terminado.
        $trabajos = OrdenProduccion::with(['venta.cliente', 'materiaPrima', 'tiempos' => function($q) {
            $q->whereNull('hora_fin');
        }])
            ->where('proceso_id', $id)
            ->where('estado', OrdenEstado::PRODUCCION->value)
            ->orderBy('fecha_entrega_proyectada', 'asc')
            ->get();

        return response()->json([
            'proceso' => $proceso,
            'trabajos' => $trabajos
        ]);
    }

    public function iniciar($id)
    {
        $orden = OrdenProduccion::findOrFail($id);

        DB::beginTransaction();
        try {
            // El estado ya debería ser PRODUCCIÓN, pero por si acaso forzamos sync
            // No, mejor solo registramos tiempos si ya está en Producción.
            // Si estaba en Pendiente (se saltó flujo), lo movemos a Producción con consumo de stock
            if ($orden->estado !== OrdenEstado::PRODUCCION->value) {
                $this->orderService->avanzarOrdenProduccion($orden, OrdenEstado::PRODUCCION->value);
            }
            
            ProduccionTiempo::create([
                'orden_produccion_id' => $orden->id,
                'maquina_id' => $orden->proceso_id,
                'operario_id' => auth()->id(),
                'hora_inicio' => now(),
            ]);

            DB::commit();
            return back()->with('success', 'Trabajo iniciado correctamente.');
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->with('error', 'Error al iniciar: ' . $e->getMessage());
        }
    }

    /**
     * Terminar trabajo con reporte de Mermas
     */
    public function terminar(Request $request, $id)
    {
        $request->validate([
            'cantidad_merma' => 'required|numeric|min:0'
        ]);

        $orden = OrdenProduccion::with(['materiaPrima', 'producto', 'venta'])->findOrFail($id);
        
        DB::beginTransaction();
        try {
            // 1. Finalizar registro de tiempos
            $tiempoLog = ProduccionTiempo::where('orden_produccion_id', $id)
                ->whereNull('hora_fin')
                ->latest()
                ->first();

            if ($tiempoLog) {
                $fin = now();
                $inicio = \Carbon\Carbon::parse($tiempoLog->hora_inicio);
                $tiempoLog->update([
                    'hora_fin' => $fin,
                    'tiempo_total_minutos' => $inicio->diffInMinutes($fin)
                ]);
            }

            // 2. Descontar Inventario EXTRA por MERMA (El base ya se descontó al iniciar)
            $merma = $request->input('cantidad_merma', 0);
            
            if ($merma > 0) {
                 // Si hay merma, descontamos ese material extra
                 if ($orden->producto) {
                     $this->inventoryService->consumirReceta($orden->producto, $merma);
                 }
                 // Generar reproceso por la cantidad perdida
                 $this->generarReproceso($orden, $merma);
            }

            $cantidadBuena = max(0, (float) $orden->cantidad - (float) $merma);
            if ($cantidadBuena > 0 && $orden->producto && ($orden->producto->requires_recipe || $orden->producto->item_base_id)) {
                $producto = $orden->producto->fresh();
                $stockAnterior = (float) $producto->stock_actual;
                $costoActual = (float) $producto->costo_promedio;
                $stockPosterior = $stockAnterior + $cantidadBuena;

                $producto->update(['stock_actual' => $stockPosterior]);

                $this->movementService->record(
                    item: $producto,
                    naturaleza: 'Entrada',
                    cantidad: $cantidadBuena,
                    costoUnitario: $costoActual,
                    stockAnterior: $stockAnterior,
                    stockPosterior: $stockPosterior,
                    costoAnterior: $costoActual,
                    costoPosterior: $costoActual,
                    origen: 'Produccion Terminada',
                    origenId: $orden->id,
                    referencia: $orden->venta?->numero_orden ?? "OP-{$orden->id}",
                    observacion: 'Ingreso de producto bueno terminado desde planta',
                    meta: [
                        'orden_produccion_id' => $orden->id,
                        'cantidad_programada' => (float) $orden->cantidad,
                        'cantidad_buena' => $cantidadBuena,
                        'cantidad_merma' => (float) $merma,
                    ]
                );
            }

            // 3. Finalizar orden actual
            $this->orderService->avanzarOrdenProduccion($orden, OrdenEstado::TERMINADO->value);
            
             // 4. Verificar si todas las tareas de producción de esta venta están terminadas
             // Esto podría moverse al Service para ser automático, pero lo dejamos aquí explícito por ahora
             // o confiamos en que avanzarOrdenProduccion lo haga, pero mi implementación actual solo syncaba a Producción.
             // Vamos a forzar el check de Terminado aquí.
            $venta = $orden->venta;
            if ($venta) {
                $pendientes = OrdenProduccion::where('orden_venta_id', $venta->id)
                    ->where('estado', '!=', OrdenEstado::TERMINADO->value)
                    ->count();
                
                if ($pendientes === 0) {
                    $this->orderService->cambiarEstado($venta, OrdenEstado::TERMINADO->value, false);
                }
            }

            DB::commit();
            return back()->with('success', 'Trabajo finalizado. ' . ($merma > 0 ? 'Se generó orden de reimpresión.' : ''));
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->with('error', 'Error al finalizar: ' . $e->getMessage());
        }
    }

    /**
     * Lógica interna para enviar mermas a la Cola de Impresión
     */
    private function generarReproceso(OrdenProduccion $ordenOriginal, $cantidadMerma)
    {
        // Buscamos el proceso de "Impresión" para devolver la tarea a Fase 1
        $procesoImpresion = Proceso::where('tipo_maquina', 'like', '%Impresión%')
                                   ->orWhere('nombre', 'like', '%Impresión%')
                                   ->first();

        // El reproceso nace como PENDIENTE para que entre de nuevo al flujo de Pliegos/Nesting
        OrdenProduccion::create([
            'orden_venta_id' => $ordenOriginal->orden_venta_id,
            'proceso_id'     => $procesoImpresion ? $procesoImpresion->id : $ordenOriginal->proceso_id,
            'item_id'        => $ordenOriginal->item_id,
            'cantidad'       => $cantidadMerma,
            'estado'         => OrdenEstado::PENDIENTE->value, 
            'notas_operario' => "REPROCESO de Orden #{$ordenOriginal->id} por merma en planta.",
            'fecha_entrega_proyectada' => now()->addDay()
        ]);
    }
}
