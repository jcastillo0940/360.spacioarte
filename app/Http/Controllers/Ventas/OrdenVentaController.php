<?php

namespace App\Http\Controllers\Ventas;

use App\Http\Controllers\Controller;
use App\Models\OrdenVenta;
use App\Models\Contacto;
use App\Models\Item;
use App\Models\Vendedor;
use App\Models\OrdenProduccion;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class OrdenVentaController extends Controller
{
    public function index()
    {
        if (request()->is('api/*')) {
            return response()->json(
                OrdenVenta::with(['cliente', 'vendedor', 'sucursal'])
                    ->orderBy('id', 'desc')
                    ->get()
            );
        }
        
        return inertia('Ventas/Ordenes/Index');
    }

    public function getDatos()
    {
        try {
            $clientes = Contacto::where('es_cliente', true)->get();
            
            $productos = Item::with(['tax', 'procesoDefault'])
                ->where('activo', true)
                ->get();

            $vendedores = Vendedor::where('activo', true)->get();
            
            return response()->json([
                'clientes' => $clientes,
                'productos' => $productos,
                'vendedores' => $vendedores
            ]);
        } catch (\Exception $e) {
            Log::error('Error en getDatos OrdenVenta: ' . $e->getMessage());
            return response()->json([
                'error' => $e->getMessage(),
                'clientes' => [],
                'productos' => [],
                'vendedores' => []
            ], 500);
        }
    }

    public function show($id)
    {
        try {
            if (request()->is('api/*')) {
                // CORRECCIÓN: Se eliminó 'mensajes.usuario' para que no busque la tabla inexistente.
                // Todo el chat se manejará vía Pusher.
                $orden = OrdenVenta::with([
                    'cliente', 
                    'vendedor', 
                    'sucursal', 
                    'detalles.item.procesoDefault', 
                    'produccion.maquina' 
                ])->findOrFail($id);

                return response()->json($orden);
            }
            
            return inertia('Ventas/Ordenes/Show', ['ordenId' => $id]);
        } catch (\Exception $e) {
            Log::error("Error mostrando orden #{$id}: " . $e->getMessage());
            return response()->json(['error' => 'Error interno: ' . $e->getMessage()], 500);
        }
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'contacto_id' => 'required|exists:contactos,id',
            'sucursal_id' => 'nullable|exists:sucursales,id',
            'vendedor_id' => 'nullable|exists:vendedores,id',
            'fecha_emision' => 'required|date',
            'fecha_entrega' => 'required|date|after_or_equal:fecha_emision',
            'items' => 'required|array|min:1',
            'items.*.item_id' => 'required|exists:items,id',
            'items.*.cantidad' => 'required|numeric|min:0.01',
            'items.*.precio_unitario' => 'required|numeric|min:0',
            'items.*.tasa_itbms' => 'required|numeric|min:0|max:100'
        ]);

        DB::beginTransaction();
        try {
            $subtotal = 0;
            $itbms_total = 0;
            
            foreach ($validated['items'] as $item) {
                $lineaSubtotal = $item['cantidad'] * $item['precio_unitario'];
                $subtotal += $lineaSubtotal;
                $itbms_total += $lineaSubtotal * ($item['tasa_itbms'] / 100);
            }
            
            $total = $subtotal + $itbms_total;

            $ultimaOrden = OrdenVenta::latest('id')->first();
            $numeroOrden = 'OV-' . str_pad(($ultimaOrden ? $ultimaOrden->id + 1 : 1), 6, '0', STR_PAD_LEFT);

            $orden = OrdenVenta::create([
                'numero_orden' => $numeroOrden,
                'contacto_id' => $validated['contacto_id'],
                'sucursal_id' => $validated['sucursal_id'],
                'vendedor_id' => $validated['vendedor_id'],
                'fecha_emision' => $validated['fecha_emision'],
                'fecha_entrega' => $validated['fecha_entrega'],
                'subtotal' => $subtotal,
                'itbms_total' => $itbms_total,
                'total' => $total,
                'estado' => 'Borrador'
            ]);

            foreach ($validated['items'] as $item) {
                $lineaSubtotal = $item['cantidad'] * $item['precio_unitario'];
                
                $orden->detalles()->create([
                    'item_id' => $item['item_id'],
                    'cantidad' => $item['cantidad'],
                    'precio_unitario' => $item['precio_unitario'],
                    'subtotal' => $lineaSubtotal,
                    'porcentaje_itbms' => $item['tasa_itbms'], 
                    'total' => $lineaSubtotal + ($lineaSubtotal * ($item['tasa_itbms'] / 100))
                ]);
            }

            DB::commit();
            return redirect()->route('ordenes.index')->with('success', 'Orden creada correctamente');
            
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error creando orden: ' . $e->getMessage());
            return redirect()->back()->with('error', 'Error al crear la orden: ' . $e->getMessage());
        }
    }

    public function update(Request $request, OrdenVenta $orden)
    {
        if (!in_array($orden->estado, ['Borrador', 'Confirmada'])) {
            return redirect()->back()->with('error', 'No se puede editar esta orden.');
        }

        $validated = $request->validate([
            'contacto_id' => 'required|exists:contactos,id',
            'sucursal_id' => 'nullable|exists:sucursales,id',
            'vendedor_id' => 'nullable|exists:vendedores,id',
            'fecha_emision' => 'required|date',
            'fecha_entrega' => 'nullable|date|after_or_equal:fecha_emision',
            'estado' => 'required|in:Borrador,Confirmada,Facturada,Cancelada',
            'items' => 'required|array|min:1',
            'items.*.item_id' => 'required|exists:items,id',
            'items.*.cantidad' => 'required|numeric|min:0.01',
            'items.*.precio_unitario' => 'required|numeric|min:0'
        ]);

        DB::beginTransaction();
        try {
            $subtotal = 0;
            $itbms_total = 0;
            
            foreach ($validated['items'] as $item) {
                $producto = Item::with('tax')->find($item['item_id']);
                $tasa_itbms = $producto->tax ? $producto->tax->porcentaje : 0;
                
                $lineaSubtotal = $item['cantidad'] * $item['precio_unitario'];
                $subtotal += $lineaSubtotal;
                $itbms_total += $lineaSubtotal * ($tasa_itbms / 100);
            }
            
            $total = $subtotal + $itbms_total;

            $orden->update([
                'contacto_id' => $validated['contacto_id'],
                'sucursal_id' => $validated['sucursal_id'] ?? $orden->sucursal_id,
                'vendedor_id' => $validated['vendedor_id'],
                'fecha_emision' => $validated['fecha_emision'],
                'fecha_entrega' => $validated['fecha_entrega'],
                'estado' => $validated['estado'],
                'subtotal' => $subtotal,
                'itbms_total' => $itbms_total,
                'total' => $total,
            ]);

            $orden->detalles()->delete();

            foreach ($validated['items'] as $item) {
                $producto = Item::with('tax')->find($item['item_id']);
                $tasa_itbms = $producto->tax ? $producto->tax->porcentaje : 0;
                
                $lineaSubtotal = $item['cantidad'] * $item['precio_unitario'];
                
                $orden->detalles()->create([
                    'item_id' => $item['item_id'],
                    'cantidad' => $item['cantidad'],
                    'precio_unitario' => $item['precio_unitario'],
                    'subtotal' => $lineaSubtotal,
                    'porcentaje_itbms' => $tasa_itbms,
                    'total' => $lineaSubtotal + ($lineaSubtotal * ($tasa_itbms / 100))
                ]);
            }

            DB::commit();
            return response()->json(['message' => 'Orden actualizada']);
            
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error actualizando orden: ' . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function updateEstado(Request $request, OrdenVenta $orden)
    {
        $validated = $request->validate(['estado' => 'required|in:Borrador,Confirmada,Facturada,Cancelada']);
        $orden->update(['estado' => $validated['estado']]);
        return redirect()->back()->with('success', 'Estado actualizado');
    }
}