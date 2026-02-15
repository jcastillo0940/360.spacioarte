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
            $productos = Item::where('activo', true)->get();
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
                OrdenCompra::with(['proveedor', 'detalles.item'])->findOrFail($id)
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
                $orden->detalles()->create([
                    'item_id' => $item['item_id'],
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
                $orden->detalles()->create([
                    'item_id' => $item['item_id'],
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
            $orden = OrdenCompra::with(['proveedor', 'detalles.item'])->findOrFail($id);
            
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
}