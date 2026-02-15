<?php

namespace App\Http\Controllers\Produccion;

use App\Http\Controllers\Controller;
use App\Models\PliegoImpresion;
use App\Models\OrdenProduccion;
use App\Models\Item;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class PliegoController extends Controller
{
    /**
     * Listado de pliegos y órdenes pendientes de agrupar.
     */
    public function index()
    {
        // Órdenes que están aprobadas por el cliente pero aún no tienen pliego
        $pendientes = OrdenProduccion::with(['venta.cliente', 'materiaPrima'])
            ->where('estado', 'Pendiente')
            ->get();

        $pliegos = PliegoImpresion::with(['materiaPrima', 'items.venta'])
            ->orderBy('id', 'desc')
            ->take(20)
            ->get();

        $papeles = Item::where('tipo', 'Materia Prima')
            ->where('nombre', 'like', '%Pliego%')
            ->orWhere('nombre', 'like', '%Hoja%')
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
                'estado'      => 'Pendiente',
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

                // 3. Cambiar estado de la orden a "En Pliego"
                $orden->update(['estado' => 'En Pliego']);
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
    public function imprimir($id)
    {
        $pliego = PliegoImpresion::with('ordenesProduccion')->findOrFail($id);

        DB::beginTransaction();
        try {
            $pliego->update(['estado' => 'Impreso']);

            // Al marcar el pliego como impreso, todas sus órdenes pasan a cola de máquina
            foreach ($pliego->ordenesProduccion as $orden) {
                $orden->update(['estado' => 'Impreso']); // Ahora son visibles en PlantaController
            }

            DB::commit();
            return back()->with('success', 'Pliego impreso. Las órdenes han pasado a las colas de máquinas.');
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->with('error', 'Error al procesar impresión: ' . $e->getMessage());
        }
    }
}