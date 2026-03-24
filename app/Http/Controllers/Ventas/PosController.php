<?php

namespace App\Http\Controllers\Ventas;

use App\Http\Controllers\Controller;
use App\Models\PosCaja;
use App\Models\PosSesion;
use App\Models\PosMovimiento;
use App\Models\Item;
use App\Models\OrdenVenta;
use App\Models\FacturaVenta;
use App\Models\ReciboPago;
use App\Models\Contacto;
use App\Models\BankAccount;
use App\Models\PaymentTerm;
use App\Models\PosMetodoPago;
use App\Models\TenantConfig;
use App\Models\BankTransaction;
use App\Services\AccountingService;
use App\Services\Production\InventoryService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class PosController extends Controller
{
    public function index()
    {
        $usuario = auth()->user();
        $sesionActiva = PosSesion::with('caja')
            ->where('user_id', $usuario->id)
            ->where('estado', 'Abierta')
            ->first();

        if (!$sesionActiva) {
            $cajas = PosCaja::where('activa', true)->get();
            return Inertia::render('Ventas/Pos/Apertura', [
                'cajas' => $cajas
            ]);
        }

        return Inertia::render('Ventas/Pos/Index', [
            'sesion' => $sesionActiva,
            'items' => Item::where('activo', true)->where('es_insumo', false)->limit(20)->get(),
            'bancos' => BankAccount::all(),
            'metodosPago' => PosMetodoPago::where('activo', true)->get(),
            'paymentTerms' => PaymentTerm::all()
        ]);
    }

    public function openSession(Request $request)
    {
        $request->validate([
            'caja_id' => 'required|exists:pos_cajas,id',
            'monto_apertura' => 'required|numeric|min:0'
        ]);

        // Cerrar sesiones huérfanas del mismo usuario si existen (limpieza)
        PosSesion::where('user_id', auth()->id())
            ->where('estado', 'Abierta')
            ->update(['estado' => 'Cerrada', 'fecha_cierre' => now()]);

        $sesion = PosSesion::create([
            'caja_id' => $request->caja_id,
            'user_id' => auth()->id(),
            'monto_apertura' => $request->monto_apertura,
            'fecha_apertura' => now(),
            'estado' => 'Abierta'
        ]);

        return redirect()->route('pos.index')->with('success', 'Caja abierta correctamente');
    }

    public function searchItems(Request $request)
    {
        $q = $request->q;
        $items = Item::where('activo', true)
            ->where('es_insumo', false)
            ->where(function($query) use ($q) {
                $query->where('nombre', 'like', "%$q%")
                      ->orWhere('codigo', 'like', "%$q%");
            })
            ->limit(20)
            ->get();

        return response()->json($items);
    }

    public function searchOrders(Request $request)
    {
        $q = $request->q;
        $ordenes = OrdenVenta::with(['cliente', 'detalles', 'detalles.item'])
            ->select('*', DB::raw('CAST(total AS DECIMAL(15,2)) as total_num'), DB::raw('CAST(monto_abonado AS DECIMAL(15,2)) as abonado_num'))
            ->where(function($query) use ($q) {
                $query->where('numero_orden', 'like', "%$q%")
                      ->orWhereHas('cliente', function($query) use ($q) {
                          $query->where('razon_social', 'like', "%$q%");
                      });
            })
            ->where('estado', '!=', 'Anulada')
            ->where('estado', '!=', 'Facturada')
            ->whereRaw('ROUND(total, 2) > ROUND(IFNULL(monto_abonado, 0), 2)')
            ->limit(10)
            ->get();

        return response()->json($ordenes);
    }

    public function processSale(Request $request)
    {
        $request->validate([
            'contacto_id' => 'required|exists:contactos,id',
            'items' => 'required|array|min:1',
            'metodo_pago' => 'required|string',
            'monto_pago' => 'required|numeric|min:0',
            'bank_account_id' => 'required|exists:bank_accounts,id'
        ]);

        $sesion = PosSesion::where('user_id', auth()->id())
            ->where('estado', 'Abierta')
            ->firstOrFail();

        DB::beginTransaction();
        try {
            // 1. Crear Factura
            $config = TenantConfig::first();
            $subtotal = 0;
            $itbms = 0;
            
            foreach ($request->items as $item) {
                $lineaSubtotal = ($item['precio'] * $item['cantidad']) - ($item['descuento'] ?? 0);
                $subtotal += $lineaSubtotal;
                $itbms += $lineaSubtotal * (7/100); // Simplificado 7%
            }
            $total = round($subtotal + $itbms, 2);

            $factura = FacturaVenta::create([
                'numero_factura' => 'POS-' . time(), 
                'contacto_id' => $request->contacto_id,
                'fecha_emision' => now(),
                'fecha_vencimiento' => now(),
                'payment_term_id' => 1, // Contado
                'subtotal' => $subtotal,
                'itbms_total' => $itbms,
                'total' => $total,
                'saldo_pendiente' => max(0, $total - $request->monto_pago),
                'estado' => $request->monto_pago >= ($total - 0.01) ? 'Pagada' : 'Abierta',
                'pos_sesion_id' => $sesion->id
            ]);

            // 2. Crear Detalles y actualizar stock
            $inventoryService = new InventoryService();
            foreach ($request->items as $item) {
                $lineaSubtotal = ($item['precio'] * $item['cantidad']) - ($item['descuento'] ?? 0);
                $factura->detalles()->create([
                    'item_id' => $item['id'],
                    'cantidad' => $item['cantidad'],
                    'precio_unitario' => $item['precio'],
                    'porcentaje_itbms' => 7.00,
                    'total_item' => round($lineaSubtotal * 1.07, 2)
                ]);

                // Descontar stock (Maneja recetas automáticamente)
                $producto = Item::with('insumos')->find($item['id']);
                if ($producto) {
                    $inventoryService->consumirReceta($producto, $item['cantidad']);
                }
            }

            // 3. Contabilidad de la Venta (Factura)
            if ($config) {
                AccountingService::registrarAsiento(
                    $factura->fecha_emision,
                    $factura->numero_factura,
                    "Venta POS #" . $factura->numero_factura,
                    [
                        ['account_id' => $config->cta_cxc_id, 'debito' => $total, 'credito' => 0],
                        ['account_id' => $config->cta_ventas_id, 'debito' => 0, 'credito' => $subtotal],
                        ['account_id' => $config->cta_itbms_id, 'debito' => 0, 'credito' => $itbms],
                    ]
                );
            }

            // 4. Crear Recibo si hay pago
            if ($request->monto_pago > 0) {
                $recibo = ReciboPago::create([
                    'numero_recibo' => 'REC-POS-' . time(),
                    'factura_venta_id' => $factura->id,
                    'bank_account_id' => $request->bank_account_id,
                    'pos_sesion_id' => $sesion->id,
                    'fecha_pago' => now(),
                    'monto_pagado' => $request->monto_pago,
                    'metodo_pago' => $request->metodo_pago,
                    'referencia' => $request->referencia
                ]);

                // Afectar Banco
                $banco = BankAccount::find($request->bank_account_id);
                if ($banco) {
                    BankTransaction::create([
                        'bank_account_id' => $banco->id,
                        'tipo' => 'Ingreso',
                        'monto' => $request->monto_pago,
                        'fecha' => now(),
                        'descripcion' => "Pago POS #" . $factura->numero_factura,
                        'referencia' => $request->referencia,
                    ]);
                    $banco->increment('saldo_actual', $request->monto_pago);

                    // Contabilidad del Pago
                    if ($config && $banco->account_id) {
                        AccountingService::registrarAsiento(
                            now(),
                            $recibo->numero_recibo,
                            "Cobro POS #" . $factura->numero_factura,
                            [
                                ['account_id' => $banco->account_id, 'debito' => $request->monto_pago, 'credito' => 0],
                                ['account_id' => $config->cta_cxc_id, 'debito' => 0, 'credito' => $request->monto_pago],
                            ]
                        );
                    }
                }
            }

            // 4. Registrar Movimiento de Caja si es Efectivo
            if ($request->metodo_pago === 'Efectivo') {
                PosMovimiento::create([
                    'pos_sesion_id' => $sesion->id,
                    'tipo' => 'Venta',
                    'monto' => $request->monto_pago,
                    'metodo_pago' => 'Efectivo',
                    'concepto' => 'Venta POS #' . $factura->numero_factura,
                    'user_id' => auth()->id()
                ]);
            }

            // 5. Vincular con Orden de Venta si existe
            $ordenIds = collect($request->items)->pluck('fromOrder')->filter()->unique();
            if ($ordenIds->count() > 0) {
                foreach ($ordenIds as $ordenId) {
                    $orden = OrdenVenta::find($ordenId);
                    if ($orden) {
                        $orden->monto_abonado = ($orden->monto_abonado || 0) + $request->monto_pago;
                        if ($orden->monto_abonado >= $orden->total) {
                            $orden->estado = 'Facturada';
                        }
                        $orden->save();
                    }
                }
            }

            DB::commit();
            return response()->json(['message' => 'Venta procesada', 'factura_id' => $factura->id]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function closeSession(Request $request)
    {
        $request->validate([
            'monto_real' => 'required|numeric'
        ]);

        $sesion = PosSesion::with('movimientos', 'pagos')
            ->where('user_id', auth()->id())
            ->where('estado', 'Abierta')
            ->firstOrFail();

        $ventasEfectivo = $sesion->pagos()->where('metodo_pago', 'Efectivo')->sum('monto_pagado');
        $entradas = $sesion->movimientos()->where('tipo', 'Entrada')->sum('monto');
        $salidas = $sesion->movimientos()->where('tipo', 'Salida')->sum('monto');
        
        $montoEsperado = $sesion->monto_apertura + $ventasEfectivo + $entradas - $salidas;

        $sesion->update([
            'estado' => 'Cerrada',
            'monto_cierre' => $request->monto_real,
            'monto_esperado_efectivo' => $montoEsperado,
            'diferencia' => $request->monto_real - $montoEsperado,
            'fecha_cierre' => now(),
            'observaciones' => $request->observaciones
        ]);

        return redirect()->route('pos.index')->with('success', 'Caja cerrada. Corte Z generado.');
    }

    public function getCorteX()
    {
        $sesion = PosSesion::with(['movimientos', 'pagos', 'caja', 'cajero'])
            ->where('user_id', auth()->id())
            ->where('estado', 'Abierta')
            ->firstOrFail();

        $resumen = [
            'apertura' => $sesion->monto_apertura,
            'ventas_efectivo' => $sesion->pagos()->where('metodo_pago', 'Efectivo')->sum('monto_pagado'),
            'ventas_tarjeta' => $sesion->pagos()->where('metodo_pago', 'Tarjeta')->sum('monto_pagado'),
            'ventas_transferencia' => $sesion->pagos()->where('metodo_pago', 'Transferencia')->sum('monto_pagado'),
            'entradas' => $sesion->movimientos()->where('tipo', 'Entrada')->sum('monto'),
            'salidas' => $sesion->movimientos()->where('tipo', 'Salida')->sum('monto'),
        ];

        return response()->json($resumen);
    }
}
