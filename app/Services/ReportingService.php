<?php

namespace App\Services;

use App\Models\FacturaVenta;
use App\Models\FacturaCompra;
use App\Models\AsientoDetalle;
use App\Models\Account;
use App\Models\Item;
use App\Models\Contacto;
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
}
