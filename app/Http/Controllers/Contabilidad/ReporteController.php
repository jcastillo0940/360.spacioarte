<?php

namespace App\Http\Controllers\Contabilidad;

use App\Http\Controllers\Controller;
use App\Models\AsientoDetalle;
use App\Models\Account; // Tu catálogo de cuentas
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;

class ReporteController extends Controller
{
    /**
     * Estado de Resultados (Pérdidas y Ganancias)
     */
    public function estadoResultados(Request $request)
    {
        $fechaInicio = $request->fecha_inicio ?? now()->startOfYear();
        $fechaFin = $request->fecha_fin ?? now()->endOfYear();

        // Obtenemos los saldos agrupados por tipo de cuenta (4:Ingresos, 5:Costos, 6:Gastos)
        $saldos = AsientoDetalle::whereHas('asiento', function($q) use ($fechaInicio, $fechaFin) {
                $q->whereBetween('fecha', [$fechaInicio, $fechaFin]);
            })
            ->join('accounts', 'asiento_detalles.account_id', '=', 'accounts.id')
            ->select('accounts.tipo', 'accounts.nombre', DB::raw('SUM(debito - credito) as saldo'))
            ->groupBy('accounts.tipo', 'accounts.nombre')
            ->get();

        $ingresos = $saldos->where('tipo', 'Ingreso')->sum('saldo') * -1; // Saldo acreedor
        $costos = $saldos->where('tipo', 'Costo')->sum('saldo');
        $gastos = $saldos->where('tipo', 'Gasto')->sum('saldo');

        return Inertia::render('Contabilidad/Reportes/EstadoResultados', [
            'data' => [
                'ingresos' => $ingresos,
                'costos' => $costos,
                'gastos' => $gastos,
                'utilidad_bruta' => $ingresos - $costos,
                'utilidad_neta' => $ingresos - $costos - $gastos,
            ],
            'filtros' => ['inicio' => $fechaInicio, 'fin' => $fechaFin]
        ]);
    }
}