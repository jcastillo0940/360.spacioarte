<?php

namespace App\Http\Controllers\Ventas;

use App\Http\Controllers\Controller;
use App\Models\OrdenVenta;
use App\Models\Contacto;
use App\Models\Item;
use App\Models\Vendedor;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class OrdenVentaController extends Controller
{
    public function index()
    {
        if (request()->is('api/*')) {
            return response()->json(OrdenVenta::with(['cliente', 'vendedor', 'sucursal'])->orderBy('id', 'desc')->get());
        }
        
        return inertia('Ventas/Ordenes/Index');
    }

    public function getDatos()
    {
        try {
            $clientes = Contacto::where('es_cliente', true)->get();
            $productos = Item::with('tax')->where('activo', true)->get();
            $vendedores = Vendedor::where('activo', true)->get();
            
            return response()->json([
                'clientes' => $clientes,
                'productos' => $productos,
                'vendedores' => $vendedores
            ]);
        } catch (\Exception $e) {
            \Log::error('Error en getDatos: ' . $e->getMessage());
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
        if (request()->is('api/*')) {
            return response()->json(
                OrdenVenta::with(['cliente', 'vendedor', 'sucursal', 'detalles.item'])
                    ->findOrFail($id)
            );
        }
        
        return inertia('Ventas/Ordenes/Show', ['ordenId' => $id]);
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
            // Calcular totales
            $subtotal = 0;
            $itbms_total = 0;
            
            foreach ($validated['items'] as $item) {
                $lineaSubtotal = $item['cantidad'] * $item['precio_unitario'];
                $subtotal += $lineaSubtotal;
                $itbms_total += $lineaSubtotal * ($item['tasa_itbms'] / 100);
            }
            
            $total = $subtotal + $itbms_total;

            // Generar número de orden
            $ultimaOrden = OrdenVenta::latest('id')->first();
            $numeroOrden = 'OV-' . str_pad(($ultimaOrden ? $ultimaOrden->id + 1 : 1), 6, '0', STR_PAD_LEFT);

            // Crear orden
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

            // Crear detalles
            foreach ($validated['items'] as $item) {
                $lineaSubtotal = $item['cantidad'] * $item['precio_unitario'];
                $lineaItbms = $lineaSubtotal * ($item['tasa_itbms'] / 100);
                
                $orden->detalles()->create([
                    'item_id' => $item['item_id'],
                    'cantidad' => $item['cantidad'],
                    'precio_unitario' => $item['precio_unitario'],
                    'subtotal' => $lineaSubtotal,
                    'tasa_itbms' => $item['tasa_itbms'],
                    'monto_itbms' => $lineaItbms,
                    'total' => $lineaSubtotal + $lineaItbms
                ]);
            }

            DB::commit();
            return redirect()->route('ordenes.index')->with('success', 'Orden de venta creada correctamente');
            
        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Error creando orden: ' . $e->getMessage());
            return redirect()->back()->with('error', 'Error al crear la orden: ' . $e->getMessage());
        }
    }

    public function update(Request $request, OrdenVenta $orden)
    {
        // Solo permitir edición si está en Borrador o Confirmada
        if (!in_array($orden->estado, ['Borrador', 'Confirmada'])) {
            return redirect()->back()->with('error', 'No se puede editar una orden en estado ' . $orden->estado);
        }

        $validated = $request->validate([
            'contacto_id' => 'required|exists:contactos,id',
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
            // Calcular totales
            $subtotal = 0;
            $itbms_total = 0;
            
            foreach ($validated['items'] as $item) {
                // Obtener el item para saber su tasa de ITBMS
                $producto = Item::with('tax')->find($item['item_id']);
                $tasa_itbms = $producto->tax ? $producto->tax->porcentaje : 0;
                
                $lineaSubtotal = $item['cantidad'] * $item['precio_unitario'];
                $subtotal += $lineaSubtotal;
                $itbms_total += $lineaSubtotal * ($tasa_itbms / 100);
            }
            
            $total = $subtotal + $itbms_total;

            // Actualizar orden
            $orden->update([
                'contacto_id' => $validated['contacto_id'],
                'vendedor_id' => $validated['vendedor_id'],
                'fecha_emision' => $validated['fecha_emision'],
                'fecha_entrega' => $validated['fecha_entrega'],
                'estado' => $validated['estado'],
                'subtotal' => $subtotal,
                'itbms_total' => $itbms_total,
                'total' => $total,
            ]);

            // Eliminar detalles anteriores
            $orden->detalles()->delete();

            // Crear nuevos detalles
            foreach ($validated['items'] as $item) {
                $producto = Item::with('tax')->find($item['item_id']);
                $tasa_itbms = $producto->tax ? $producto->tax->porcentaje : 0;
                
                $lineaSubtotal = $item['cantidad'] * $item['precio_unitario'];
                $lineaItbms = $lineaSubtotal * ($tasa_itbms / 100);
                
                $orden->detalles()->create([
                    'item_id' => $item['item_id'],
                    'cantidad' => $item['cantidad'],
                    'precio_unitario' => $item['precio_unitario'],
                    'subtotal' => $lineaSubtotal,
                    'tasa_itbms' => $tasa_itbms,
                    'monto_itbms' => $lineaItbms,
                    'total' => $lineaSubtotal + $lineaItbms
                ]);
            }

            DB::commit();
            
            if (request()->is('api/*') || request()->wantsJson()) {
                return response()->json([
                    'message' => 'Orden actualizada correctamente',
                    'data' => $orden->fresh()->load(['cliente', 'vendedor', 'detalles.item'])
                ]);
            }
            
            return redirect()->route('ordenes.index')->with('success', 'Orden actualizada correctamente');
            
        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Error actualizando orden: ' . $e->getMessage());
            
            if (request()->is('api/*') || request()->wantsJson()) {
                return response()->json(['error' => 'Error al actualizar la orden: ' . $e->getMessage()], 500);
            }
            
            return redirect()->back()->with('error', 'Error al actualizar la orden: ' . $e->getMessage());
        }
    }

    public function updateEstado(Request $request, OrdenVenta $orden)
    {
        $validated = $request->validate([
            'estado' => 'required|in:Borrador,Confirmada,Facturada,Cancelada'
        ]);

        $orden->update(['estado' => $validated['estado']]);
        
        return redirect()->back()->with('success', 'Estado actualizado correctamente');
    }
}