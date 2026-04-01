<?php

namespace App\Services;

use App\Models\FacturaVenta;
use App\Models\FacturaCompra;
use App\Models\AsientoDetalle;
use App\Models\Account;
use App\Models\Item;
use App\Models\Contacto;
use App\Models\PosSesion;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Collection;

class ReportingService
{
    /**
     * Reporte: Ventas Generales
     */
    public function getVentasGenerales($inicio, $fin)
    {
        return FacturaVenta::with('cliente')
            ->whereBetween('fecha_emision', [$inicio, $fin])
            ->where('estado', '!=', 'Anulada')
            ->orderBy('fecha_emision', 'desc')
            ->get();
    }

    /**
     * Reporte: Ventas por Ítem
     */
    public function getVentasPorItem($inicio, $fin)
    {
        // Usamos factura_venta_detalles (ajustado de factura_compra_detalles que puse por error antes)
        return DB::table('factura_venta_detalles')
            ->join('facturas_venta', 'factura_venta_detalles.factura_venta_id', '=', 'facturas_venta.id')
            ->join('items', 'factura_venta_detalles.item_id', '=', 'items.id')
            ->whereBetween('facturas_venta.fecha_emision', [$inicio, $fin])
            ->where('facturas_venta.estado', '!=', 'Anulada')
            ->select(
                'items.codigo',
                'items.nombre',
                DB::raw('SUM(factura_venta_detalles.cantidad) as cantidad_total'),
                DB::raw('SUM(factura_venta_detalles.total_item) as total_ventas')
            )
            ->groupBy('items.id', 'items.codigo', 'items.nombre')
            ->orderBy('total_ventas', 'desc')
            ->get();
    }

    /**
     * Reporte: Rentabilidad por Ítem
     */
    public function getRentabilidadItems($inicio, $fin)
    {
        return DB::table('factura_venta_detalles')
            ->join('facturas_venta', 'factura_venta_detalles.factura_venta_id', '=', 'facturas_venta.id')
            ->join('items', 'factura_venta_detalles.item_id', '=', 'items.id')
            ->whereBetween('facturas_venta.fecha_emision', [$inicio, $fin])
            ->where('facturas_venta.estado', '!=', 'Anulada')
            ->select(
                'items.codigo',
                'items.nombre',
                DB::raw('SUM(factura_venta_detalles.cantidad) as cantidad'),
                DB::raw('SUM(factura_venta_detalles.total_item) as venta_total'),
                'items.costo_promedio'
            )
            ->groupBy('items.id', 'items.codigo', 'items.nombre', 'items.costo_promedio')
            ->get()
            ->map(function($item) {
                $item->costo_total = $item->cantidad * $item->costo_promedio;
                $item->utilidad = $item->venta_total - $item->costo_total;
                $item->margen = $item->venta_total > 0 ? ($item->utilidad / $item->venta_total) * 100 : 0;
                return $item;
            });
    }

    /**
     * Reporte: Ventas por Vendedor
     */
    public function getVentasPorVendedor($inicio, $fin)
    {
        return DB::table('facturas_venta')
            ->join('vendedores', 'facturas_venta.vendedor_id', '=', 'vendedores.id')
            ->whereBetween('facturas_venta.fecha_emision', [$inicio, $fin])
            ->where('facturas_venta.estado', '!=', 'Anulada')
            ->select(
                'vendedores.nombre_completo as nombre',
                DB::raw('COUNT(facturas_venta.id) as total_facturas'),
                DB::raw('SUM(facturas_venta.total) as total_ventas')
            )
            ->groupBy('vendedores.id', 'vendedores.nombre_completo')
            ->get();
    }

    /**
     * Reporte: Estado de Resultados (P&L)
     */
    public function getEstadoResultados($inicio, $fin)
    {
        $saldos = AsientoDetalle::whereHas('asiento', function($q) use ($inicio, $fin) {
                $q->whereBetween('fecha', [$inicio, $fin]);
            })
            ->join('accounts', 'asiento_detalles.account_id', '=', 'accounts.id')
            ->select('accounts.tipo', 'accounts.nombre', 'accounts.codigo', DB::raw('SUM(debito - credito) as saldo'))
            ->groupBy('accounts.tipo', 'accounts.nombre', 'accounts.codigo')
            ->get();

        $ingresos = $saldos->where('tipo', 'Ingreso')->sum('saldo') * -1;
        $costos = $saldos->where('tipo', 'Costo')->sum('saldo');
        $gastos = $saldos->where('tipo', 'Gasto')->sum('saldo');

        return [
            'detalles' => $saldos,
            'ingresos' => $ingresos,
            'costos' => $costos,
            'gastos' => $gastos,
            'utilidad_bruta' => $ingresos - $costos,
            'utilidad_neta' => $ingresos - $costos - $gastos,
        ];
    }

    /**
     * Reporte: Valor de Inventario
     */
    public function getValorInventario($inicio = null, $fin = null)
    {
        $items = Item::whereIn('tipo', ['Inventariable', 'Consumible', 'Materia Prima', 'Producto Terminado'])
            ->where('activo', true)
            ->select('id', 'codigo', 'nombre', 'stock_actual', 'costo_promedio')
            ->get()
            ->map(function($item) {
                $item->valor_total = $item->stock_actual * $item->costo_promedio;
                $item->entradas_periodo = 0;
                $item->salidas_periodo = 0;
                $item->neto_periodo = 0;
                $item->movimientos_periodo = 0;
                return $item;
            });

        if (!$inicio || !$fin) {
            return [
                'items' => $items,
                'movimientos' => collect(),
                'fuente_movimientos' => Schema::hasTable('inventory_movements') ? 'persistente' : 'reconstruido',
                'resumen' => [
                    'valor_total' => $items->sum('valor_total'),
                    'entradas_periodo' => 0,
                    'salidas_periodo' => 0,
                    'movimientos_periodo' => 0,
                ],
            ];
        }

        $usarPersistente = Schema::hasTable('inventory_movements');
        $movimientos = $usarPersistente
            ? $this->getPersistentInventoryMovements($inicio, $fin)
            : $this->buildInventoryMovements($inicio, $fin);
        $statsByItem = $movimientos
            ->groupBy('item_id')
            ->map(function (Collection $group) {
                $entradas = $group->where('naturaleza', 'Entrada')->sum('cantidad');
                $salidas = $group->where('naturaleza', 'Salida')->sum('cantidad');

                return [
                    'entradas_periodo' => $entradas,
                    'salidas_periodo' => $salidas,
                    'neto_periodo' => $entradas - $salidas,
                    'movimientos_periodo' => $group->count(),
                ];
            });

        $items = $items->map(function ($item) use ($statsByItem) {
            $stats = $statsByItem->get($item->id, [
                'entradas_periodo' => 0,
                'salidas_periodo' => 0,
                'neto_periodo' => 0,
                'movimientos_periodo' => 0,
            ]);

            $item->entradas_periodo = $stats['entradas_periodo'];
            $item->salidas_periodo = $stats['salidas_periodo'];
            $item->neto_periodo = $stats['neto_periodo'];
            $item->movimientos_periodo = $stats['movimientos_periodo'];
            return $item;
        });

        return [
            'items' => $items,
            'movimientos' => $movimientos->sortByDesc('fecha')->values(),
            'fuente_movimientos' => $usarPersistente ? 'persistente' : 'reconstruido',
            'resumen' => [
                'valor_total' => $items->sum('valor_total'),
                'entradas_periodo' => $movimientos->where('naturaleza', 'Entrada')->sum('cantidad'),
                'salidas_periodo' => $movimientos->where('naturaleza', 'Salida')->sum('cantidad'),
                'movimientos_periodo' => $movimientos->count(),
            ],
        ];
    }

    private function buildInventoryMovements($inicio, $fin): Collection
    {
        $recepcionesOrden = DB::table('recepciones_ordenes_detalles as detalle')
            ->join('recepciones_ordenes as recepcion', 'detalle.recepcion_orden_id', '=', 'recepcion.id')
            ->join('items', 'detalle.item_id', '=', 'items.id')
            ->whereBetween('recepcion.fecha_recepcion', [$inicio, $fin])
            ->selectRaw("
                detalle.item_id,
                items.codigo,
                items.nombre,
                recepcion.fecha_recepcion as fecha,
                'Entrada' as naturaleza,
                'Recepción OC' as origen,
                recepcion.numero_recepcion as referencia,
                (detalle.cantidad_recibida * COALESCE(detalle.factor_conversion_usado, 1)) as cantidad,
                detalle.costo_unitario as costo_unitario
            ")
            ->get();

        $recepcionesFactura = DB::table('compras_recepcion_detalles as detalle')
            ->join('compras_recepciones as recepcion', 'detalle.recepcion_id', '=', 'recepcion.id')
            ->join('items', 'detalle.item_id', '=', 'items.id')
            ->whereBetween('recepcion.fecha_recepcion', [$inicio, $fin])
            ->selectRaw("
                detalle.item_id,
                items.codigo,
                items.nombre,
                recepcion.fecha_recepcion as fecha,
                'Entrada' as naturaleza,
                'Recepción Factura' as origen,
                recepcion.numero_recepcion as referencia,
                detalle.cantidad_recepcionada_um_base as cantidad,
                detalle.costo_unitario_um_compra as costo_unitario
            ")
            ->get();

        $ventas = DB::table('factura_venta_detalles as detalle')
            ->join('facturas_venta as factura', 'detalle.factura_venta_id', '=', 'factura.id')
            ->join('items', 'detalle.item_id', '=', 'items.id')
            ->whereBetween('factura.fecha_emision', [$inicio, $fin])
            ->where('factura.estado', '!=', 'Anulada')
            ->selectRaw("
                detalle.item_id,
                items.codigo,
                items.nombre,
                factura.fecha_emision as fecha,
                'Salida' as naturaleza,
                'Factura Venta' as origen,
                factura.numero_factura as referencia,
                detalle.cantidad as cantidad,
                items.costo_promedio as costo_unitario
            ")
            ->get();

        $devoluciones = DB::table('nota_credito_detalles as detalle')
            ->join('notas_credito as nota', 'detalle.nota_credito_id', '=', 'nota.id')
            ->join('items', 'detalle.item_id', '=', 'items.id')
            ->whereBetween('nota.fecha', [$inicio, $fin])
            ->where('nota.estado', 'Activa')
            ->where('detalle.devolver_stock', true)
            ->selectRaw("
                detalle.item_id,
                items.codigo,
                items.nombre,
                nota.fecha as fecha,
                'Entrada' as naturaleza,
                'Nota Crédito' as origen,
                nota.numero_nota as referencia,
                detalle.cantidad as cantidad,
                items.costo_promedio as costo_unitario
            ")
            ->get();

        return collect()
            ->concat($recepcionesOrden)
            ->concat($recepcionesFactura)
            ->concat($ventas)
            ->concat($devoluciones)
            ->map(function ($movimiento) {
                $movimiento->cantidad = (float) $movimiento->cantidad;
                $movimiento->costo_unitario = (float) $movimiento->costo_unitario;
                $movimiento->valor_movimiento = $movimiento->cantidad * $movimiento->costo_unitario;
                return $movimiento;
            });
    }

    private function getPersistentInventoryMovements($inicio, $fin): Collection
    {
        return DB::table('inventory_movements as movimiento')
            ->join('items', 'movimiento.item_id', '=', 'items.id')
            ->whereBetween('movimiento.fecha', [$inicio . ' 00:00:00', $fin . ' 23:59:59'])
            ->selectRaw("
                movimiento.item_id,
                items.codigo,
                items.nombre,
                movimiento.fecha,
                movimiento.naturaleza,
                movimiento.origen,
                movimiento.referencia,
                movimiento.cantidad,
                movimiento.costo_unitario,
                movimiento.valor_movimiento
            ")
            ->orderByDesc('movimiento.fecha')
            ->get()
            ->map(function ($movimiento) {
                $movimiento->cantidad = (float) $movimiento->cantidad;
                $movimiento->costo_unitario = (float) $movimiento->costo_unitario;
                $movimiento->valor_movimiento = (float) $movimiento->valor_movimiento;
                return $movimiento;
            });
    }

    /**
     * Reporte: Cuentas por Cobrar (Aging)
     */
    public function getCuentasPorCobrar()
    {
        return FacturaVenta::with('cliente')
            ->where('saldo_pendiente', '>', 0)
            ->where('estado', 'Abierta')
            ->get();
    }

    /**
     * Reporte: Cuentas por Pagar (CXP)
     */
    public function getCuentasPorPagar()
    {
        // El modelo FacturaCompra tiene relacion 'proveedor' que apunta a Contacto
        return FacturaCompra::with('proveedor')
            ->where('saldo_pendiente', '>', 0)
            ->where('estado', 'Abierta')
            ->get();
    }

    /**
     * Reporte: Impuestos y Retenciones
     */
    public function getImpuestos($inicio, $fin)
    {
        $ventas = FacturaVenta::whereBetween('fecha_emision', [$inicio, $fin])
            ->where('estado', '!=', 'Anulada')
            ->select(DB::raw('SUM(subtotal) as base, SUM(itbms_total) as impuesto'))
            ->first();

        $compras = FacturaCompra::whereBetween('fecha_emision', [$inicio, $fin])
            ->where('estado', '!=', 'Anulada')
            ->select(DB::raw('SUM(subtotal) as base, SUM(itbms_total) as impuesto'))
            ->first();

        return [
            'ventas' => $ventas,
            'compras' => $compras,
            'neto_pagar' => ($ventas->impuesto ?? 0) - ($compras->impuesto ?? 0)
        ];
    }

    /**
     * Reporte: Flujo de Caja (Movimientos de Cajas y Bancos)
     */
    public function getFlujoCaja($inicio, $fin)
    {
        return DB::table('bank_transactions')
            ->join('bank_accounts', 'bank_transactions.bank_account_id', '=', 'bank_accounts.id')
            ->whereBetween('bank_transactions.fecha', [$inicio, $fin])
            ->select(
                'bank_transactions.*',
                'bank_accounts.nombre_banco as banco'
            )
            ->orderBy('fecha', 'desc')
            ->get();
    }

    public function getCuadreCaja($inicio, $fin): array
    {
        $sesiones = PosSesion::with(['caja', 'cajero', 'movimientos', 'pagos'])
            ->whereDate('fecha_apertura', '>=', $inicio)
            ->whereDate('fecha_apertura', '<=', $fin)
            ->orderByDesc('fecha_apertura')
            ->get();

        $detalles = $sesiones->map(function ($sesion) {
            $pagosPorMetodo = $sesion->pagos
                ->groupBy('metodo_pago')
                ->map(fn ($group) => round((float) $group->sum('monto_pagado'), 2));

            $entradas = round((float) $sesion->movimientos->where('tipo', 'Entrada')->sum('monto'), 2);
            $salidas = round((float) $sesion->movimientos->where('tipo', 'Salida')->sum('monto'), 2);
            $ventasEfectivo = round((float) $sesion->pagos->where('metodo_pago', 'Efectivo')->sum('monto_pagado'), 2);
            $esperado = round((float) $sesion->monto_apertura + $ventasEfectivo + $entradas - $salidas, 2);
            $real = round((float) ($sesion->monto_cierre ?? 0), 2);
            $diferencia = $sesion->estado === 'Cerrada'
                ? round((float) ($sesion->diferencia ?? ($real - $esperado)), 2)
                : round(0 - $esperado, 2);

            return [
                'id' => $sesion->id,
                'fecha_apertura' => optional($sesion->fecha_apertura)?->format('Y-m-d H:i:s'),
                'fecha_cierre' => optional($sesion->fecha_cierre)?->format('Y-m-d H:i:s'),
                'caja' => $sesion->caja->nombre ?? 'N/D',
                'cajero' => $sesion->cajero->name ?? 'N/D',
                'estado' => $sesion->estado,
                'apertura' => round((float) $sesion->monto_apertura, 2),
                'ventas_efectivo' => $ventasEfectivo,
                'ventas_tarjeta' => round((float) ($pagosPorMetodo->get('Tarjeta', 0)), 2),
                'ventas_transferencia' => round((float) ($pagosPorMetodo->get('Transferencia', 0)), 2),
                'otros_metodos' => round((float) ($sesion->pagos->sum('monto_pagado') - $ventasEfectivo - $pagosPorMetodo->get('Tarjeta', 0) - $pagosPorMetodo->get('Transferencia', 0)), 2),
                'entradas' => $entradas,
                'salidas' => $salidas,
                'esperado' => $esperado,
                'real' => $real,
                'diferencia' => $diferencia,
            ];
        })->values();

        return [
            'sesiones' => $detalles,
            'resumen' => [
                'total_apertura' => round((float) $detalles->sum('apertura'), 2),
                'total_efectivo' => round((float) $detalles->sum('ventas_efectivo'), 2),
                'total_tarjeta' => round((float) $detalles->sum('ventas_tarjeta'), 2),
                'total_transferencia' => round((float) $detalles->sum('ventas_transferencia'), 2),
                'total_entradas' => round((float) $detalles->sum('entradas'), 2),
                'total_salidas' => round((float) $detalles->sum('salidas'), 2),
                'total_esperado' => round((float) $detalles->sum('esperado'), 2),
                'total_real' => round((float) $detalles->sum('real'), 2),
                'total_diferencia' => round((float) $detalles->sum('diferencia'), 2),
            ],
        ];
    }

    /**
     * Reporte: Balance de Situación (General)
     */
    public function getBalanceGeneral($fecha)
    {
        return Account::select('id', 'codigo', 'nombre', 'tipo', 'saldo_inicial')
            ->get()
            ->map(function($acc) use ($fecha) {
                $movimientos = AsientoDetalle::whereHas('asiento', function($q) use ($fecha) {
                        $q->where('fecha', '<=', $fecha);
                    })
                    ->where('account_id', $acc->id)
                    ->select(DB::raw('SUM(debito) as debe, SUM(credito) as haber'))
                    ->first();
                
                $acc->saldo_actual = $acc->saldo_inicial + (($movimientos->debe ?? 0) - ($movimientos->haber ?? 0));
                return $acc;
            })
            ->filter(fn($acc) => abs($acc->saldo_actual) > 0.001);
    }

    public function getBalanceComprobacion($inicio, $fin): array
    {
        $rows = Account::query()
            ->leftJoin('asiento_detalles', 'accounts.id', '=', 'asiento_detalles.account_id')
            ->leftJoin('asientos', function ($join) use ($inicio, $fin) {
                $join->on('asiento_detalles.asiento_id', '=', 'asientos.id')
                    ->whereBetween('asientos.fecha', [$inicio, $fin]);
            })
            ->select(
                'accounts.id',
                'accounts.codigo',
                'accounts.nombre',
                'accounts.tipo',
                'accounts.saldo_inicial',
                DB::raw('COALESCE(SUM(CASE WHEN asientos.id IS NOT NULL THEN asiento_detalles.debito ELSE 0 END), 0) as debitos_periodo'),
                DB::raw('COALESCE(SUM(CASE WHEN asientos.id IS NOT NULL THEN asiento_detalles.credito ELSE 0 END), 0) as creditos_periodo')
            )
            ->groupBy('accounts.id', 'accounts.codigo', 'accounts.nombre', 'accounts.tipo', 'accounts.saldo_inicial')
            ->orderBy('accounts.codigo')
            ->get()
            ->map(function ($row) {
                $saldoInicial = round((float) $row->saldo_inicial, 2);
                $debitos = round((float) $row->debitos_periodo, 2);
                $creditos = round((float) $row->creditos_periodo, 2);
                $saldoFinal = round($saldoInicial + $debitos - $creditos, 2);

                return [
                    'codigo' => $row->codigo,
                    'nombre' => $row->nombre,
                    'tipo' => $row->tipo,
                    'saldo_inicial' => $saldoInicial,
                    'debitos_periodo' => $debitos,
                    'creditos_periodo' => $creditos,
                    'saldo_final' => $saldoFinal,
                ];
            })
            ->filter(fn ($row) =>
                abs($row['saldo_inicial']) > 0.0001 ||
                abs($row['debitos_periodo']) > 0.0001 ||
                abs($row['creditos_periodo']) > 0.0001 ||
                abs($row['saldo_final']) > 0.0001
            )
            ->values();

        return [
            'cuentas' => $rows,
            'resumen' => [
                'saldo_inicial' => round((float) $rows->sum('saldo_inicial'), 2),
                'debitos_periodo' => round((float) $rows->sum('debitos_periodo'), 2),
                'creditos_periodo' => round((float) $rows->sum('creditos_periodo'), 2),
                'saldo_final' => round((float) $rows->sum('saldo_final'), 2),
            ],
        ];
    }

    /**
     * Reporte: Ventas por Cliente
     */
    public function getVentasPorCliente($inicio, $fin)
    {
        return DB::table('facturas_venta')
            ->join('contactos', 'facturas_venta.contacto_id', '=', 'contactos.id')
            ->whereBetween('facturas_venta.fecha_emision', [$inicio, $fin])
            ->where('facturas_venta.estado', '!=', 'Anulada')
            ->select(
                'contactos.razon_social as cliente',
                'contactos.identificacion',
                DB::raw('COUNT(facturas_venta.id) as total_facturas'),
                DB::raw('SUM(facturas_venta.total) as total_ventas')
            )
            ->groupBy('contactos.id', 'contactos.razon_social', 'contactos.identificacion')
            ->orderBy('total_ventas', 'desc')
            ->get();
    }

    /**
     * Reporte: Listado de Compras
     */
    public function getCompras($inicio, $fin)
    {
        return FacturaCompra::with('proveedor')
            ->whereBetween('fecha_emision', [$inicio, $fin])
            ->where('estado', '!=', 'Anulada')
            ->orderBy('fecha_emision', 'desc')
            ->get();
    }

    /**
     * Reporte: Resumen Ingresos vs Gastos
     */
    public function getIngresosGastos($inicio, $fin)
    {
        $ingresos = DB::table('facturas_venta')
            ->whereBetween('fecha_emision', [$inicio, $fin])
            ->where('estado', '!=', 'Anulada')
            ->sum('total');

        $gastos = DB::table('facturas_compra')
            ->whereBetween('fecha_emision', [$inicio, $fin])
            ->where('estado', '!=', 'Anulada')
            ->sum('total');

        return [
            'ingresos' => $ingresos,
            'gastos' => $gastos,
            'balance' => $ingresos - $gastos
        ];
    }

    public function getEstadoCuentaClienteResumen($inicio, $fin)
    {
        return FacturaVenta::query()
            ->join('contactos', 'facturas_venta.contacto_id', '=', 'contactos.id')
            ->whereBetween('facturas_venta.fecha_emision', [$inicio, $fin])
            ->where('facturas_venta.estado', '!=', 'Anulada')
            ->select(
                'contactos.id',
                'contactos.razon_social as cliente',
                'contactos.identificacion',
                DB::raw('COUNT(facturas_venta.id) as facturas'),
                DB::raw('SUM(facturas_venta.total) as total_facturado'),
                DB::raw('SUM(facturas_venta.saldo_pendiente) as saldo_pendiente')
            )
            ->groupBy('contactos.id', 'contactos.razon_social', 'contactos.identificacion')
            ->orderByDesc('saldo_pendiente')
            ->get()
            ->map(function ($row) {
                return [
                    'cliente' => $row->cliente,
                    'identificacion' => $row->identificacion,
                    'facturas' => (int) $row->facturas,
                    'total_facturado' => round((float) $row->total_facturado, 2),
                    'saldo_pendiente' => round((float) $row->saldo_pendiente, 2),
                ];
            });
    }

    public function getTransacciones($inicio, $fin)
    {
        $bancos = DB::table('bank_transactions as bt')
            ->leftJoin('bank_accounts as ba', 'bt.bank_account_id', '=', 'ba.id')
            ->whereBetween('bt.fecha', [$inicio, $fin])
            ->selectRaw("
                bt.fecha as fecha,
                'Banco' as modulo,
                bt.tipo as tipo,
                COALESCE(bt.referencia, CONCAT('BT-', bt.id)) as referencia,
                COALESCE(bt.descripcion, ba.nombre_banco, 'Movimiento bancario') as descripcion,
                CASE WHEN bt.tipo = 'Ingreso' THEN bt.monto ELSE 0 END as entrada,
                CASE WHEN bt.tipo != 'Ingreso' THEN bt.monto ELSE 0 END as salida
            ")
            ->get();

        $cobros = DB::table('recibos_pago as rp')
            ->leftJoin('facturas_venta as fv', 'rp.factura_venta_id', '=', 'fv.id')
            ->leftJoin('contactos as c', 'fv.contacto_id', '=', 'c.id')
            ->whereBetween('rp.fecha_pago', [$inicio, $fin])
            ->selectRaw("
                rp.fecha_pago as fecha,
                'Cobros' as modulo,
                rp.metodo_pago as tipo,
                rp.numero_recibo as referencia,
                COALESCE(c.razon_social, 'Cliente contado') as descripcion,
                rp.monto_pagado as entrada,
                0 as salida
            ")
            ->get();

        $egresos = DB::table('egresos as e')
            ->leftJoin('facturas_compra as fc', 'e.factura_compra_id', '=', 'fc.id')
            ->leftJoin('contactos as c', 'fc.contacto_id', '=', 'c.id')
            ->whereBetween('e.fecha_pago', [$inicio, $fin])
            ->selectRaw("
                e.fecha_pago as fecha,
                'Pagos' as modulo,
                e.metodo_pago as tipo,
                e.numero_egreso as referencia,
                COALESCE(c.razon_social, 'Proveedor') as descripcion,
                0 as entrada,
                e.monto_pagado as salida
            ")
            ->get();

        return collect()
            ->concat($bancos)
            ->concat($cobros)
            ->concat($egresos)
            ->sortByDesc('fecha')
            ->values()
            ->map(fn ($row) => [
                'fecha' => $row->fecha,
                'modulo' => $row->modulo,
                'tipo' => $row->tipo,
                'referencia' => $row->referencia,
                'descripcion' => $row->descripcion,
                'entrada' => round((float) $row->entrada, 2),
                'salida' => round((float) $row->salida, 2),
            ]);
    }

    public function getReporteAnual($year)
    {
        $year = (int) $year;
        $rows = collect(range(1, 12))->map(function ($month) use ($year) {
            $inicio = sprintf('%04d-%02d-01', $year, $month);
            $fin = date('Y-m-t', strtotime($inicio));

            $ventas = (float) DB::table('facturas_venta')
                ->whereBetween('fecha_emision', [$inicio, $fin])
                ->where('estado', '!=', 'Anulada')
                ->sum('total');

            $compras = (float) DB::table('facturas_compra')
                ->whereBetween('fecha_emision', [$inicio, $fin])
                ->where('estado', '!=', 'Anulada')
                ->sum('total');

            $cobros = (float) DB::table('recibos_pago')
                ->whereBetween('fecha_pago', [$inicio, $fin])
                ->sum('monto_pagado');

            $pagos = (float) DB::table('egresos')
                ->whereBetween('fecha_pago', [$inicio, $fin])
                ->sum('monto_pagado');

            return [
                'mes' => sprintf('%02d/%04d', $month, $year),
                'ventas' => round($ventas, 2),
                'compras' => round($compras, 2),
                'cobros' => round($cobros, 2),
                'pagos' => round($pagos, 2),
                'balance' => round(($ventas + $cobros) - ($compras + $pagos), 2),
            ];
        });

        return [
            'meses' => $rows,
            'resumen' => [
                'ventas' => round((float) $rows->sum('ventas'), 2),
                'compras' => round((float) $rows->sum('compras'), 2),
                'cobros' => round((float) $rows->sum('cobros'), 2),
                'pagos' => round((float) $rows->sum('pagos'), 2),
                'balance' => round((float) $rows->sum('balance'), 2),
            ],
        ];
    }

    public function getReporteCajas($inicio, $fin)
    {
        $detalle = collect($this->getCuadreCaja($inicio, $fin)['sesiones']);

        return $detalle
            ->groupBy('caja')
            ->map(function ($group, $caja) {
                return [
                    'caja' => $caja,
                    'sesiones' => $group->count(),
                    'apertura' => round((float) $group->sum('apertura'), 2),
                    'ventas_efectivo' => round((float) $group->sum('ventas_efectivo'), 2),
                    'ventas_tarjeta' => round((float) $group->sum('ventas_tarjeta'), 2),
                    'ventas_transferencia' => round((float) $group->sum('ventas_transferencia'), 2),
                    'real' => round((float) $group->sum('real'), 2),
                    'diferencia' => round((float) $group->sum('diferencia'), 2),
                ];
            })
            ->values();
    }

    public function getMovimientosCuenta($inicio, $fin)
    {
        return DB::table('asiento_detalles as ad')
            ->join('asientos as a', 'ad.asiento_id', '=', 'a.id')
            ->join('accounts as ac', 'ad.account_id', '=', 'ac.id')
            ->whereBetween('a.fecha', [$inicio, $fin])
            ->selectRaw("
                a.fecha,
                a.referencia,
                a.concepto,
                ac.codigo,
                ac.nombre as cuenta,
                ad.debito,
                ad.credito
            ")
            ->orderBy('a.fecha')
            ->orderBy('a.id')
            ->get()
            ->map(fn ($row) => [
                'fecha' => $row->fecha,
                'referencia' => $row->referencia,
                'concepto' => $row->concepto,
                'codigo' => $row->codigo,
                'cuenta' => $row->cuenta,
                'debito' => round((float) $row->debito, 2),
                'credito' => round((float) $row->credito, 2),
            ]);
    }

    public function getLibroDiario($inicio, $fin)
    {
        return DB::table('asientos as a')
            ->whereBetween('a.fecha', [$inicio, $fin])
            ->select('a.fecha', 'a.referencia', 'a.concepto', 'a.total_debito', 'a.total_credito')
            ->orderBy('a.fecha')
            ->orderBy('a.id')
            ->get()
            ->map(fn ($row) => [
                'fecha' => $row->fecha,
                'referencia' => $row->referencia,
                'concepto' => $row->concepto,
                'total_debito' => round((float) $row->total_debito, 2),
                'total_credito' => round((float) $row->total_credito, 2),
            ]);
    }

    public function getAuxiliarTercero($inicio, $fin)
    {
        $ventas = DB::table('facturas_venta as fv')
            ->join('contactos as c', 'fv.contacto_id', '=', 'c.id')
            ->whereBetween('fv.fecha_emision', [$inicio, $fin])
            ->where('fv.estado', '!=', 'Anulada')
            ->selectRaw("
                c.id,
                c.razon_social as tercero,
                c.identificacion,
                SUM(fv.total) as debito,
                0 as credito
            ")
            ->groupBy('c.id', 'c.razon_social', 'c.identificacion')
            ->get();

        $pagos = DB::table('recibos_pago as rp')
            ->join('facturas_venta as fv', 'rp.factura_venta_id', '=', 'fv.id')
            ->join('contactos as c', 'fv.contacto_id', '=', 'c.id')
            ->whereBetween('rp.fecha_pago', [$inicio, $fin])
            ->selectRaw("
                c.id,
                c.razon_social as tercero,
                c.identificacion,
                0 as debito,
                SUM(rp.monto_pagado) as credito
            ")
            ->groupBy('c.id', 'c.razon_social', 'c.identificacion')
            ->get();

        return collect()
            ->concat($ventas)
            ->concat($pagos)
            ->groupBy('id')
            ->map(function ($group) {
                $first = $group->first();
                return [
                    'tercero' => $first->tercero,
                    'identificacion' => $first->identificacion,
                    'debito' => round((float) $group->sum('debito'), 2),
                    'credito' => round((float) $group->sum('credito'), 2),
                    'saldo' => round((float) $group->sum('debito') - (float) $group->sum('credito'), 2),
                ];
            })
            ->values()
            ->sortByDesc('saldo')
            ->values();
    }

    public function getFormasPago($inicio, $fin)
    {
        return DB::table('recibos_pago')
            ->whereBetween('fecha_pago', [$inicio, $fin])
            ->selectRaw("
                metodo_pago,
                COUNT(*) as transacciones,
                SUM(monto_pagado) as total
            ")
            ->groupBy('metodo_pago')
            ->orderByDesc('total')
            ->get()
            ->map(fn ($row) => [
                'metodo_pago' => $row->metodo_pago,
                'transacciones' => (int) $row->transacciones,
                'total' => round((float) $row->total, 2),
            ]);
    }

    public function getExportFacturas($inicio, $fin)
    {
        return FacturaVenta::with('cliente')
            ->whereBetween('fecha_emision', [$inicio, $fin])
            ->where('estado', '!=', 'Anulada')
            ->orderBy('fecha_emision')
            ->get()
            ->map(fn ($factura) => [
                'fecha_emision' => $factura->fecha_emision,
                'numero_factura' => $factura->numero_factura,
                'cliente' => $factura->cliente?->razon_social,
                'identificacion' => $factura->cliente?->identificacion,
                'subtotal' => round((float) $factura->subtotal, 2),
                'itbms_total' => round((float) $factura->itbms_total, 2),
                'total' => round((float) $factura->total, 2),
                'estado' => $factura->estado,
            ]);
    }

    public function getExportContador($inicio, $fin)
    {
        return DB::table('asiento_detalles as ad')
            ->join('asientos as a', 'ad.asiento_id', '=', 'a.id')
            ->join('accounts as ac', 'ad.account_id', '=', 'ac.id')
            ->whereBetween('a.fecha', [$inicio, $fin])
            ->selectRaw("
                a.fecha,
                a.referencia,
                a.concepto,
                ac.codigo,
                ac.nombre as cuenta,
                ad.debito,
                ad.credito
            ")
            ->orderBy('a.fecha')
            ->orderBy('a.id')
            ->get()
            ->map(fn ($row) => [
                'fecha' => $row->fecha,
                'referencia' => $row->referencia,
                'concepto' => $row->concepto,
                'codigo' => $row->codigo,
                'cuenta' => $row->cuenta,
                'debito' => round((float) $row->debito, 2),
                'credito' => round((float) $row->credito, 2),
            ]);
    }
}
