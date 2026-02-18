<?php

namespace App\Http\Controllers\Contabilidad;

use App\Http\Controllers\Controller;
use App\Services\ReportingService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Barryvdh\DomPDF\Facade\Pdf;
use App\Models\TenantConfig;

class ReporteController extends Controller
{
    protected $service;

    public function __construct(ReportingService $service)
    {
        $this->service = $service;
    }

    // --- VISTAS MAESTRAS (DASHBOARDS) ---
    public function indexVentas() { return Inertia::render('Reportes/Dashboards/Ventas'); }
    public function indexAdmin() { return Inertia::render('Reportes/Dashboards/Administrativos'); }
    public function indexFinancieros() { return Inertia::render('Reportes/Dashboards/Financieros'); }
    public function indexContabilidad() { return Inertia::render('Reportes/Dashboards/Contabilidad'); }
    public function indexExportar() { return Inertia::render('Reportes/Dashboards/Exportar'); }

    private function getDates(Request $request)
    {
        return [
            $request->fecha_inicio ?? now()->startOfMonth()->format('Y-m-d'),
            $request->fecha_fin ?? now()->endOfMonth()->format('Y-m-d')
        ];
    }

    private function respondPdf($titulo, $inicio, $fin, $columnas, $fields, $data, $landscape = false)
    {
        $config = TenantConfig::first();
        $pdfData = [
            'titulo' => $titulo,
            'inicio' => $inicio,
            'fin' => $fin,
            'columnas' => $columnas,
            'fields' => $fields,
            'data' => $data,
            'config' => $config
        ];
        
        $pdf = Pdf::loadView('pdf.reporte_generico', $pdfData);
        if ($landscape) {
            $pdf->setPaper('a4', 'landscape');
        }
        
        return $pdf->download(str_replace(' ', '_', $titulo) . "_$inicio-$fin.pdf");
    }

    public function ventasGenerales(Request $request)
    {
        [$inicio, $fin] = $this->getDates($request);
        $data = $this->service->getVentasGenerales($inicio, $fin);
        
        if ($request->has('export_pdf')) {
            return $this->respondPdf(
                'Reporte de Ventas Generales', $inicio, $fin,
                ['Fecha', 'Factura', 'Cliente', 'Estado', 'Subtotal', 'ITBMS', 'Total'],
                ['fecha_emision', 'numero_factura', 'cliente.razon_social', 'estado', 'subtotal', 'itbms_total', 'total'],
                $data
            );
        }

        return Inertia::render('Reportes/VentasGenerales', [
            'reportData' => $data,
            'filtros' => ['fecha_inicio' => $inicio, 'fecha_fin' => $fin]
        ]);
    }

    public function ventasPorItem(Request $request)
    {
        [$inicio, $fin] = $this->getDates($request);
        $data = $this->service->getVentasPorItem($inicio, $fin);

        if ($request->has('export_pdf')) {
            return $this->respondPdf(
                'Ventas por Ítem', $inicio, $fin,
                ['Código', 'Nombre', 'Cantidad', 'Total Ventas'],
                ['codigo', 'nombre', 'cantidad_total', 'total_ventas'],
                $data
            );
        }

        return Inertia::render('Reportes/VentasPorItem', [
            'reportData' => $data,
            'filtros' => ['fecha_inicio' => $inicio, 'fecha_fin' => $fin]
        ]);
    }

    public function rentabilidadItems(Request $request)
    {
        [$inicio, $fin] = $this->getDates($request);
        $data = $this->service->getRentabilidadItems($inicio, $fin);

        if ($request->has('export_pdf')) {
            return $this->respondPdf(
                'Reporte de Rentabilidad por Ítem', $inicio, $fin,
                ['Código', 'Nombre', 'Cant', 'Venta Total', 'Costo Total', 'Utilidad', 'Margen %'],
                ['codigo', 'nombre', 'cantidad', 'venta_total', 'costo_total', 'utilidad', 'margen'],
                $data,
                true // Landscape
            );
        }

        return Inertia::render('Reportes/RentabilidadItems', [
            'reportData' => $data,
            'filtros' => ['fecha_inicio' => $inicio, 'fecha_fin' => $fin]
        ]);
    }

    public function balanceComprobacion(Request $request)
    {
        [$inicio, $fin] = $this->getDates($request);
        // Logic will be implemented in service, for now return placeholder or early data
        $data = $this->service->getBalanceGeneral($fin); // Simple version for now

        if ($request->has('export_pdf')) {
            return $this->respondPdf(
                'Balance de Comprobación', $inicio, $fin,
                ['Código', 'Nombre', 'Tipo', 'Saldo'],
                ['codigo', 'nombre', 'tipo', 'saldo_actual'],
                $data,
                true // Landscape
            );
        }

        return Inertia::render('Reportes/Placeholder', ['report' => 'Balance de Comprobación']);
    }

    public function cuadreCaja(Request $request)
    {
        [$inicio, $fin] = $this->getDates($request);
        // Placeholder data logic
        if ($request->has('export_pdf')) {
            return $this->respondPdf(
                'Cuadre de Caja Diario', $inicio, $fin,
                ['Método', 'Ingresos', 'Egresos', 'Total'],
                ['metodo', 'ingresos', 'egresos', 'total'],
                [],
                true // Landscape
            );
        }

        return Inertia::render('Reportes/Placeholder', ['report' => 'Cuadre de Caja']);
    }

    public function ventasPorVendedor(Request $request)
    {
        [$inicio, $fin] = $this->getDates($request);
        $data = $this->service->getVentasPorVendedor($inicio, $fin);

        if ($request->has('export_pdf')) {
            return $this->respondPdf(
                'Ventas por Vendedor', $inicio, $fin,
                ['Vendedor', 'Facturas', 'Total Ventas'],
                ['nombre', 'total_facturas', 'total_ventas'],
                $data
            );
        }

        return Inertia::render('Reportes/VentasVendedor', [
            'reportData' => $data,
            'filtros' => ['fecha_inicio' => $inicio, 'fecha_fin' => $fin]
        ]);
    }

    public function estadoResultados(Request $request)
    {
        [$inicio, $fin] = $this->getDates($request);
        $data = $this->service->getEstadoResultados($inicio, $fin);

        if ($request->has('export_pdf')) {
             return $this->respondPdf(
                'Estado de Resultados', $inicio, $fin,
                ['Código', 'Nombre', 'Tipo', 'Saldo'],
                ['codigo', 'nombre', 'tipo', 'saldo'],
                $data['detalles']
             );
        }

        return Inertia::render('Reportes/EstadoResultados', [
            'reportData' => $data,
            'filtros' => ['fecha_inicio' => $inicio, 'fecha_fin' => $fin]
        ]);
    }

    public function valorInventario(Request $request)
    {
        $data = $this->service->getValorInventario();
        
        if ($request->has('export_pdf')) {
            return $this->respondPdf(
                'Valorización de Inventario', date('Y-m-d'), date('Y-m-d'),
                ['Código', 'Nombre', 'Stock', 'Costo Prom', 'Valor Total'],
                ['codigo', 'nombre', 'stock_actual', 'costo_promedio', 'valor_total'],
                $data
            );
        }

        return Inertia::render('Reportes/ValorInventario', [
            'reportData' => $data
        ]);
    }

    public function cuentasPorCobrar(Request $request)
    {
        $data = $this->service->getCuentasPorCobrar();

        if ($request->has('export_pdf')) {
            return $this->respondPdf(
                'Cartera de Cuentas por Cobrar', date('Y-m-d'), date('Y-m-d'),
                ['Factura', 'Cliente', 'Emisión', 'Vencimiento', 'Saldo'],
                ['numero_factura', 'cliente.razon_social', 'fecha_emision', 'fecha_vencimiento', 'saldo_pendiente'],
                $data
            );
        }

        return Inertia::render('Reportes/CuentasPorCobrar', [
            'reportData' => $data
        ]);
    }

    public function cuentasPorPagar(Request $request)
    {
        $data = $this->service->getCuentasPorPagar();

        if ($request->has('export_pdf')) {
            return $this->respondPdf(
                'Cuentas por Pagar a Proveedores', date('Y-m-d'), date('Y-m-d'),
                ['Factura', 'Proveedor', 'Emisión', 'Vencimiento', 'Saldo'],
                ['numero_factura_proveedor', 'proveedor.razon_social', 'fecha_emision', 'fecha_vencimiento', 'saldo_pendiente'],
                $data
            );
        }

        return Inertia::render('Reportes/CuentasPorPagar', [
            'reportData' => $data
        ]);
    }

    public function impuestos(Request $request)
    {
        [$inicio, $fin] = $this->getDates($request);
        $data = $this->service->getImpuestos($inicio, $fin);

        return Inertia::render('Reportes/Impuestos', [
            'reportData' => $data,
            'filtros' => ['fecha_inicio' => $inicio, 'fecha_fin' => $fin]
        ]);
    }

    public function flujoCaja(Request $request)
    {
        [$inicio, $fin] = $this->getDates($request);
        $data = $this->service->getFlujoCaja($inicio, $fin);

        if ($request->has('export_pdf')) {
            return $this->respondPdf(
                'Flujo de Caja (Cajas y Bancos)', $inicio, $fin,
                ['Fecha', 'Banco', 'Concepto', 'Referencia', 'Monto'],
                ['fecha', 'banco', 'descripcion', 'referencia', 'monto'],
                $data
            );
        }

        return Inertia::render('Reportes/FlujoCaja', [
            'reportData' => $data,
            'filtros' => ['fecha_inicio' => $inicio, 'fecha_fin' => $fin]
        ]);
    }

    public function ventasPorCliente(Request $request)
    {
        [$inicio, $fin] = $this->getDates($request);
        $data = $this->service->getVentasPorCliente($inicio, $fin);

        if ($request->has('export_pdf')) {
            return $this->respondPdf(
                'Ventas por Cliente', $inicio, $fin,
                ['Cliente', 'Identificación', 'Facturas', 'Total'],
                ['cliente', 'identificacion', 'total_facturas', 'total_ventas'],
                $data
            );
        }

        return Inertia::render('Reportes/VentasPorCliente', [
            'reportData' => $data,
            'filtros' => ['fecha_inicio' => $inicio, 'fecha_fin' => $fin]
        ]);
    }

    public function compras(Request $request)
    {
        [$inicio, $fin] = $this->getDates($request);
        $data = $this->service->getCompras($inicio, $fin);

        if ($request->has('export_pdf')) {
            return $this->respondPdf(
                'Reporte de Compras', $inicio, $fin,
                ['Fecha', 'Factura', 'Proveedor', 'Subtotal', 'ITBMS', 'Total'],
                ['fecha_emision', 'numero_factura_proveedor', 'proveedor.razon_social', 'subtotal', 'itbms_total', 'total'],
                $data
            );
        }

        return Inertia::render('Reportes/Compras', [
            'reportData' => $data,
            'filtros' => ['fecha_inicio' => $inicio, 'fecha_fin' => $fin]
        ]);
    }

    public function ingresosGastos(Request $request)
    {
        [$inicio, $fin] = $this->getDates($request);
        $data = $this->service->getIngresosGastos($inicio, $fin);

        return Inertia::render('Reportes/IngresosGastos', [
            'reportData' => $data,
            'filtros' => ['fecha_inicio' => $inicio, 'fecha_fin' => $fin]
        ]);
    }

    public function balanceGeneral(Request $request)
    {
        $fecha = $request->fecha_fin ?? now()->format('Y-m-d');
        $data = $this->service->getBalanceGeneral($fecha);

        if ($request->has('export_pdf')) {
            return $this->respondPdf(
                'Balance de Situación Financiera', 'Saldos Iniciales', $fecha,
                ['Código', 'Nombre', 'Tipo', 'Saldo Actual'],
                ['codigo', 'nombre', 'tipo', 'saldo_actual'],
                $data
            );
        }

        return Inertia::render('Reportes/BalanceGeneral', [
            'reportData' => $data,
            'filtros' => ['fecha_fin' => $fecha]
        ]);
    }

    public function __call($method, $parameters)
    {
        return Inertia::render('Reportes/Placeholder', ['report' => $method]);
    }
}