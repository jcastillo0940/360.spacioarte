<?php

namespace App\Http\Controllers\Ventas;

use App\Http\Controllers\Controller;
use App\Models\FacturaVenta;
use App\Models\FacturaVentaDetalle;
use App\Models\OrdenVenta;
use App\Models\PaymentTerm;
use App\Models\TenantConfig;
use App\Services\AccountingService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class FacturaController extends Controller
{
    /**
     * Lista de facturas para la tabla de React
     */
    public function index()
    {
        $facturas = FacturaVenta::with('cliente', 'vendedor')
            ->latest()
            ->get();
        
        // Si es petición API, devolver JSON
        if (request()->is('api/*') || request()->wantsJson()) {
            return response()->json($facturas);
        }
        
        return Inertia::render('Ventas/Facturas/Index', [
            'facturas' => $facturas
        ]);
    }
    
    public function show(FacturaVenta $factura)
    {
        $factura->load(['cliente', 'vendedor', 'detalles.item']);

        if (request()->is('api/*') || request()->wantsJson()) {
            return response()->json($factura);
        }

        return Inertia::render('Ventas/Facturas/Show', [
            'factura' => $factura
        ]);
    }
    

    /**
     * Convierte una Orden de Venta en Factura Fiscal e integra contabilidad
     */
    public function convertirDesdeOrden(OrdenVenta $orden)
    {
        if ($orden->estado === 'Facturada') {
            return back()->withErrors(['error' => 'Esta orden ya ha sido facturada previamente.']);
        }

        $orden->loadMissing(['cliente.payment_term', 'detalles.item']);

        $paymentTermId = $orden->cliente?->payment_term_id
            ?? PaymentTerm::query()->orderBy('id')->value('id');

        if (!$paymentTermId) {
            return back()->withErrors([
                'error' => 'No existe un termino de pago configurado. Cree uno o asigne uno al cliente antes de facturar.',
            ]);
        }

        $paymentTerm = $orden->cliente?->payment_term && (int) $orden->cliente->payment_term->id === (int) $paymentTermId
            ? $orden->cliente->payment_term
            : PaymentTerm::query()->find($paymentTermId);

        $diasVencimiento = $paymentTerm?->dias_vencimiento ?? 30;

        return DB::transaction(function () use ($orden, $diasVencimiento, $paymentTermId) {
            $config = TenantConfig::first();
            
            // 1. Crear la cabecera de la Factura
            $factura = FacturaVenta::create([
                'numero_factura'    => $this->generateInvoiceNumber($config),
                'contacto_id'       => $orden->contacto_id,
                'vendedor_id'       => $orden->vendedor_id,
                'orden_venta_id'    => $orden->id,
                'fecha_emision'     => now(),
                'fecha_vencimiento' => now()->addDays($diasVencimiento),
                'payment_term_id'   => $paymentTermId,
                'subtotal'          => $orden->subtotal,
                'itbms_total'       => $orden->itbms_total,
                'descuento_tipo'    => $orden->descuento_tipo,
                'descuento_valor'   => $orden->descuento_valor ?? 0,
                'descuento_total'   => $orden->descuento_total ?? 0,
                'total'             => $orden->total,
                'saldo_pendiente'   => $orden->total,
                'estado'            => 'Abierta',
            ]);

            // 2. Copiar detalles y manejar inventario
            $subtotalFactura = $orden->subtotal;
            $itbmsFactura = $orden->itbms_total;

            foreach ($orden->detalles as $detalle) {
                FacturaVentaDetalle::create([
                    'factura_venta_id' => $factura->id,
                    'item_id'          => $detalle->item_id,
                    'cantidad'         => $detalle->cantidad,
                    'precio_unitario'  => $detalle->precio_unitario,
                    'porcentaje_itbms' => $detalle->porcentaje_itbms,
                    'total_item'       => $detalle->total,
                ]);

                // Descontar del inventario
                if ($detalle->item && $detalle->item->tipo === 'Inventariable') {
                    $detalle->item->decrement('stock_actual', $detalle->cantidad);
                }
            }

            // 2b. Agregar línea de diseño si tiene monto calculado
            if ($orden->diseno_monto_calculado > 0) {
                $itemDiseno = \App\Models\Item::where('codigo', 'DIS-01')->first();
                if ($itemDiseno) {
                    $tasa_itbms = ($itemDiseno->tax && $itemDiseno->tax->tasa !== null) ? $itemDiseno->tax->tasa : 7.00;
                    $monto_itbms = $orden->diseno_monto_calculado * ($tasa_itbms / 100);
                    
                    FacturaVentaDetalle::create([
                        'factura_venta_id' => $factura->id,
                        'item_id'          => $itemDiseno->id,
                        'cantidad'         => 1,
                        'precio_unitario'  => $orden->diseno_monto_calculado,
                        'porcentaje_itbms' => $tasa_itbms,
                        'total_item'       => $orden->diseno_monto_calculado + $monto_itbms,
                    ]);

                    $subtotalFactura += $orden->diseno_monto_calculado;
                    $itbmsFactura += $monto_itbms;

                    // Actualizar cabecera de factura
                    $factura->update([
                        'subtotal'        => $subtotalFactura,
                        'itbms_total'     => $itbmsFactura,
                        'total'           => $subtotalFactura + $itbmsFactura,
                        'saldo_pendiente' => $subtotalFactura + $itbmsFactura,
                    ]);

                    $factura->refresh();
                }
            }

            // 3. Generar Asiento Contable Automático (si existe el servicio)
            if (class_exists('App\Services\AccountingService') && $config) {
                try {
                    AccountingService::registrarAsiento(
                        $factura->fecha_emision,
                        $factura->numero_factura,
                        "Venta de mercancía - Cliente: " . $orden->cliente->razon_social,
                        [
                            // Cuentas por Cobrar (Débito al Activo)
                            [
                                'account_id' => $config->cta_cxc_id, 
                                'debito'     => $factura->total, 
                                'credito'    => 0
                            ],
                            // Ingresos por Ventas (Crédito al Ingreso)
                            [
                                'account_id' => $config->cta_ventas_id, 
                                'debito'     => 0, 
                                'credito'    => $factura->subtotal
                            ],
                            // ITBMS por Pagar (Crédito al Pasivo)
                            [
                                'account_id' => $config->cta_itbms_id, 
                                'debito'     => 0, 
                                'credito'    => $factura->itbms_total
                            ],
                        ]
                    );
                } catch (\Exception $e) {
                    \Log::warning('No se pudo crear asiento contable: ' . $e->getMessage());
                }
            }

            // 4. Actualizar estado de la orden
            $orden->update(['estado' => 'Facturada']);

            return redirect()->route('facturas.index')->with('success', 'Factura ' . $factura->numero_factura . ' generada correctamente.');
        });
    }

    private function generateInvoiceNumber($config)
    {
        $serie = optional($config)->factura_serie ?? 'FV';
        
        // Obtener el número máximo actual
        $lastFactura = FacturaVenta::where('numero_factura', 'LIKE', $serie . '-%')
            // Corregimos la extracción del número para que coincida con la longitud de la serie dinámicamente
            ->orderByRaw('CAST(SUBSTRING(numero_factura, ' . (strlen($serie) + 2) . ') AS UNSIGNED) DESC')
            ->first();

        if ($lastFactura) {
            preg_match('/\d+/', $lastFactura->numero_factura, $matches);
            $nextNum = isset($matches[0]) ? (int)$matches[0] + 1 : 1;
        } else {
            $nextNum = optional($config)->factura_inicio ?? 1;
        }

        return $serie . '-' . str_pad($nextNum, 6, '0', STR_PAD_LEFT);
    }
}
