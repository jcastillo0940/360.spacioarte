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
            'requisiciones' => ProduccionRequisicion::with(['solicitante', 'items.producto', 'items.unit'])->latest()->get(),
            'consumibles'   => Item::with('units')->whereIn('tipo', ['Consumible', 'Materia Prima'])->where('activo', true)->get()
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'items' => 'required|array|min:1',
            'items.*.item_id' => 'required|exists:items,id',
            'items.*.item_unit_id' => 'nullable|exists:item_units,id',
            'items.*.cantidad' => 'required|numeric|min:0.01'
        ]);

        DB::beginTransaction();
        try {
            $req = ProduccionRequisicion::create([
                'user_id' => auth()->id(),
                'estado'  => $request->enviar ? 'Pendiente' : 'Borrador',
                'notas_solicitante' => $request->notas
            ]);

            foreach ($request->items as $item) {
                $factor = 1.00;
                if (!empty($item['item_unit_id'])) {
                    $unit = \App\Models\ItemUnit::find($item['item_unit_id']);
                    $factor = $unit ? $unit->factor_conversion : 1.00;
                }

                $req->items()->create([
                    'item_id' => $item['item_id'],
                    'item_unit_id' => $item['item_unit_id'] ?? null,
                    'factor_conversion_usado' => $factor,
                    'cantidad_solicitada' => $item['cantidad'],
                    'cantidad_base_equivalente' => $item['cantidad'] * $factor,
                    'notas' => $item['notas'] ?? null
                ]);
            }

            DB::commit();
            $msg = $request->enviar ? 'Requisición enviada.' : 'Requisición guardada como borrador.';
            return back()->with('success', $msg);
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->with('error', 'Error al crear requisición: ' . $e->getMessage());
        }
    }

    public function update(Request $request, $id)
    {
        $req = ProduccionRequisicion::findOrFail($id);
        
        if ($req->estado !== 'Borrador') {
            return back()->with('error', 'Solo se pueden editar requisiciones en estado Borrador.');
        }

        $request->validate([
            'items' => 'required|array|min:1',
            'items.*.item_id' => 'required|exists:items,id',
            'items.*.item_unit_id' => 'nullable|exists:item_units,id',
            'items.*.cantidad' => 'required|numeric|min:0.01'
        ]);

        DB::beginTransaction();
        try {
            $req->update([
                'estado' => $request->enviar ? 'Pendiente' : 'Borrador',
                'notas_solicitante' => $request->notas
            ]);

            $req->items()->delete();
            foreach ($request->items as $item) {
                $factor = 1.00;
                if (!empty($item['item_unit_id'])) {
                    $unit = \App\Models\ItemUnit::find($item['item_unit_id']);
                    $factor = $unit ? $unit->factor_conversion : 1.00;
                }

                $req->items()->create([
                    'item_id' => $item['item_id'],
                    'item_unit_id' => $item['item_unit_id'] ?? null,
                    'factor_conversion_usado' => $factor,
                    'cantidad_solicitada' => $item['cantidad'],
                    'cantidad_base_equivalente' => $item['cantidad'] * $factor,
                    'notas' => $item['notas'] ?? null
                ]);
            }

            DB::commit();
            return back()->with('success', 'Requisición actualizada.');
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->with('error', 'Error al actualizar: ' . $e->getMessage());
        }
    }

    public function destroy($id)
    {
        $req = ProduccionRequisicion::findOrFail($id);
        
        if ($req->estado !== 'Borrador') {
            return back()->with('error', 'Solo se pueden eliminar requisiciones en estado Borrador.');
        }

        $req->items()->delete();
        $req->delete();

        return back()->with('success', 'Requisición eliminada.');
    }

    public function enviar(Request $request, $id)
    {
        $req = ProduccionRequisicion::findOrFail($id);
        $req->update(['estado' => 'Pendiente']);
        return back()->with('success', 'Requisición enviada para aprobación.');
    }

    public function aprobar(Request $request, $id)
    {
        if (!auth()->user()->hasRole('Jefe de Bodega') && !auth()->user()->hasRole('Administrador Total')) {
            return back()->with('error', 'No tiene permisos para aprobar requisiciones.');
        }

        $req = ProduccionRequisicion::findOrFail($id);
        $req->update([
            'estado' => 'Aprobada',
            'jefe_bodega_id' => auth()->id()
        ]);

        return back()->with('success', 'Requisición aprobada.');
    }

    public function entregar(Request $request, $id)
    {
        // Solo el Jefe de Bodega puede autorizar
        if (!auth()->user()->hasRole('Jefe de Bodega') && !auth()->user()->hasRole('Administrador Total')) {
            return back()->with('error', 'No tiene permisos para autorizar salidas de bodega.');
        }

        $req = ProduccionRequisicion::with('items.producto')->findOrFail($id);

        if ($req->estado !== 'Aprobada') {
            return back()->with('error', 'La requisición debe estar aprobada antes de entregarse.');
        }

        DB::beginTransaction();
        try {
            $req->update([
                'estado' => 'Entregado',
                'notas_bodega' => $request->notas
            ]);

            // Descuento manual de stock en UNIDAD BASE
            foreach ($req->items as $item) {
                $item->producto->decrement('stock_actual', $item->cantidad_base_equivalente);
            }

            DB::commit();
            return back()->with('success', 'Insumos entregados y stock actualizado.');
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->with('error', 'Error en entrega: ' . $e->getMessage());
        }
    }
}