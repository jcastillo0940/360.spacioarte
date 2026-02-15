<?php

namespace App\Http\Controllers\Produccion;

use App\Http\Controllers\Controller;
use App\Models\ProduccionRequisicion;
use App\Models\Item;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class RequisicionController extends Controller
{
    public function index()
    {
        return Inertia::render('Produccion/Requisiciones/Index', [
            'requisiciones' => ProduccionRequisicion::with(['solicitante', 'items.producto'])->latest()->get(),
            'consumibles'   => Item::where('tipo', 'Consumible')->where('activo', true)->get()
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'items' => 'required|array|min:1',
            'items.*.item_id' => 'required|exists:items,id',
            'items.*.cantidad' => 'required|numeric|min:0.1'
        ]);

        DB::beginTransaction();
        try {
            $req = ProduccionRequisicion::create([
                'user_id' => auth()->id(),
                'estado'  => 'Pendiente',
                'notas_solicitante' => $request->notas
            ]);

            foreach ($request->items as $item) {
                $req->items()->create([
                    'item_id' => $item['item_id'],
                    'cantidad_solicitada' => $item['cantidad']
                ]);
            }

            DB::commit();
            return back()->with('success', 'Solicitud de insumos enviada a bodega.');
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->with('error', 'Error al solicitar: ' . $e->getMessage());
        }
    }

    public function entregar(Request $request, $id)
    {
        // Solo el Jefe de Bodega puede autorizar
        if (!auth()->user()->hasRole('Jefe de Bodega') && !auth()->user()->hasRole('Administrador Total')) {
            return back()->with('error', 'No tiene permisos para autorizar salidas de bodega.');
        }

        $req = ProduccionRequisicion::with('items.producto')->findOrFail($id);

        DB::beginTransaction();
        try {
            $req->update([
                'estado' => 'Entregado',
                'jefe_bodega_id' => auth()->id(),
                'notas_bodega' => $request->notas
            ]);

            // Descuento manual de botes/cartuchos
            foreach ($req->items as $item) {
                $item->producto->decrement('stock_actual', $item->cantidad_solicitada);
            }

            DB::commit();
            return back()->with('success', 'Insumos entregados y stock actualizado.');
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->with('error', 'Error en entrega: ' . $e->getMessage());
        }
    }
}