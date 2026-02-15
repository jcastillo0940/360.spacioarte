<?php

namespace App\Http\Controllers\Reportes;

use App\Http\Controllers\Controller;
use App\Models\FacturaVenta;
use App\Models\FacturaCompra;
use App\Models\Account;
use App\Models\Item;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ReporteController extends Controller
{
    /**
     * Genera el Estado de Resultados (Utilidades vs Gastos)
     */
    public function estadoResultados(Request $request)
    {
        $desde = $request->query('desde', now()->startOfMonth());
        $hasta = $request->query('hasta', now()->endOfMonth());

        // 1. Ingresos (Ventas gravadas y exentas)
        $ingresos = FacturaVenta::whereBetween('fecha_emision', [$desde, $hasta])
            ->where('estado', '!=', 'Anulada')
            ->sum('subtotal');

        // 2. Costos de Ventas (Basado en el costo promedio de los ítems vendidos)
        $costos = DB::table('factura_venta_detalles')
            ->join('facturas_venta', 'factura_venta_detalles.factura_venta_id', '=', 'facturas_venta.id')
            ->join('items', 'factura_venta_detalles.item_id', '=', 'items.id')
            ->whereBetween('facturas_venta.fecha_emision', [$desde, $hasta])
            ->select(DB::raw('SUM(factura_venta_detalles.cantidad * items.costo_promedio) as total_costo'))
            ->first()->total_costo ?? 0;

        // 3. Gastos Operativos (Facturas de compra que no afectan inventario)
        $gastos = FacturaCompra::whereBetween('fecha_emision', [$desde, $hasta])
            ->where('estado', '!=', 'Anulada')
            ->sum('total');

        $utilidadBruta = $ingresos - $costos;
        $utilidadNeta = $utilidadBruta - $gastos;

        return response()->json([
            'periodo' => ['desde' => $desde, 'hasta' => $hasta],
            'ingresos' => $ingresos,
            'costos' => $costos,
            'utilidad_bruta' => $utilidadBruta,
            'gastos' => $gastos,
            'utilidad_neta' => $utilidadNeta
        ]);
    }

    /**
     * Exportación de Ventas por Vendedor a Excel (CSV)
     */
    public function exportarVentasVendedor(Request $request)
    {
        $fileName = 'ventas_por_vendedor_' . date('Ymd') . '.csv';
        $ventas = DB::table('facturas_venta')
            ->join('vendedores', 'facturas_venta.vendedor_id', '=', 'vendedores.id')
            ->select('vendedores.nombre_completo', DB::raw('COUNT(facturas_venta.id) as total_facturas'), DB::raw('SUM(facturas_venta.total) as monto_total'))
            ->groupBy('vendedores.nombre_completo')
            ->get();

        $headers = array(
            "Content-type"        => "text/csv",
            "Content-Disposition" => "attachment; filename=$fileName",
            "Pragma"              => "no-cache",
            "Cache-Control"       => "must-revalidate, post-check=0, pre-check=0",
            "Expires"             => "0"
        );

        $columns = array('Vendedor', 'Total Facturas', 'Monto Total');

        $callback = function() use($ventas, $columns) {
            $file = fopen('php://output', 'w');
            fputcsv($file, $columns);

            foreach ($ventas as $venta) {
                fputcsv($file, array($venta->nombre_completo, $venta->total_facturas, $venta->monto_total));
            }
            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }

    /**
     * Reporte de Inventario Valorizado
     */
    public function inventarioValorizado()
    {
        $inventario = Item::where('tipo', 'Inventariable')
            ->select('codigo', 'nombre', 'stock_actual', 'costo_promedio', DB::raw('(stock_actual * costo_promedio) as valor_total'))
            ->get();

        return response()->json([
            'items' => $inventario,
            'valor_total_almacen' => $inventario->sum('valor_total')
        ]);
    }
}