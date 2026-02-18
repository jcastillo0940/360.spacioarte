<?php

namespace App\Http\Controllers\Compras;

use App\Http\Controllers\Controller;
use App\Models\OrdenCompra;
use App\Models\Contacto;
use App\Models\Item;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Barryvdh\DomPDF\Facade\Pdf;

class OrdenCompraController extends Controller
{
    public function index()
    {
        if (request()->is('api/*')) {
            return response()->json(OrdenCompra::with(['proveedor'])->orderBy('id', 'desc')->get());
        }
        return inertia('Compras/Ordenes/Index');
    }

    public function getDatos()
    {
        try {
            $proveedores = Contacto::where('es_proveedor', true)->get();
            $productos = Item::with('units')->where('activo', true)->get();
            return response()->json([
                'proveedores' => $proveedores,
                'productos' => $productos
            ]);
        } catch (\Exception $e) {
            \Log::error('Error en getDatos compras: ' . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function show($id)
    {
        if (request()->is('api/*')) {
            return response()->json(
                OrdenCompra::with(['proveedor', 'detalles.item', 'detalles.unit'])->findOrFail($id)
            );
        }
        return inertia('Compras/Ordenes/Show', ['ordenId' => $id]);
    }

    public function edit($id)
    {
        return inertia('Compras/Ordenes/Edit', ['ordenId' => $id]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'contacto_id' => 'required|exists:contactos,id',
            'fecha_pedido' => 'required|date',
            'fecha_entrega' => 'required|date|after_or_equal:fecha_pedido',
            'items' => 'required|array|min:1',
            'items.*.item_id' => 'required|exists:items,id',
            'items.*.item_unit_id' => 'nullable|exists:item_units,id',
            'items.*.cantidad' => 'required|numeric|min:0.01',
            'items.*.costo_unitario' => 'required|numeric|min:0'
        ]);

        return DB::transaction(function () use ($validated) {
            $total = collect($validated['items'])->sum(fn($i) => $i['cantidad'] * $i['costo_unitario']);

            $ultimaOrden = OrdenCompra::latest('id')->first();
            $numeroOrden = 'OC-' . str_pad(($ultimaOrden ? $ultimaOrden->id + 1 : 1), 6, '0', STR_PAD_LEFT);

            $orden = OrdenCompra::create([
                'numero_orden' => $numeroOrden,
                'contacto_id' => $validated['contacto_id'],
                'fecha_emision' => $validated['fecha_pedido'],
                'fecha_entrega' => $validated['fecha_entrega'],
                'total' => $total,
                'estado' => 'Borrador'
            ]);

            foreach ($validated['items'] as $item) {
                $factor = 1.00;
                if (!empty($item['item_unit_id'])) {
                    $unit = \App\Models\ItemUnit::find($item['item_unit_id']);
                    $factor = $unit ? $unit->factor_conversion : 1.00;
                }

                $orden->detalles()->create([
                    'item_id' => $item['item_id'],
                    'item_unit_id' => $item['item_unit_id'] ?? null,
                    'factor_conversion_usado' => $factor,
                    'cantidad' => $item['cantidad'],
                    'costo_unitario' => $item['costo_unitario'],
                    'total' => $item['cantidad'] * $item['costo_unitario']
                ]);
            }

            return redirect()->route('compras.ordenes.index')->with('success', 'Orden creada');
        });
    }

    public function update(Request $request, $id)
    {
        $orden = OrdenCompra::findOrFail($id);
        $validated = $request->validate([
            'contacto_id' => 'required|exists:contactos,id',
            'fecha_pedido' => 'required|date',
            'fecha_entrega' => 'required|date|after_or_equal:fecha_pedido',
            'estado' => 'required|in:Borrador,Enviada,Confirmada,Recibida Total,Recibida Parcial,Cancelada',
            'items' => 'required|array|min:1',
            'items.*.item_id' => 'required|exists:items,id',
            'items.*.item_unit_id' => 'nullable|exists:item_units,id',
            'items.*.cantidad' => 'required|numeric|min:0.01',
            'items.*.costo_unitario' => 'required|numeric|min:0'
        ]);

        return DB::transaction(function () use ($validated, $orden) {
            $total = collect($validated['items'])->sum(fn($i) => $i['cantidad'] * $i['costo_unitario']);

            $orden->update([
                'contacto_id' => $validated['contacto_id'],
                'fecha_emision' => $validated['fecha_pedido'],
                'fecha_entrega' => $validated['fecha_entrega'],
                'estado' => $validated['estado'],
                'total' => $total
            ]);

            $orden->detalles()->delete();
            foreach ($validated['items'] as $item) {
                $factor = 1.00;
                if (!empty($item['item_unit_id'])) {
                    $unit = \App\Models\ItemUnit::find($item['item_unit_id']);
                    $factor = $unit ? $unit->factor_conversion : 1.00;
                }

                $orden->detalles()->create([
                    'item_id' => $item['item_id'],
                    'item_unit_id' => $item['item_unit_id'] ?? null,
                    'factor_conversion_usado' => $factor,
                    'cantidad' => $item['cantidad'],
                    'costo_unitario' => $item['costo_unitario'],
                    'total' => $item['cantidad'] * $item['costo_unitario']
                ]);
            }

            return redirect()->route('compras.ordenes.show', $orden->id)->with('success', 'Actualizada');
        });
    }

    public function generarPDF($id)
    {
        try {
            $orden = OrdenCompra::with(['proveedor', 'detalles.item', 'detalles.unit'])->findOrFail($id);
            
            // Usamos el nombre de la vista que definimos anteriormente
            $pdf = Pdf::loadView('pdf.orden-compra', compact('orden'));
            
            return $pdf->setPaper('a4', 'portrait')->stream("OC-{$orden->numero_orden}.pdf");
            
        } catch (\Exception $e) {
            \Log::error('Error PDF: ' . $e->getMessage());
            return redirect()->back()->with('error', 'Error al generar PDF');
        }
    }

    public function updateEstado(Request $request, $id)
    {
        $orden = OrdenCompra::findOrFail($id);
        $validated = $request->validate(['estado' => 'required|in:Borrador,Enviada,Confirmada,Recibida Total,Recibida Parcial,Cancelada']);
        $orden->update(['estado' => $validated['estado']]);
        return redirect()->back()->with('success', 'Estado actualizado');
    }

    public function destroy($id)
    {
        $orden = OrdenCompra::findOrFail($id);
        if ($orden->estado !== 'Borrador') return redirect()->back()->with('error', 'Solo borradores');
        $orden->delete();
        return redirect()->route('compras.ordenes.index')->with('success', 'Eliminada');
    }

    /**
     * Convierte una requisición aprobada en una Orden de Compra (Módulo 3 DRS)
     */
    public function crearDesdeRequisicion(Request $request, $requisicionId)
    {
        $req = \App\Models\ProduccionRequisicion::with('items.producto.units')->findOrFail($requisicionId);

        if ($req->estado !== 'Aprobada') {
            return back()->with('error', 'La requisición debe estar aprobada.');
        }

        DB::beginTransaction();
        try {
            // Buscamos un proveedor (el último usado para estos productos o el primero de la lista)
            $proveedorId = $request->contacto_id ?: Contacto::where('es_proveedor', true)->first()?->id;

            $ultimaOrden = OrdenCompra::latest('id')->first();
            $numeroOrden = 'OC-' . str_pad(($ultimaOrden ? $ultimaOrden->id + 1 : 1), 6, '0', STR_PAD_LEFT);

            $orden = OrdenCompra::create([
                'numero_orden' => $numeroOrden,
                'contacto_id' => $proveedorId,
                'requisicion_id' => $req->id,
                'fecha_emision' => now(),
                'fecha_entrega' => now()->addDays(3),
                'estado' => 'Borrador',
                'notas' => 'Generada desde Requisición #' . $req->id
            ]);

            $totalOrden = 0;
            foreach ($req->items as $rItem) {
                // Intentar mantener la unidad de la requisición si es apta para compra
                $unidad = null;
                if ($rItem->item_unit_id) {
                    $uReq = \App\Models\ItemUnit::find($rItem->item_unit_id);
                    if ($uReq && $uReq->es_unidad_compra) {
                        $unidad = $uReq;
                    }
                }

                // Si no, buscamos la primera unidad marcada para compra
                if (!$unidad) {
                    $unidad = $rItem->producto->units()
                        ->where('es_unidad_compra', true)
                        ->first();
                }

                $cantidadOC = $rItem->cantidad_base_equivalente;
                $unitId = null;
                $factor = 1.00;
                $costoUnitario = $rItem->producto->costo_promedio ?: 0;

                if ($unidad) {
                    $unitId = $unidad->id;
                    $factor = $unidad->factor_conversion;
                    // Sugerir redondeo hacia arriba para cubrir necesidad
                    $cantidadOC = ceil($rItem->cantidad_base_equivalente / $factor);
                    
                    // Prioridad de costo: 1. Costo específico de la unidad, 2. Promedio * Factor
                    if ($unidad->costo_compra > 0) {
                        $costoUnitario = $unidad->costo_compra;
                    } else {
                        $costoUnitario = $costoUnitario * $factor;
                    }
                }

                $totalLinea = $cantidadOC * $costoUnitario;
                $totalOrden += $totalLinea;

                $orden->detalles()->create([
                    'item_id' => $rItem->item_id,
                    'item_unit_id' => $unitId,
                    'factor_conversion_usado' => $factor,
                    'cantidad' => $cantidadOC,
                    'costo_unitario' => $costoUnitario,
                    'total' => $totalLinea
                ]);
            }

            $orden->update(['total' => $totalOrden]);
            $req->update(['estado' => 'Procesada a OC']);

            DB::commit();
            return redirect()->route('compras.ordenes.edit', $orden->id)
                ->with('success', 'Orden de compra sugerida generada desde la requisición.');

        } catch (\Exception $e) {
            DB::rollBack();
            return back()->with('error', 'Error al procesar: ' . $e->getMessage());
        }
    }
}