<?php

namespace App\Services;

use App\Models\FacturaVenta;
use App\Models\FacturaCompra;
use App\Models\AsientoDetalle;
use App\Models\Account;
use App\Models\Item;
use App\Models\Contacto;
use Illuminate\Support\Facades\DB;

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
    public function getValorInventario()
    {
        return Item::whereIn('tipo', ['Inventariable', 'Consumible', 'Materia Prima', 'Producto Terminado'])
            ->where('activo', true)
            ->select('id', 'codigo', 'nombre', 'stock_actual', 'costo_promedio')
            ->get()
            ->map(function($item) {
                $item->valor_total = $item->stock_actual * $item->costo_promedio;
                return $item;
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
