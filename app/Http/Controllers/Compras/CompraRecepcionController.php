<?php

namespace App\Http\Controllers\Compras;

use App\Http\Controllers\Controller;
use App\Models\CompraRecepcion;
use App\Models\OrdenCompra;
use App\Models\TenantConfig;
use App\Models\Asiento;
use App\Models\Item;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CompraRecepcionController extends Controller
{
    public function index()
    {
        return inertia('Compras/Recepciones/Index', [
            'recepciones' => CompraRecepcion::with(['contacto', 'ordenCompra'])->latest()->get()
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'orden_compra_id' => 'required|exists:ordenes_compra,id',
            'fecha_recepcion' => 'required|date',
            'items' => 'required|array|min:1',
            'items.*.item_id' => 'required|exists:items,id',
            'items.*.item_unit_id' => 'nullable|exists:item_units,id',
            'items.*.cantidad_recibida' => 'required|numeric|min:0',
        ]);

        $oc = OrdenCompra::findOrFail($validated['orden_compra_id']);
        $config = TenantConfig::getSettings();

        if (!$config->cta_recepcion_transitoria_id || !$config->cta_inventario_id) {
            return back()->with('error', 'Falta configurar las cuentas contables de inventario o recepción transitoria.');
        }

        return DB::transaction(function () use ($validated, $oc, $config) {
            $recepCount = CompraRecepcion::count();
            $numRecep = 'REC-' . str_pad($recepCount + 1, 6, '0', STR_PAD_LEFT);

            $recepcion = CompraRecepcion::create([
                'numero_recepcion' => $numRecep,
                'orden_compra_id' => $oc->id,
                'contacto_id' => $oc->contacto_id,
                'fecha_recepcion' => $validated['fecha_recepcion'],
                'estado' => 'Pendiente'
            ]);

            $totalValorRecepcion = 0;

            foreach ($validated['items'] as $itemData) {
                if ($itemData['cantidad_recibida'] <= 0) continue;

                $item = Item::findOrFail($itemData['item_id']);
                $factor = 1.00;
                if (!empty($itemData['item_unit_id'])) {
                    $unit = \App\Models\ItemUnit::findOrFail($itemData['item_unit_id']);
                    $factor = $unit->factor_conversion;
                }

                $cantBase = $itemData['cantidad_recibida'] * $factor;
                
                // Módulo 4.3: Actualización de stock en UNIDAD BASE
                $item->increment('stock_actual', $cantBase);

                // Costo: Usamos el costo de la OC
                $detalleOC = $oc->detalles()->where('item_id', $item->id)->first();
                $costoUnitUMCompra = $detalleOC ? $detalleOC->costo_unitario : $item->costo_promedio;
                
                $valorLinea = $itemData['cantidad_recibida'] * $costoUnitUMCompra;
                $totalValorRecepcion += $valorLinea;

                $recepcion->detalles()->create([
                    'item_id' => $item->id,
                    'item_unit_id' => $itemData['item_unit_id'] ?? null,
                    'factor_conversion_usado' => $factor,
                    'cantidad_recibida_um_compra' => $itemData['cantidad_recibida'],
                    'cantidad_recepcionada_um_base' => $cantBase,
                    'costo_unitario_um_compra' => $costoUnitUMCompra
                ]);
            }

            // Módulo 4.4: Asiento Contable Automático
            $this->generarAsientoRecepcion($recepcion, $totalValorRecepcion, $config);

            // Actualizar estado OC
            $oc->update(['estado' => 'Recibida Parcial']); 

            return redirect()->back()->with('success', "Recepción {$numRecep} procesada y contabilizada.");
        });
    }

    private function generarAsientoRecepcion($recepcion, $total, $config)
    {
        \App\Services\AccountingService::registrarAsiento(
            $recepcion->fecha_recepcion,
            "REC-{$recepcion->numero_recepcion}",
            "Recepción de Mercancía #{$recepcion->numero_recepcion} - Proveedor: {$recepcion->contacto->razon_social}",
            [
                [
                    'account_id' => $config->cta_inventario_id,
                    'debito' => $total,
                    'credito' => 0
                ],
                [
                    'account_id' => $config->cta_recepcion_transitoria_id,
                    'debito' => 0,
                    'credito' => $total
                ]
            ]
        );
    }

    public function crearDesdeFactura(Request $request, $facturaId)
    {
        $factura = \App\Models\FacturaCompra::with('detalles.item')->findOrFail($facturaId);
        
        $config = TenantConfig::getSettings();
        if (!$config->cta_recepcion_transitoria_id || !$config->cta_inventario_id) {
            return back()->with('error', 'Falta configurar las cuentas contables de inventario o recepción transitoria.');
        }

        DB::beginTransaction();
        try {
            $recepCount = CompraRecepcion::count();
            $numRecep = 'REC-' . str_pad($recepCount + 1, 6, '0', STR_PAD_LEFT);

            $recepcion = CompraRecepcion::create([
                'numero_recepcion' => $numRecep,
                'orden_compra_id' => $factura->orden_compra_id,
                'factura_compra_id' => $factura->id,
                'contacto_id' => $factura->contacto_id,
                'fecha_recepcion' => now(),
                'estado' => 'Pendiente'
            ]);

            $totalValorRecepcion = 0;

            foreach ($factura->detalles as $detalle) {
                $item = $detalle->item;
                $factor = $detalle->factor_conversion_usado ?? 1.00;
                $cantBase = $detalle->cantidad * $factor;
                
                // Actualización de stock
                $item->increment('stock_actual', $cantBase);

                $valorLinea = $detalle->cantidad * $detalle->costo_unitario;
                $totalValorRecepcion += $valorLinea;

                $recepcion->detalles()->create([
                    'item_id' => $item->id,
                    'item_unit_id' => $detalle->item_unit_id,
                    'factor_conversion_usado' => $factor,
                    'cantidad_recibida_um_compra' => $detalle->cantidad,
                    'cantidad_recepcionada_um_base' => $cantBase,
                    'costo_unitario_um_compra' => $detalle->costo_unitario
                ]);
            }

            $this->generarAsientoRecepcion($recepcion, $totalValorRecepcion, $config);

            DB::commit();
            return redirect()->route('compras.recepciones.index')
                ->with('success', "Ingreso de mercadería {$numRecep} generado desde factura.");

        } catch (\Exception $e) {
            DB::rollBack();
            return back()->with('error', 'Error al procesar ingreso: ' . $e->getMessage());
        }
    }
}
