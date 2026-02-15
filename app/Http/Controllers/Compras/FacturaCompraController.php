<?php

namespace App\Http\Controllers\Compras;

use App\Http\Controllers\Controller;
use App\Models\FacturaCompra;
use App\Models\OrdenCompra;
use App\Models\Item;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Barryvdh\DomPDF\Facade\Pdf;

class FacturaCompraController extends Controller
{
    public function index()
    {
        if (request()->is('api/*')) {
            return response()->json(FacturaCompra::with(['proveedor', 'ordenOriginal'])->orderBy('id', 'desc')->get());
        }
        
        return inertia('Compras/Facturas/Index');
    }

    public function show($id)
    {
        if (request()->is('api/*')) {
            return response()->json(
                FacturaCompra::with(['proveedor', 'ordenOriginal', 'detalles.item'])->findOrFail($id)
            );
        }
        
        return inertia('Compras/Facturas/Show', ['facturaId' => $id]);
    }

    public function convertirDesdeOrden($ordenId)
    {
        return DB::transaction(function () use ($ordenId) {
            $orden = OrdenCompra::with(['detalles.item', 'proveedor'])->findOrFail($ordenId);

            // Evitar doble conversión
            if ($orden->estado === 'Recibida Total') {
                return redirect()->back()->with('error', 'Esta orden ya fue recibida y facturada.');
            }

            // Calcular totales con ITBMS
            $subtotal = 0;
            $itbms_total = 0;
            
            foreach ($orden->detalles as $detalle) {
                $item = Item::find($detalle->item_id);
                $lineaSubtotal = $detalle->cantidad * $detalle->costo_unitario;
                $tasaItbms = $item && $item->tax ? $item->tax->tasa : 0;
                $lineaItbms = $lineaSubtotal * ($tasaItbms / 100);
                
                $subtotal += $lineaSubtotal;
                $itbms_total += $lineaItbms;
            }
            
            $total = $subtotal + $itbms_total;

            // Crear Factura
            $factura = FacturaCompra::create([
                'numero_factura_proveedor' => 'FC-' . str_pad($ordenId, 6, '0', STR_PAD_LEFT) . '-' . time(),
                'contacto_id' => $orden->contacto_id,
                'orden_compra_id' => $orden->id,
                'fecha_emision' => now(),
                'fecha_vencimiento' => now()->addDays(30),
                'subtotal' => $subtotal,
                'itbms_total' => $itbms_total,
                'total' => $total,
                'saldo_pendiente' => $total,
                'estado' => 'Abierta'
            ]);

            // Crear detalles y actualizar inventario
            foreach ($orden->detalles as $detalle) {
                $item = Item::lockForUpdate()->find($detalle->item_id);
                
                $lineaSubtotal = $detalle->cantidad * $detalle->costo_unitario;
                $tasaItbms = $item && $item->tax ? $item->tax->tasa : 0;
                $lineaItbms = $lineaSubtotal * ($tasaItbms / 100);
                $lineaTotal = $lineaSubtotal + $lineaItbms;

                // Crear detalle de factura
                $factura->detalles()->create([
                    'item_id' => $detalle->item_id,
                    'cantidad' => $detalle->cantidad,
                    'costo_unitario' => $detalle->costo_unitario,
                    'subtotal' => $lineaSubtotal,
                    'tasa_itbms' => $tasaItbms,
                    'monto_itbms' => $lineaItbms,
                    'total' => $lineaTotal
                ]);

                // Actualizar inventario (solo items inventariables)
                if ($item && $item->tipo === 'Inventariable') {
                    $valorActual = $item->stock_actual * $item->costo_promedio;
                    $nuevoValorTotal = $valorActual + $lineaSubtotal;
                    $nuevoStockTotal = $item->stock_actual + $detalle->cantidad;
                    
                    $nuevoCostoPromedio = ($nuevoStockTotal > 0) ? ($nuevoValorTotal / $nuevoStockTotal) : $item->costo_promedio;
                    
                    $item->update([
                        'stock_actual' => $nuevoStockTotal,
                        'costo_promedio' => $nuevoCostoPromedio
                    ]);
                }
            }

            // Actualizar estado de la orden
            $orden->update(['estado' => 'Recibida Total']);

            return redirect()->route('compras.facturas.index')->with('success', 'Factura de compra generada correctamente. Inventario actualizado.');
        });
    }

    public function generarPDF($id)
    {
        try {
            $factura = FacturaCompra::with(['proveedor', 'ordenOriginal', 'detalles.item'])->findOrFail($id);
            
            $pdf = Pdf::loadView('pdf.factura-compra', compact('factura'));
            
            return response()->streamDownload(function() use ($pdf) {
                echo $pdf->output();
            }, "factura-compra-{$factura->numero_factura_proveedor}.pdf");
            
        } catch (\Exception $e) {
            \Log::error('Error generando PDF factura compra: ' . $e->getMessage());
            \Log::error($e->getTraceAsString());
            return redirect()->back()->with('error', 'Error al generar PDF: ' . $e->getMessage());
        }
    }
}