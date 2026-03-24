<?php

namespace App\Http\Controllers\Produccion;

use App\Enums\OrdenEstado;
use App\Http\Controllers\Controller;
use App\Models\Item;
use App\Models\OrdenProduccion;
use App\Models\PliegoImpresion;
use App\Services\InventoryMovementService;
use App\Services\Production\OrderService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class PliegoController extends Controller
{
    protected OrderService $orderService;

    public function __construct(OrderService $orderService)
    {
        $this->orderService = $orderService;
    }

    /**
     * Listado de pliegos y ordenes pendientes de agrupar.
     */
    public function index()
    {
        $pendientes = OrdenProduccion::with(['venta.cliente', 'producto', 'materiaUsada', 'maquina'])
            ->whereIn('estado', [OrdenEstado::PENDIENTE->value, OrdenEstado::NESTING->value])
            ->get();

        $pliegos = PliegoImpresion::with(['materiaPrima', 'items.venta', 'items.producto'])
            ->orderBy('id', 'desc')
            ->take(20)
            ->get();

        $papeles = Item::materialesSoporte()
            ->select('id', 'nombre', 'stock_actual', 'unidad_medida', 'ancho_cm', 'largo_cm', 'es_rollo', 'margen_seguridad_cm')
            ->get();

        return Inertia::render('Produccion/Pliegos/Index', [
            'pendientes' => $pendientes,
            'pliegos' => $pliegos,
            'papeles' => $papeles,
        ]);
    }

    /**
     * Crear un nuevo pliego agrupando ordenes.
     */
    public function store(Request $request)
    {
        $request->validate([
            'item_id' => 'required|exists:items,id',
            'ordenes' => 'required|array|min:1',
        ]);

        DB::beginTransaction();

        try {
            $pliego = PliegoImpresion::create([
                'item_id' => $request->item_id,
                'estado' => OrdenEstado::PENDIENTE->value,
                'operario_id' => auth()->id(),
            ]);

            foreach ($request->ordenes as $ordenId) {
                $orden = OrdenProduccion::with(['producto.papelesCompatibles', 'maquina'])->findOrFail($ordenId);
                $anchoArte = (float) ($orden->producto?->ancho_imprimible ?? 0);
                $altoArte = (float) ($orden->producto?->largo_imprimible ?? 0);
                $anchoMaterial = (float) ($material->ancho_cm ?? 0);
                $altoMaterial = (float) ($material->largo_cm ?? 0);

                if (!$orden->maquina || !$orden->maquina->permite_nesting) {
                    throw new \Exception("La orden #{$orden->id} esta asignada a un proceso que no permite nesting.");
                }

                if ($anchoArte <= 0 || $altoArte <= 0) {
                    throw new \Exception("La orden #{$orden->id} ({$orden->producto?->nombre}) no tiene ancho y alto imprimible configurados.");
                }

                if ($anchoMaterial <= 0 || (!$material->es_rollo && $altoMaterial <= 0)) {
                    throw new \Exception("El soporte {$material->nombre} no tiene medidas suficientes para nesting.");
                }

                if ($orden->materia_prima_id && (int) $orden->materia_prima_id !== (int) $request->item_id) {
                    throw new \Exception("La orden #{$orden->id} requiere un papel o soporte distinto al seleccionado.");
                }

                $papelesCompatibles = $orden->producto?->papelesCompatibles ?? collect();
                if ($papelesCompatibles->isNotEmpty() && !$papelesCompatibles->contains('id', (int) $request->item_id)) {
                    throw new \Exception("El papel seleccionado no es compatible con {$orden->producto?->nombre}.");
                }

                if ($orden->maquina?->ancho_maximo_cm && $anchoMaterial > (float) $orden->maquina->ancho_maximo_cm) {
                    throw new \Exception("El soporte {$material->nombre} excede el ancho maximo de la maquina {$orden->maquina->nombre}.");
                }

                if (!$material->es_rollo && $orden->maquina?->largo_maximo_cm && $altoMaterial > (float) $orden->maquina->largo_maximo_cm) {
                    throw new \Exception("El soporte {$material->nombre} excede el largo maximo de la maquina {$orden->maquina->nombre}.");
                }

                $pliego->items()->attach($orden->id, [
                    'cantidad_asignada' => $orden->cantidad,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);

                $orden->update([
                    'estado' => OrdenEstado::NESTING->value,
                    'materia_prima_id' => $orden->materia_prima_id ?: $request->item_id,
                ]);
            }

            DB::commit();

            return back()->with('success', 'Pliego armado correctamente.');
        } catch (\Exception $e) {
            DB::rollBack();

            return back()->with('error', 'Error al armar pliego: ' . $e->getMessage());
        }
    }

    /**
     * Marcar pliego como impreso y consumir el material.
     */
    public function imprimir(Request $request, $id)
    {
        $request->validate([
            'material_id' => 'required|exists:items,id',
            'cantidad_utilizada' => 'nullable|numeric|min:0.01',
        ]);

        $pliego = PliegoImpresion::with('items.venta')->findOrFail($id);
        $material = Item::findOrFail($request->material_id);

        DB::beginTransaction();

        try {
            if ((int) $pliego->item_id !== (int) $material->id) {
                throw new \Exception('El material utilizado debe coincidir con el papel o soporte definido para el pliego.');
            }

            $cantidadCalculada = round((float) $pliego->items->sum(function ($orden) {
                if (!empty($orden->cantidad_material_calculada)) {
                    return (float) $orden->cantidad_material_calculada;
                }

                return (float) ($orden->pliegos ?? 0);
            }), 4);

            $cantidadUtilizada = (float) ($request->cantidad_utilizada ?: $cantidadCalculada);

            if ($cantidadUtilizada <= 0) {
                throw new \Exception('No fue posible calcular la cantidad de material a consumir para este pliego.');
            }

            if ($material->stock_actual < $cantidadUtilizada) {
                throw new \Exception("Stock insuficiente de {$material->nombre}. Disponible: {$material->stock_actual}, Requerido: {$cantidadUtilizada}");
            }

            $stockAnterior = (float) $material->stock_actual;
            $costoAnterior = (float) $material->costo_promedio;
            $stockPosterior = $stockAnterior - $cantidadUtilizada;

            $material->update([
                'stock_actual' => $stockPosterior,
            ]);

            app(InventoryMovementService::class)->record(
                item: $material,
                naturaleza: 'Salida',
                cantidad: $cantidadUtilizada,
                costoUnitario: $costoAnterior,
                stockAnterior: $stockAnterior,
                stockPosterior: $stockPosterior,
                costoAnterior: $costoAnterior,
                costoPosterior: $costoAnterior,
                origen: 'Consumo Pliego',
                origenId: $pliego->id,
                referencia: "PLG-{$pliego->id}",
                observacion: 'Consumo de material en proceso de nesting o impresion',
                meta: [
                    'material_utilizado_id' => $material->id,
                    'cantidad_ordenes' => $pliego->items->count(),
                    'cantidad_calculada' => $cantidadCalculada,
                ]
            );

            $pliego->update([
                'estado' => 'Impreso',
                'material_utilizado_id' => $material->id,
                'cantidad_material' => $cantidadUtilizada,
            ]);

            foreach ($pliego->items as $orden) {
                $this->orderService->avanzarOrdenProduccion($orden, OrdenEstado::PRODUCCION->value);
            }

            $config = \App\Models\TenantConfig::getSettings();
            if ($config->cta_costo_produccion_id && $config->cta_inventario_id) {
                $valorCosto = $cantidadUtilizada * $material->costo_promedio;

                \App\Services\AccountingService::registrarAsiento(
                    now(),
                    "CONS-PLIEGO-{$pliego->id}",
                    "Consumo de Material en Nesting #{$pliego->id} - Material: {$material->nombre}",
                    [
                        [
                            'account_id' => $config->cta_costo_produccion_id,
                            'debito' => $valorCosto,
                            'credito' => 0,
                        ],
                        [
                            'account_id' => $config->cta_inventario_id,
                            'debito' => 0,
                            'credito' => $valorCosto,
                        ],
                    ]
                );
            }

            DB::commit();

            return back()->with('success', "Pliego impreso. Se descontaron {$cantidadUtilizada} unidades de {$material->nombre} y se registro el costo.");
        } catch (\Exception $e) {
            DB::rollBack();

            return back()->with('error', 'Error al imprimir: ' . $e->getMessage());
        }
    }
}
