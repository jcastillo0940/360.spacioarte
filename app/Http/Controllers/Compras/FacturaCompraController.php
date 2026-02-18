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

    public function store(Request $request)
    {
        $validated = $request->validate([
            'contacto_id' => 'required|exists:contactos,id',
            'numero_factura_proveedor' => 'required|string',
            'fecha_emision' => 'required|date',
            'fecha_vencimiento' => 'required|date',
            'recepcion_id' => 'nullable|exists:compras_recepciones,id',
            'items' => 'required|array|min:1',
            'items.*.item_id' => 'required|exists:items,id',
            'items.*.item_unit_id' => 'nullable|exists:item_units,id',
            'items.*.cantidad' => 'required|numeric|min:0.01',
            'items.*.costo_unitario' => 'required|numeric|min:0',
        ]);

        $config = TenantConfig::getSettings();
        if (!$config->cta_recepcion_transitoria_id || !$config->cta_itbms_compras_id || !$config->cta_cxp_id) {
            return back()->with('error', 'Falta configurar cuentas contables (Puente Recepción, ITBMS Compras o CxP) para facturar.');
        }

        return DB::transaction(function () use ($validated, $config) {
            $subtotal = 0;
            $itbms_total = 0;

            foreach ($validated['items'] as $itemData) {
                $lineaSubtotal = $itemData['cantidad'] * $itemData['costo_unitario'];
                $item = Item::find($itemData['item_id']);
                $tasa = $item && $item->tax ? $item->tax->tasa : 0;
                $lineaItbms = $lineaSubtotal * ($tasa / 100);

                $subtotal += $lineaSubtotal;
                $itbms_total += $lineaItbms;
            }

            $total = $subtotal + $itbms_total;

            $factura = FacturaCompra::create([
                'numero_factura_proveedor' => $validated['numero_factura_proveedor'],
                'contacto_id' => $validated['contacto_id'],
                'fecha_emision' => $validated['fecha_emision'],
                'fecha_vencimiento' => $validated['fecha_vencimiento'],
                'subtotal' => $subtotal,
                'itbms_total' => $itbms_total,
                'total' => $total,
                'saldo_pendiente' => $total,
                'estado' => 'Abierta'
            ]);

            foreach ($validated['items'] as $itemData) {
                $item = Item::find($itemData['item_id']);
                $tasa = $item && $item->tax ? $item->tax->tasa : 0;
                $lineaSubtotal = $itemData['cantidad'] * $itemData['costo_unitario'];
                $lineaItbms = $lineaSubtotal * ($tasa / 100);

                $factor = 1.00;
                if (!empty($itemData['item_unit_id'])) {
                    $unit = \App\Models\ItemUnit::find($itemData['item_unit_id']);
                    $factor = $unit ? $unit->factor_conversion : 1.00;
                }

                $factura->detalles()->create([
                    'item_id' => $itemData['item_id'],
                    'item_unit_id' => $itemData['item_unit_id'] ?? null,
                    'factor_conversion_usado' => $factor,
                    'cantidad' => $itemData['cantidad'],
                    'costo_unitario' => $itemData['costo_unitario'],
                    'subtotal' => $lineaSubtotal,
                    'tasa_itbms' => $tasa,
                    'monto_itbms' => $lineaItbms,
                    'total' => $lineaSubtotal + $lineaItbms
                ]);
            }

            // Módulo 5.3: Asiento Contable Automático
            $this->generarAsientoFactura($factura, $subtotal, $itbms_total, $total, $config);

            if (!empty($validated['recepcion_id'])) {
                $recep = \App\Models\CompraRecepcion::find($validated['recepcion_id']);
                $recep->update(['estado' => 'Facturado']);
            }

            return redirect()->route('compras.facturas.show', $factura->id)->with('success', 'Factura de compra registrada y contabilizada.');
        });
    }

    private function generarAsientoFactura($factura, $subtotal, $itbms, $total, $config)
    {
        \App\Services\AccountingService::registrarAsiento(
            $factura->fecha_emision,
            "FACT-{$factura->numero_factura_proveedor}",
            "Factura de Compra #{$factura->numero_factura_proveedor} - Proveedor: {$factura->proveedor->razon_social}",
            [
                [
                    'account_id' => $config->cta_recepcion_transitoria_id,
                    'debito' => $subtotal, // Débito (-): se cancela el pasivo transitorio
                    'credito' => 0
                ],
                [
                    'account_id' => $config->cta_itbms_compras_id,
                    'debito' => $itbms, // Débito (+): Impuesto por cobrar
                    'credito' => 0
                ],
                [
                    'account_id' => $config->cta_cxp_id,
                    'debito' => 0,
                    'credito' => $total // Crédito (+): CxP Real
                ]
            ]
        );
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

    public function convertirDesdeOrden(Request $request, $ordenId)
    {
        $orden = OrdenCompra::with('detalles.item')->findOrFail($ordenId);
        
        // 1. Evitar duplicados
        $existe = FacturaCompra::where('orden_compra_id', $ordenId)->first();
        if ($existe) {
            return redirect()->route('compras.facturas.show', $existe->id)
                ->with('error', 'Esta orden ya fue facturada anteriormente.');
        }

        if ($orden->estado === 'Cancelada') {
            return back()->with('error', 'No se puede facturar una orden cancelada.');
        }

        DB::beginTransaction();
        try {
            $subtotal = 0;
            $itbms_total = 0;

            foreach ($orden->detalles as $detalle) {
                $lineaSubtotal = $detalle->cantidad * $detalle->costo_unitario;
                $tasa = $detalle->item->tax ? $detalle->item->tax->tasa : 0;
                $lineaItbms = $lineaSubtotal * ($tasa / 100);

                $subtotal += $lineaSubtotal;
                $itbms_total += $lineaItbms;
            }

            $total = $subtotal + $itbms_total;

            $factura = FacturaCompra::create([
                'numero_factura_proveedor' => 'FAC-PROV-' . $orden->numero_orden,
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

            foreach ($orden->detalles as $detalle) {
                $tasa = $detalle->item->tax ? $detalle->item->tax->tasa : 0;
                $lineaSubtotal = $detalle->cantidad * $detalle->costo_unitario;
                $lineaItbms = $lineaSubtotal * ($tasa / 100);

                $factura->detalles()->create([
                    'item_id' => $detalle->item_id,
                    'item_unit_id' => $detalle->item_unit_id,
                    'factor_conversion_usado' => $detalle->factor_conversion_usado ?? 1.00,
                    'cantidad' => $detalle->cantidad,
                    'costo_unitario' => $detalle->costo_unitario,
                    'subtotal' => $lineaSubtotal,
                    'tasa_itbms' => $tasa,
                    'monto_itbms' => $lineaItbms,
                    'total' => $lineaSubtotal + $lineaItbms
                ]);
            }

            DB::commit();
            return redirect()->route('compras.facturas.show', $factura->id)
                ->with('success', 'Factura generada desde Orden de Compra.');

        } catch (\Exception $e) {
            DB::rollBack();
            return back()->with('error', 'Error al convertir: ' . $e->getMessage());
        }
    }
}