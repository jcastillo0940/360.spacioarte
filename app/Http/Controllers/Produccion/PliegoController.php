<?php

namespace App\Http\Controllers\Produccion;

use App\Http\Controllers\Controller;
use App\Models\PliegoImpresion;
use App\Models\OrdenProduccion;
use App\Models\Item;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

use App\Enums\OrdenEstado;
use App\Services\Production\OrderService;

class PliegoController extends Controller
{
    protected OrderService $orderService;

    public function __construct(OrderService $orderService)
    {
        $this->orderService = $orderService;
    }

    /**
     * Listado de pliegos y órdenes pendientes de agrupar.
     */
    public function index()
    {
        // Órdenes que están aprobadas por el cliente pero aún no tienen pliego
        // Usamos el estado unificado para pendientes de producción/nesting
        $pendientes = OrdenProduccion::with(['venta.cliente', 'materiaPrima'])
            ->whereIn('estado', [OrdenEstado::PENDIENTE->value, OrdenEstado::NESTING->value])
            ->get();

        $pliegos = PliegoImpresion::with(['materiaPrima', 'items.venta'])
            ->orderBy('id', 'desc')
            ->take(20)
            ->get();

        $papeles = Item::where('es_para_nesting', true)
            ->where('activo', true)
            ->select('id', 'nombre', 'stock_actual')
            ->get();

        return Inertia::render('Produccion/Pliegos/Index', [
            'pendientes' => $pendientes,
            'pliegos'    => $pliegos,
            'papeles'    => $papeles
        ]);
    }

    /**
     * Crear un nuevo pliego agrupando órdenes (Nesting)
     */
    public function store(Request $request)
    {
        $request->validate([
            'item_id' => 'required|exists:items,id', // El tipo de papel usado
            'ordenes' => 'required|array|min:1',
        ]);

        DB::beginTransaction();
        try {
            // 1. Crear el contenedor Pliego
            $pliego = PliegoImpresion::create([
                'item_id'     => $request->item_id,
                'estado'      => OrdenEstado::PENDIENTE->value, // El pliego nace pendiente de imprimir
                'operario_id' => auth()->id()
            ]);

            // 2. Vincular las órdenes al pliego
            foreach ($request->ordenes as $ordenId) {
                $orden = OrdenProduccion::findOrFail($ordenId);
                
                $pliego->items()->attach($orden->id, [
                    'cantidad_asignada' => $orden->cantidad,
                    'created_at' => now(),
                    'updated_at' => now()
                ]);

                // 3. Cambiar estado de la orden a "Pre-Prensa" (Nesting)
                // Usamos update directo porque aquí no hay consumo de inventario aún
                $orden->update(['estado' => OrdenEstado::NESTING->value]);
            }

            DB::commit();
            return back()->with('success', 'Pliego armado correctamente.');
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->with('error', 'Error al armar pliego: ' . $e->getMessage());
        }
    }

    /**
     * Marcar pliego como IMPRESO: Esto distribuye las tareas a las máquinas finales
     */
    public function imprimir(Request $request, $id)
    {
        $request->validate([
            'material_id' => 'required|exists:items,id',
            'cantidad_utilizada' => 'required|numeric|min:0.01'
        ]);

        $pliego = PliegoImpresion::with('items.venta')->findOrFail($id);
        $material = Item::findOrFail($request->material_id);

        DB::beginTransaction();
        try {
            // Validar stock disponible
            if ($material->stock_actual < $request->cantidad_utilizada) {
                throw new \Exception("Stock insuficiente de {$material->nombre}. Disponible: {$material->stock_actual}, Requerido: {$request->cantidad_utilizada}");
            }

            // Descontar inventario
            $material->decrement('stock_actual', $request->cantidad_utilizada);

            // Actualizar pliego
            $pliego->update([
                'estado' => 'Impreso',
                'material_utilizado_id' => $material->id,
                'cantidad_material' => $request->cantidad_utilizada
            ]);

            // Al marcar el pliego como impreso, todas sus órdenes pasan a PRODUCCION
            foreach ($pliego->items as $orden) {
                $this->orderService->avanzarOrdenProduccion($orden, OrdenEstado::PRODUCCION->value);
            }

            DB::commit();
            return back()->with('success', "Pliego impreso. Se descontaron {$request->cantidad_utilizada} unidades de {$material->nombre}.");
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->with('error', 'Error al imprimir: ' . $e->getMessage());
        }
    }
}