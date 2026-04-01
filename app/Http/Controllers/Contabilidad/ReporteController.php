<?php

namespace App\Http\Controllers\Contabilidad;

use App\Http\Controllers\Controller;
use App\Services\ReportingService;
use App\Services\Reports\ReportExportService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ReporteController extends Controller
{
    protected ReportingService $service;
    protected ReportExportService $exportService;

    public function __construct(ReportingService $service, ReportExportService $exportService)
    {
        $this->service = $service;
        $this->exportService = $exportService;
    }

    public function indexVentas() { return Inertia::render('Reportes/Dashboards/Ventas'); }
    public function indexAdmin() { return Inertia::render('Reportes/Dashboards/Administrativos'); }
    public function indexFinancieros() { return Inertia::render('Reportes/Dashboards/Financieros'); }
    public function indexContabilidad() { return Inertia::render('Reportes/Dashboards/Contabilidad'); }
    public function indexExportar() { return Inertia::render('Reportes/Dashboards/Exportar'); }

    private function getDates(Request $request): array
    {
        return [
            $request->fecha_inicio ?? now()->startOfMonth()->format('Y-m-d'),
            $request->fecha_fin ?? now()->endOfMonth()->format('Y-m-d'),
        ];
    }

    private function maybeExport(Request $request, string $titulo, string $inicio, string $fin, array $columnas, array $fields, $data, bool $landscape = false)
    {
        $export = $request->string('export')->toString();

        if ($request->has('export_pdf') || $export === 'pdf') {
            return $this->exportService->toPdf($titulo, $inicio, $fin, $columnas, $fields, $data, $landscape);
        }

        if ($request->has('export_csv') || $export === 'csv') {
            return $this->exportService->toCsv($titulo, $inicio, $fin, $columnas, $fields, $data);
        }

        return null;
    }

    private function renderGenericReport(
        Request $request,
        string $routeName,
        string $title,
        string $description,
        array $columns,
        array $fields,
        $rows,
        array $filters,
        array $summaryCards = [],
        bool $landscape = false
    ) {
        $inicio = $filters['fecha_inicio'] ?? ($filters['fecha_fin'] ?? now()->format('Y-m-d'));
        $fin = $filters['fecha_fin'] ?? ($filters['fecha_inicio'] ?? now()->format('Y-m-d'));

        $export = $this->maybeExport($request, $title, $inicio, $fin, array_column($columns, 'label'), $fields, $rows, $landscape);
        if ($export) {
            return $export;
        }

        return Inertia::render('Reportes/GenericTable', [
            'title' => $title,
            'description' => $description,
            'routeName' => $routeName,
            'columns' => $columns,
            'reportData' => collect($rows)->values(),
            'filtros' => $filters,
            'summaryCards' => $summaryCards,
        ]);
    }

    public function ventasGenerales(Request $request)
    {
        [$inicio, $fin] = $this->getDates($request);
        $data = $this->service->getVentasGenerales($inicio, $fin);

        $export = $this->maybeExport(
            $request,
            'Reporte de Ventas Generales',
            $inicio,
            $fin,
            ['Fecha', 'Factura', 'Cliente', 'Estado', 'Subtotal', 'ITBMS', 'Total'],
            ['fecha_emision', 'numero_factura', 'cliente.razon_social', 'estado', 'subtotal', 'itbms_total', 'total'],
            $data
        );

        if ($export) {
            return $export;
        }

        return Inertia::render('Reportes/VentasGenerales', [
            'reportData' => $data,
            'filtros' => ['fecha_inicio' => $inicio, 'fecha_fin' => $fin],
        ]);
    }

    public function ventasPorItem(Request $request)
    {
        [$inicio, $fin] = $this->getDates($request);
        $data = $this->service->getVentasPorItem($inicio, $fin);

        $export = $this->maybeExport(
            $request,
            'Ventas por Item',
            $inicio,
            $fin,
            ['Codigo', 'Nombre', 'Cantidad', 'Total Ventas'],
            ['codigo', 'nombre', 'cantidad_total', 'total_ventas'],
            $data
        );

        if ($export) {
            return $export;
        }

        return Inertia::render('Reportes/VentasPorItem', [
            'reportData' => $data,
            'filtros' => ['fecha_inicio' => $inicio, 'fecha_fin' => $fin],
        ]);
    }

    public function rentabilidadItems(Request $request)
    {
        [$inicio, $fin] = $this->getDates($request);
        $data = $this->service->getRentabilidadItems($inicio, $fin);

        $export = $this->maybeExport(
            $request,
            'Reporte de Rentabilidad por Item',
            $inicio,
            $fin,
            ['Codigo', 'Nombre', 'Cant', 'Venta Total', 'Costo Total', 'Utilidad', 'Margen %'],
            ['codigo', 'nombre', 'cantidad', 'venta_total', 'costo_total', 'utilidad', 'margen'],
            $data,
            true
        );

        if ($export) {
            return $export;
        }

        return Inertia::render('Reportes/RentabilidadItems', [
            'reportData' => $data,
            'filtros' => ['fecha_inicio' => $inicio, 'fecha_fin' => $fin],
        ]);
    }

    public function ventasPorVendedor(Request $request)
    {
        [$inicio, $fin] = $this->getDates($request);
        $rows = $this->service->getVentasPorVendedor($inicio, $fin);

        return $this->renderGenericReport(
            $request,
            'reportes.ventas.vendedores',
            'Ventas por Vendedor',
            'Resumen de facturas y ventas agrupadas por vendedor.',
            [
                ['key' => 'nombre', 'label' => 'Vendedor'],
                ['key' => 'total_facturas', 'label' => 'Facturas'],
                ['key' => 'total_ventas', 'label' => 'Total Ventas', 'type' => 'currency'],
            ],
            ['nombre', 'total_facturas', 'total_ventas'],
            $rows,
            ['fecha_inicio' => $inicio, 'fecha_fin' => $fin],
            [
                ['label' => 'Vendedores', 'value' => collect($rows)->count()],
                ['label' => 'Facturas', 'value' => collect($rows)->sum('total_facturas')],
                ['label' => 'Ventas', 'value' => round((float) collect($rows)->sum('total_ventas'), 2), 'type' => 'currency'],
            ]
        );
    }

    public function estadoCuentaCliente(Request $request)
    {
        [$inicio, $fin] = $this->getDates($request);
        $rows = $this->service->getEstadoCuentaClienteResumen($inicio, $fin);

        return $this->renderGenericReport(
            $request,
            'reportes.ventas.estado-cuenta-cliente',
            'Estado de Cuenta por Cliente',
            'Consolidado de facturas emitidas y saldos pendientes por cliente.',
            [
                ['key' => 'cliente', 'label' => 'Cliente'],
                ['key' => 'identificacion', 'label' => 'Identificacion'],
                ['key' => 'facturas', 'label' => 'Facturas'],
                ['key' => 'total_facturado', 'label' => 'Facturado', 'type' => 'currency'],
                ['key' => 'saldo_pendiente', 'label' => 'Saldo Pendiente', 'type' => 'currency'],
            ],
            ['cliente', 'identificacion', 'facturas', 'total_facturado', 'saldo_pendiente'],
            $rows,
            ['fecha_inicio' => $inicio, 'fecha_fin' => $fin],
            [
                ['label' => 'Clientes', 'value' => collect($rows)->count()],
                ['label' => 'Facturado', 'value' => round((float) collect($rows)->sum('total_facturado'), 2), 'type' => 'currency'],
                ['label' => 'Pendiente', 'value' => round((float) collect($rows)->sum('saldo_pendiente'), 2), 'type' => 'currency'],
            ]
        );
    }

    public function estadoResultados(Request $request)
    {
        [$inicio, $fin] = $this->getDates($request);
        $data = $this->service->getEstadoResultados($inicio, $fin);

        $export = $this->maybeExport(
            $request,
            'Estado de Resultados',
            $inicio,
            $fin,
            ['Codigo', 'Nombre', 'Tipo', 'Saldo'],
            ['codigo', 'nombre', 'tipo', 'saldo'],
            $data['detalles']
        );

        if ($export) {
            return $export;
        }

        return Inertia::render('Reportes/EstadoResultados', [
            'reportData' => $data,
            'filtros' => ['fecha_inicio' => $inicio, 'fecha_fin' => $fin],
        ]);
    }

    public function valorInventario(Request $request)
    {
        [$inicio, $fin] = $this->getDates($request);
        $data = $this->service->getValorInventario($inicio, $fin);

        $export = $this->maybeExport(
            $request,
            'Valorizacion de Inventario',
            $inicio,
            $fin,
            ['Codigo', 'Nombre', 'Stock', 'Costo Prom', 'Entradas', 'Salidas', 'Valor Total'],
            ['codigo', 'nombre', 'stock_actual', 'costo_promedio', 'entradas_periodo', 'salidas_periodo', 'valor_total'],
            $data['items']
        );

        if ($export) {
            return $export;
        }

        return Inertia::render('Reportes/ValorInventario', [
            'reportData' => $data,
            'filtros' => ['fecha_inicio' => $inicio, 'fecha_fin' => $fin],
        ]);
    }

    public function cuentasPorCobrar(Request $request)
    {
        $data = $this->service->getCuentasPorCobrar();
        $today = now()->format('Y-m-d');

        $export = $this->maybeExport(
            $request,
            'Cartera de Cuentas por Cobrar',
            $today,
            $today,
            ['Factura', 'Cliente', 'Emision', 'Vencimiento', 'Saldo'],
            ['numero_factura', 'cliente.razon_social', 'fecha_emision', 'fecha_vencimiento', 'saldo_pendiente'],
            $data
        );

        if ($export) {
            return $export;
        }

        return Inertia::render('Reportes/CuentasPorCobrar', [
            'reportData' => $data,
        ]);
    }

    public function cuentasPorPagar(Request $request)
    {
        $data = $this->service->getCuentasPorPagar();
        $today = now()->format('Y-m-d');

        $export = $this->maybeExport(
            $request,
            'Cuentas por Pagar a Proveedores',
            $today,
            $today,
            ['Factura', 'Proveedor', 'Emision', 'Vencimiento', 'Saldo'],
            ['numero_factura_proveedor', 'proveedor.razon_social', 'fecha_emision', 'fecha_vencimiento', 'saldo_pendiente'],
            $data
        );

        if ($export) {
            return $export;
        }

        return Inertia::render('Reportes/CuentasPorPagar', [
            'reportData' => $data,
        ]);
    }

    public function impuestos(Request $request)
    {
        [$inicio, $fin] = $this->getDates($request);
        $data = $this->service->getImpuestos($inicio, $fin);
        $rows = [
            [
                'tipo' => 'Ventas',
                'base' => round((float) ($data['ventas']->base ?? 0), 2),
                'impuesto' => round((float) ($data['ventas']->impuesto ?? 0), 2),
            ],
            [
                'tipo' => 'Compras',
                'base' => round((float) ($data['compras']->base ?? 0), 2),
                'impuesto' => round((float) ($data['compras']->impuesto ?? 0), 2),
            ],
        ];

        $export = $this->maybeExport(
            $request,
            'Impuestos e ITBMS',
            $inicio,
            $fin,
            ['Tipo', 'Base Imponible', 'ITBMS'],
            ['tipo', 'base', 'impuesto'],
            $rows
        );

        if ($export) {
            return $export;
        }

        return Inertia::render('Reportes/Impuestos', [
            'reportData' => $data,
            'filtros' => ['fecha_inicio' => $inicio, 'fecha_fin' => $fin],
        ]);
    }

    public function flujoCaja(Request $request)
    {
        [$inicio, $fin] = $this->getDates($request);
        $data = $this->service->getFlujoCaja($inicio, $fin);

        $export = $this->maybeExport(
            $request,
            'Flujo de Caja (Cajas y Bancos)',
            $inicio,
            $fin,
            ['Fecha', 'Banco', 'Concepto', 'Referencia', 'Monto'],
            ['fecha', 'banco', 'descripcion', 'referencia', 'monto'],
            $data
        );

        if ($export) {
            return $export;
        }

        return Inertia::render('Reportes/FlujoCaja', [
            'reportData' => $data,
            'filtros' => ['fecha_inicio' => $inicio, 'fecha_fin' => $fin],
        ]);
    }

    public function cuadreCaja(Request $request)
    {
        [$inicio, $fin] = $this->getDates($request);
        $data = $this->service->getCuadreCaja($inicio, $fin);

        $export = $this->maybeExport(
            $request,
            'Cuadre de Caja Diario',
            $inicio,
            $fin,
            ['Caja', 'Cajero', 'Estado', 'Apertura', 'Ventas Efectivo', 'Ventas Tarjeta', 'Ventas Transferencia', 'Entradas', 'Salidas', 'Esperado', 'Real', 'Diferencia'],
            ['caja', 'cajero', 'estado', 'apertura', 'ventas_efectivo', 'ventas_tarjeta', 'ventas_transferencia', 'entradas', 'salidas', 'esperado', 'real', 'diferencia'],
            $data['sesiones'],
            true
        );

        if ($export) {
            return $export;
        }

        return Inertia::render('Reportes/CuadreCaja', [
            'reportData' => $data,
            'filtros' => ['fecha_inicio' => $inicio, 'fecha_fin' => $fin],
        ]);
    }

    public function reporteCajas(Request $request)
    {
        [$inicio, $fin] = $this->getDates($request);
        $rows = $this->service->getReporteCajas($inicio, $fin);

        return $this->renderGenericReport(
            $request,
            'reportes.financieros.reporte-cajas',
            'Reporte Consolidado de Cajas',
            'Acumulado por caja a partir de las sesiones cerradas o en curso.',
            [
                ['key' => 'caja', 'label' => 'Caja'],
                ['key' => 'sesiones', 'label' => 'Sesiones'],
                ['key' => 'apertura', 'label' => 'Apertura', 'type' => 'currency'],
                ['key' => 'ventas_efectivo', 'label' => 'Efectivo', 'type' => 'currency'],
                ['key' => 'ventas_tarjeta', 'label' => 'Tarjeta', 'type' => 'currency'],
                ['key' => 'ventas_transferencia', 'label' => 'Transferencia', 'type' => 'currency'],
                ['key' => 'real', 'label' => 'Real', 'type' => 'currency'],
                ['key' => 'diferencia', 'label' => 'Diferencia', 'type' => 'currency'],
            ],
            ['caja', 'sesiones', 'apertura', 'ventas_efectivo', 'ventas_tarjeta', 'ventas_transferencia', 'real', 'diferencia'],
            $rows,
            ['fecha_inicio' => $inicio, 'fecha_fin' => $fin]
        );
    }

    public function ventasPorCliente(Request $request)
    {
        [$inicio, $fin] = $this->getDates($request);
        $data = $this->service->getVentasPorCliente($inicio, $fin);

        $export = $this->maybeExport(
            $request,
            'Ventas por Cliente',
            $inicio,
            $fin,
            ['Cliente', 'Identificacion', 'Facturas', 'Total'],
            ['cliente', 'identificacion', 'total_facturas', 'total_ventas'],
            $data
        );

        if ($export) {
            return $export;
        }

        return Inertia::render('Reportes/VentasPorCliente', [
            'reportData' => $data,
            'filtros' => ['fecha_inicio' => $inicio, 'fecha_fin' => $fin],
        ]);
    }

    public function compras(Request $request)
    {
        [$inicio, $fin] = $this->getDates($request);
        $data = $this->service->getCompras($inicio, $fin);

        $export = $this->maybeExport(
            $request,
            'Reporte de Compras',
            $inicio,
            $fin,
            ['Fecha', 'Factura', 'Proveedor', 'Subtotal', 'ITBMS', 'Total'],
            ['fecha_emision', 'numero_factura_proveedor', 'proveedor.razon_social', 'subtotal', 'itbms_total', 'total'],
            $data
        );

        if ($export) {
            return $export;
        }

        return Inertia::render('Reportes/Compras', [
            'reportData' => $data,
            'filtros' => ['fecha_inicio' => $inicio, 'fecha_fin' => $fin],
        ]);
    }

    public function transacciones(Request $request)
    {
        [$inicio, $fin] = $this->getDates($request);
        $rows = $this->service->getTransacciones($inicio, $fin);

        return $this->renderGenericReport(
            $request,
            'reportes.admin.transacciones',
            'Transacciones',
            'Movimientos consolidados de bancos, cobros y pagos.',
            [
                ['key' => 'fecha', 'label' => 'Fecha'],
                ['key' => 'modulo', 'label' => 'Modulo'],
                ['key' => 'tipo', 'label' => 'Tipo'],
                ['key' => 'referencia', 'label' => 'Referencia'],
                ['key' => 'descripcion', 'label' => 'Descripcion'],
                ['key' => 'entrada', 'label' => 'Entrada', 'type' => 'currency'],
                ['key' => 'salida', 'label' => 'Salida', 'type' => 'currency'],
            ],
            ['fecha', 'modulo', 'tipo', 'referencia', 'descripcion', 'entrada', 'salida'],
            $rows,
            ['fecha_inicio' => $inicio, 'fecha_fin' => $fin]
        );
    }

    public function reporteAnual(Request $request)
    {
        $year = (int) ($request->year ?? now()->year);
        $data = $this->service->getReporteAnual($year);

        $export = $this->maybeExport(
            $request,
            "Reporte Anual {$year}",
            "{$year}-01-01",
            "{$year}-12-31",
            ['Mes', 'Ventas', 'Compras', 'Cobros', 'Pagos', 'Balance'],
            ['mes', 'ventas', 'compras', 'cobros', 'pagos', 'balance'],
            $data['meses']
        );

        if ($export) {
            return $export;
        }

        return Inertia::render('Reportes/GenericTable', [
            'title' => "Reporte Anual {$year}",
            'description' => 'Resumen mensual consolidado del ano seleccionado.',
            'routeName' => 'reportes.admin.anual',
            'columns' => [
                ['key' => 'mes', 'label' => 'Mes'],
                ['key' => 'ventas', 'label' => 'Ventas', 'type' => 'currency'],
                ['key' => 'compras', 'label' => 'Compras', 'type' => 'currency'],
                ['key' => 'cobros', 'label' => 'Cobros', 'type' => 'currency'],
                ['key' => 'pagos', 'label' => 'Pagos', 'type' => 'currency'],
                ['key' => 'balance', 'label' => 'Balance', 'type' => 'currency'],
            ],
            'reportData' => collect($data['meses'])->values(),
            'filtros' => ['fecha_inicio' => "{$year}-01-01", 'fecha_fin' => "{$year}-12-31", 'year' => $year],
            'summaryCards' => [
                ['label' => 'Ventas', 'value' => $data['resumen']['ventas'], 'type' => 'currency'],
                ['label' => 'Compras', 'value' => $data['resumen']['compras'], 'type' => 'currency'],
                ['label' => 'Cobros', 'value' => $data['resumen']['cobros'], 'type' => 'currency'],
                ['label' => 'Pagos', 'value' => $data['resumen']['pagos'], 'type' => 'currency'],
                ['label' => 'Balance', 'value' => $data['resumen']['balance'], 'type' => 'currency'],
            ],
        ]);
    }

    public function ingresosGastos(Request $request)
    {
        [$inicio, $fin] = $this->getDates($request);
        $data = $this->service->getIngresosGastos($inicio, $fin);
        $rows = [[
            'ingresos' => round((float) $data['ingresos'], 2),
            'gastos' => round((float) $data['gastos'], 2),
            'balance' => round((float) $data['balance'], 2),
        ]];

        $export = $this->maybeExport(
            $request,
            'Ingresos vs Gastos',
            $inicio,
            $fin,
            ['Ingresos', 'Gastos', 'Balance'],
            ['ingresos', 'gastos', 'balance'],
            $rows
        );

        if ($export) {
            return $export;
        }

        return Inertia::render('Reportes/IngresosGastos', [
            'reportData' => $data,
            'filtros' => ['fecha_inicio' => $inicio, 'fecha_fin' => $fin],
        ]);
    }

    public function balanceGeneral(Request $request)
    {
        $fecha = $request->fecha_fin ?? now()->format('Y-m-d');
        $rows = $this->service->getBalanceGeneral($fecha);

        return $this->renderGenericReport(
            $request,
            'reportes.contabilidad.balance-general',
            'Balance General',
            'Saldos contables acumulados al corte seleccionado.',
            [
                ['key' => 'codigo', 'label' => 'Codigo'],
                ['key' => 'nombre', 'label' => 'Cuenta'],
                ['key' => 'tipo', 'label' => 'Tipo'],
                ['key' => 'saldo_actual', 'label' => 'Saldo Actual', 'type' => 'currency'],
            ],
            ['codigo', 'nombre', 'tipo', 'saldo_actual'],
            $rows,
            ['fecha_inicio' => $fecha, 'fecha_fin' => $fecha],
            [
                ['label' => 'Cuentas', 'value' => collect($rows)->count()],
                ['label' => 'Saldo Neto', 'value' => round((float) collect($rows)->sum('saldo_actual'), 2), 'type' => 'currency'],
            ]
        );
    }

    public function movimientosCuenta(Request $request)
    {
        [$inicio, $fin] = $this->getDates($request);
        $rows = $this->service->getMovimientosCuenta($inicio, $fin);

        return $this->renderGenericReport(
            $request,
            'reportes.contabilidad.movimientos-cuenta',
            'Movimientos de Cuenta',
            'Detalle contable por movimientos registrados en el diario.',
            [
                ['key' => 'fecha', 'label' => 'Fecha'],
                ['key' => 'referencia', 'label' => 'Referencia'],
                ['key' => 'concepto', 'label' => 'Concepto'],
                ['key' => 'codigo', 'label' => 'Codigo'],
                ['key' => 'cuenta', 'label' => 'Cuenta'],
                ['key' => 'debito', 'label' => 'Debito', 'type' => 'currency'],
                ['key' => 'credito', 'label' => 'Credito', 'type' => 'currency'],
            ],
            ['fecha', 'referencia', 'concepto', 'codigo', 'cuenta', 'debito', 'credito'],
            $rows,
            ['fecha_inicio' => $inicio, 'fecha_fin' => $fin],
            [],
            true
        );
    }

    public function libroDiario(Request $request)
    {
        [$inicio, $fin] = $this->getDates($request);
        $rows = $this->service->getLibroDiario($inicio, $fin);

        return $this->renderGenericReport(
            $request,
            'reportes.contabilidad.libro-diario',
            'Libro Diario',
            'Resumen cronologico de asientos contables.',
            [
                ['key' => 'fecha', 'label' => 'Fecha'],
                ['key' => 'referencia', 'label' => 'Referencia'],
                ['key' => 'concepto', 'label' => 'Concepto'],
                ['key' => 'total_debito', 'label' => 'Debito', 'type' => 'currency'],
                ['key' => 'total_credito', 'label' => 'Credito', 'type' => 'currency'],
            ],
            ['fecha', 'referencia', 'concepto', 'total_debito', 'total_credito'],
            $rows,
            ['fecha_inicio' => $inicio, 'fecha_fin' => $fin],
            [],
            true
        );
    }

    public function auxiliarTercero(Request $request)
    {
        [$inicio, $fin] = $this->getDates($request);
        $rows = $this->service->getAuxiliarTercero($inicio, $fin);

        return $this->renderGenericReport(
            $request,
            'reportes.contabilidad.auxiliar-tercero',
            'Auxiliar de Terceros',
            'Consolidado por cliente sobre facturacion y cobros.',
            [
                ['key' => 'tercero', 'label' => 'Tercero'],
                ['key' => 'identificacion', 'label' => 'Identificacion'],
                ['key' => 'debito', 'label' => 'Debito', 'type' => 'currency'],
                ['key' => 'credito', 'label' => 'Credito', 'type' => 'currency'],
                ['key' => 'saldo', 'label' => 'Saldo', 'type' => 'currency'],
            ],
            ['tercero', 'identificacion', 'debito', 'credito', 'saldo'],
            $rows,
            ['fecha_inicio' => $inicio, 'fecha_fin' => $fin]
        );
    }

    public function balanceComprobacion(Request $request)
    {
        [$inicio, $fin] = $this->getDates($request);
        $data = $this->service->getBalanceComprobacion($inicio, $fin);

        $export = $this->maybeExport(
            $request,
            'Balance de Comprobacion',
            $inicio,
            $fin,
            ['Codigo', 'Nombre', 'Tipo', 'Saldo Inicial', 'Debitos Periodo', 'Creditos Periodo', 'Saldo Final'],
            ['codigo', 'nombre', 'tipo', 'saldo_inicial', 'debitos_periodo', 'creditos_periodo', 'saldo_final'],
            $data['cuentas'],
            true
        );

        if ($export) {
            return $export;
        }

        return Inertia::render('Reportes/BalanceComprobacion', [
            'reportData' => $data,
            'filtros' => ['fecha_inicio' => $inicio, 'fecha_fin' => $fin],
        ]);
    }

    public function formasPago(Request $request)
    {
        [$inicio, $fin] = $this->getDates($request);
        $rows = $this->service->getFormasPago($inicio, $fin);

        return $this->renderGenericReport(
            $request,
            'reportes.contabilidad.formas-pago',
            'Formas de Pago',
            'Distribucion de cobros por metodo de pago.',
            [
                ['key' => 'metodo_pago', 'label' => 'Metodo de Pago'],
                ['key' => 'transacciones', 'label' => 'Transacciones'],
                ['key' => 'total', 'label' => 'Total', 'type' => 'currency'],
            ],
            ['metodo_pago', 'transacciones', 'total'],
            $rows,
            ['fecha_inicio' => $inicio, 'fecha_fin' => $fin]
        );
    }

    public function exportFacturas(Request $request)
    {
        [$inicio, $fin] = $this->getDates($request);
        $rows = $this->service->getExportFacturas($inicio, $fin);

        return $this->renderGenericReport(
            $request,
            'reportes.exportar.facturas',
            'Exportacion de Facturas',
            'Salida tabular de facturas para integraciones y revision administrativa.',
            [
                ['key' => 'fecha_emision', 'label' => 'Fecha'],
                ['key' => 'numero_factura', 'label' => 'Factura'],
                ['key' => 'cliente', 'label' => 'Cliente'],
                ['key' => 'identificacion', 'label' => 'Identificacion'],
                ['key' => 'subtotal', 'label' => 'Subtotal', 'type' => 'currency'],
                ['key' => 'itbms_total', 'label' => 'ITBMS', 'type' => 'currency'],
                ['key' => 'total', 'label' => 'Total', 'type' => 'currency'],
                ['key' => 'estado', 'label' => 'Estado'],
            ],
            ['fecha_emision', 'numero_factura', 'cliente', 'identificacion', 'subtotal', 'itbms_total', 'total', 'estado'],
            $rows,
            ['fecha_inicio' => $inicio, 'fecha_fin' => $fin]
        );
    }

    public function exportContador(Request $request)
    {
        [$inicio, $fin] = $this->getDates($request);
        $rows = $this->service->getExportContador($inicio, $fin);

        return $this->renderGenericReport(
            $request,
            'reportes.exportar.contador',
            'Exportacion para Contador',
            'Detalle de movimientos contables exportables.',
            [
                ['key' => 'fecha', 'label' => 'Fecha'],
                ['key' => 'referencia', 'label' => 'Referencia'],
                ['key' => 'concepto', 'label' => 'Concepto'],
                ['key' => 'codigo', 'label' => 'Codigo'],
                ['key' => 'cuenta', 'label' => 'Cuenta'],
                ['key' => 'debito', 'label' => 'Debito', 'type' => 'currency'],
                ['key' => 'credito', 'label' => 'Credito', 'type' => 'currency'],
            ],
            ['fecha', 'referencia', 'concepto', 'codigo', 'cuenta', 'debito', 'credito'],
            $rows,
            ['fecha_inicio' => $inicio, 'fecha_fin' => $fin],
            [],
            true
        );
    }
}
