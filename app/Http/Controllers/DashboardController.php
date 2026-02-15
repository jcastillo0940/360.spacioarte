<?php

namespace App\Http\Controllers;

use App\Models\FacturaVenta;
use App\Models\FacturaCompra;
use App\Models\Item;
use App\Models\Empleado;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Carbon\Carbon;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $periodo = $request->get('periodo', 'mes'); // dia, mes, trimestre, semestre, anual, historico
        
        // Determinar fechas según período
        $fechas = $this->calcularFechasPeriodo($periodo);
        $fechaInicio = $fechas['inicio'];
        $fechaFin = $fechas['fin'];
        
        // Stats principales
        $stats = [
            'ventas_mes' => $this->calcularVentas($fechaInicio, $fechaFin),
            'gastos_mes' => $this->calcularGastos($fechaInicio, $fechaFin),
            'cxc_pendiente' => $this->calcularCuentasPorCobrar(),
            'empleados' => Empleado::where('activo', true)->count(),
        ];
        
        // Gráfica de tendencia financiera
        $grafica = $this->generarGraficaTendencia($periodo, $fechaInicio, $fechaFin);
        
        // Top ventas por cliente
        $ventas_cliente = $this->ventasPorCliente($fechaInicio, $fechaFin);
        
        // Top ventas por producto
        $ventas_producto = $this->ventasPorProducto($fechaInicio, $fechaFin);
        
        // Rentabilidad por cliente
        $rentabilidad_cliente = $this->rentabilidadPorCliente($fechaInicio, $fechaFin);
        
        // Rentabilidad por producto
        $rentabilidad_producto = $this->rentabilidadPorProducto($fechaInicio, $fechaFin);
        
        // Ventas por vendedor
        $ventas_vendedor = $this->ventasPorVendedor($fechaInicio, $fechaFin);
        
        // Saldos de clientes
        $saldos_clientes = $this->saldosClientes();
        
        // Saldos de proveedores
        $saldos_proveedores = $this->saldosProveedores();
        
        return Inertia::render('Dashboard', [
            'stats' => $stats,
            'grafica' => $grafica,
            'ventas_cliente' => $ventas_cliente,
            'ventas_producto' => $ventas_producto,
            'rentabilidad_cliente' => $rentabilidad_cliente,
            'rentabilidad_producto' => $rentabilidad_producto,
            'ventas_vendedor' => $ventas_vendedor,
            'saldos_clientes' => $saldos_clientes,
            'saldos_proveedores' => $saldos_proveedores,
        ]);
    }
    
    private function calcularFechasPeriodo($periodo)
    {
        $ahora = Carbon::now();
        
        switch ($periodo) {
            case 'dia':
                return [
                    'inicio' => $ahora->copy()->startOfDay(),
                    'fin' => $ahora->copy()->endOfDay(),
                ];
            
            case 'mes':
                return [
                    'inicio' => $ahora->copy()->startOfMonth(),
                    'fin' => $ahora->copy()->endOfMonth(),
                ];
            
            case 'trimestre':
                return [
                    'inicio' => $ahora->copy()->startOfQuarter(),
                    'fin' => $ahora->copy()->endOfQuarter(),
                ];
            
            case 'semestre':
                $mes = $ahora->month;
                if ($mes <= 6) {
                    return [
                        'inicio' => $ahora->copy()->month(1)->startOfMonth(),
                        'fin' => $ahora->copy()->month(6)->endOfMonth(),
                    ];
                } else {
                    return [
                        'inicio' => $ahora->copy()->month(7)->startOfMonth(),
                        'fin' => $ahora->copy()->month(12)->endOfMonth(),
                    ];
                }
            
            case 'anual':
                return [
                    'inicio' => $ahora->copy()->startOfYear(),
                    'fin' => $ahora->copy()->endOfYear(),
                ];
            
            case 'historico':
                return [
                    'inicio' => Carbon::create(2020, 1, 1),
                    'fin' => $ahora->copy()->endOfDay(),
                ];
            
            default:
                return [
                    'inicio' => $ahora->copy()->startOfMonth(),
                    'fin' => $ahora->copy()->endOfMonth(),
                ];
        }
    }
    
    private function calcularVentas($inicio, $fin)
    {
        return FacturaVenta::whereBetween('fecha_emision', [$inicio, $fin])
            ->where('estado', '!=', 'Anulada')
            ->sum('total');
    }
    
    private function calcularGastos($inicio, $fin)
    {
        return FacturaCompra::whereBetween('fecha_emision', [$inicio, $fin])
            ->where('estado', '!=', 'Anulada')
            ->sum('total');
    }
    
    private function calcularCuentasPorCobrar()
    {
        return FacturaVenta::where('saldo_pendiente', '>', 0)
            ->sum('saldo_pendiente');
    }
    
    private function generarGraficaTendencia($periodo, $fechaInicio, $fechaFin)
    {
        $datos = [];
        
        switch ($periodo) {
            case 'dia':
                // Últimas 24 horas por hora
                for ($i = 23; $i >= 0; $i--) {
                    $hora = Carbon::now()->subHours($i);
                    $horaInicio = $hora->copy()->startOfHour();
                    $horaFin = $hora->copy()->endOfHour();
                    
                    $datos[] = [
                        'mes' => $hora->format('H:i'),
                        'ventas' => $this->calcularVentas($horaInicio, $horaFin),
                        'gastos' => $this->calcularGastos($horaInicio, $horaFin),
                    ];
                }
                break;
            
            case 'mes':
                // Últimos 30 días
                for ($i = 29; $i >= 0; $i--) {
                    $dia = Carbon::now()->subDays($i);
                    $diaInicio = $dia->copy()->startOfDay();
                    $diaFin = $dia->copy()->endOfDay();
                    
                    $datos[] = [
                        'mes' => $dia->format('d M'),
                        'ventas' => $this->calcularVentas($diaInicio, $diaFin),
                        'gastos' => $this->calcularGastos($diaInicio, $diaFin),
                    ];
                }
                break;
            
            case 'trimestre':
                // Últimos 3 meses
                for ($i = 2; $i >= 0; $i--) {
                    $mes = Carbon::now()->subMonths($i);
                    $mesInicio = $mes->copy()->startOfMonth();
                    $mesFin = $mes->copy()->endOfMonth();
                    
                    $datos[] = [
                        'mes' => $mes->format('M Y'),
                        'ventas' => $this->calcularVentas($mesInicio, $mesFin),
                        'gastos' => $this->calcularGastos($mesInicio, $mesFin),
                    ];
                }
                break;
            
            case 'semestre':
                // Últimos 6 meses
                for ($i = 5; $i >= 0; $i--) {
                    $mes = Carbon::now()->subMonths($i);
                    $mesInicio = $mes->copy()->startOfMonth();
                    $mesFin = $mes->copy()->endOfMonth();
                    
                    $datos[] = [
                        'mes' => $mes->format('M Y'),
                        'ventas' => $this->calcularVentas($mesInicio, $mesFin),
                        'gastos' => $this->calcularGastos($mesInicio, $mesFin),
                    ];
                }
                break;
            
            case 'anual':
                // Últimos 12 meses
                for ($i = 11; $i >= 0; $i--) {
                    $mes = Carbon::now()->subMonths($i);
                    $mesInicio = $mes->copy()->startOfMonth();
                    $mesFin = $mes->copy()->endOfMonth();
                    
                    $datos[] = [
                        'mes' => $mes->format('M Y'),
                        'ventas' => $this->calcularVentas($mesInicio, $mesFin),
                        'gastos' => $this->calcularGastos($mesInicio, $mesFin),
                    ];
                }
                break;
            
            case 'historico':
                // Por año desde el inicio
                $anioInicio = 2020;
                $anioFin = Carbon::now()->year;
                
                for ($anio = $anioInicio; $anio <= $anioFin; $anio++) {
                    $inicio = Carbon::create($anio, 1, 1)->startOfYear();
                    $fin = Carbon::create($anio, 12, 31)->endOfYear();
                    
                    $datos[] = [
                        'mes' => (string)$anio,
                        'ventas' => $this->calcularVentas($inicio, $fin),
                        'gastos' => $this->calcularGastos($inicio, $fin),
                    ];
                }
                break;
            
            default:
                // Por defecto últimos 6 meses
                for ($i = 5; $i >= 0; $i--) {
                    $mes = Carbon::now()->subMonths($i);
                    $mesInicio = $mes->copy()->startOfMonth();
                    $mesFin = $mes->copy()->endOfMonth();
                    
                    $datos[] = [
                        'mes' => $mes->format('M Y'),
                        'ventas' => $this->calcularVentas($mesInicio, $mesFin),
                        'gastos' => $this->calcularGastos($mesInicio, $mesFin),
                    ];
                }
        }
        
        return $datos;
    }
    
    private function ventasPorCliente($inicio, $fin)
    {
        return DB::table('facturas_venta as fv')
            ->join('contactos as c', 'fv.contacto_id', '=', 'c.id')
            ->whereBetween('fv.fecha_emision', [$inicio, $fin])
            ->where('fv.estado', '!=', 'Anulada')
            ->select(
                'c.razon_social as nombre',
                DB::raw('SUM(fv.total) as total'),
                DB::raw('COUNT(fv.id) as ordenes')
            )
            ->groupBy('c.id', 'c.razon_social')
            ->orderByDesc('total')
            ->limit(10)
            ->get();
    }
    
    private function ventasPorProducto($inicio, $fin)
    {
        return DB::table('factura_venta_detalles as fvd')
            ->join('facturas_venta as fv', 'fvd.factura_venta_id', '=', 'fv.id')
            ->join('items as i', 'fvd.item_id', '=', 'i.id')
            ->whereBetween('fv.fecha_emision', [$inicio, $fin])
            ->where('fv.estado', '!=', 'Anulada')
            ->select(
                'i.nombre',
                DB::raw('SUM(fvd.cantidad) as cantidad'),
                DB::raw('SUM(fvd.total_item) as total')
            )
            ->groupBy('i.id', 'i.nombre')
            ->orderByDesc('total')
            ->limit(10)
            ->get();
    }
    
    private function rentabilidadPorCliente($inicio, $fin)
    {
        return DB::table('facturas_venta as fv')
            ->join('contactos as c', 'fv.contacto_id', '=', 'c.id')
            ->join('factura_venta_detalles as fvd', 'fv.id', '=', 'fvd.factura_venta_id')
            ->join('items as i', 'fvd.item_id', '=', 'i.id')
            ->whereBetween('fv.fecha_emision', [$inicio, $fin])
            ->where('fv.estado', '!=', 'Anulada')
            ->select(
                'c.razon_social as nombre',
                DB::raw('SUM(fvd.total_item) as ventas'),
                DB::raw('SUM(fvd.cantidad * COALESCE(i.costo_promedio, 0)) as costo'),
                DB::raw('SUM(fvd.total_item) - SUM(fvd.cantidad * COALESCE(i.costo_promedio, 0)) as utilidad'),
                DB::raw('ROUND(CASE WHEN SUM(fvd.total_item) > 0 THEN ((SUM(fvd.total_item) - SUM(fvd.cantidad * COALESCE(i.costo_promedio, 0))) / SUM(fvd.total_item)) * 100 ELSE 0 END, 2) as margen')
            )
            ->groupBy('c.id', 'c.razon_social')
            ->orderByDesc('utilidad')
            ->limit(10)
            ->get();
    }
    
    private function rentabilidadPorProducto($inicio, $fin)
    {
        return DB::table('factura_venta_detalles as fvd')
            ->join('facturas_venta as fv', 'fvd.factura_venta_id', '=', 'fv.id')
            ->join('items as i', 'fvd.item_id', '=', 'i.id')
            ->whereBetween('fv.fecha_emision', [$inicio, $fin])
            ->where('fv.estado', '!=', 'Anulada')
            ->select(
                'i.nombre',
                DB::raw('SUM(fvd.total_item) as ventas'),
                DB::raw('SUM(fvd.cantidad * COALESCE(i.costo_promedio, 0)) as costo'),
                DB::raw('SUM(fvd.total_item) - SUM(fvd.cantidad * COALESCE(i.costo_promedio, 0)) as utilidad'),
                DB::raw('ROUND(CASE WHEN SUM(fvd.total_item) > 0 THEN ((SUM(fvd.total_item) - SUM(fvd.cantidad * COALESCE(i.costo_promedio, 0))) / SUM(fvd.total_item)) * 100 ELSE 0 END, 2) as margen')
            )
            ->groupBy('i.id', 'i.nombre')
            ->orderByDesc('utilidad')
            ->limit(10)
            ->get();
    }
    
    private function ventasPorVendedor($inicio, $fin)
    {
        return DB::table('facturas_venta as fv')
            ->join('vendedores as v', 'fv.vendedor_id', '=', 'v.id')
            ->whereBetween('fv.fecha_emision', [$inicio, $fin])
            ->where('fv.estado', '!=', 'Anulada')
            ->select(
                'v.nombre_completo as nombre',
                DB::raw('SUM(fv.total) as total'),
                DB::raw('COUNT(fv.id) as ordenes'),
                DB::raw('AVG(fv.total) as promedio')
            )
            ->groupBy('v.id', 'v.nombre_completo')
            ->orderByDesc('total')
            ->limit(10)
            ->get();
    }
    
    private function saldosClientes()
    {
        return DB::table('facturas_venta as fv')
            ->join('contactos as c', 'fv.contacto_id', '=', 'c.id')
            ->where('fv.saldo_pendiente', '>', 0)
            ->where('c.es_cliente', true)
            ->select(
                'c.razon_social as nombre',
                DB::raw('SUM(fv.saldo_pendiente) as saldo'),
                DB::raw('SUM(CASE WHEN fv.fecha_vencimiento < NOW() THEN 1 ELSE 0 END) as vencido'),
                DB::raw('ROUND(AVG(DATEDIFF(NOW(), fv.fecha_emision)), 0) as dias_promedio')
            )
            ->groupBy('c.id', 'c.razon_social')
            ->orderByDesc('saldo')
            ->limit(10)
            ->get();
    }
    
    private function saldosProveedores()
    {
        return DB::table('facturas_compra as fc')
            ->join('contactos as p', 'fc.contacto_id', '=', 'p.id')
            ->where('fc.saldo_pendiente', '>', 0)
            ->where('p.es_proveedor', true)
            ->select(
                'p.razon_social as nombre',
                DB::raw('SUM(fc.saldo_pendiente) as saldo'),
                DB::raw('SUM(CASE WHEN fc.fecha_vencimiento < NOW() THEN 1 ELSE 0 END) as vencido'),
                DB::raw('ROUND(AVG(DATEDIFF(NOW(), fc.fecha_emision)), 0) as dias_promedio')
            )
            ->groupBy('p.id', 'p.razon_social')
            ->orderByDesc('saldo')
            ->limit(10)
            ->get();
    }
}