<?php

namespace App\Http\Controllers\RRHH;

use App\Http\Controllers\Controller;
use App\Models\Nomina;
use App\Models\NominaDetalle;
use App\Models\NominaConcepto;
use App\Models\Empleado;
use App\Models\TenantConfig;
use App\Services\AccountingService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class NominaController extends Controller
{
    /**
     * Muestra el historial de nóminas procesadas
     */
    public function index()
    {
        return Inertia::render('RRHH/Nomina/Index', [
            'nominas' => Nomina::latest()->paginate(10)
        ]);
    }

    /**
     * Motor de procesamiento de planilla quincenal con integración contable
     */
    public function procesar(Request $request)
    {
        $validated = $request->validate([
            'periodo_nombre' => 'required|string|max:100',
            'fecha_inicio' => 'required|date',
            'fecha_fin' => 'required|date',
        ]);

        return DB::transaction(function () use ($validated) {
            $config = TenantConfig::first();
            
            // 1. Crear cabecera
            $nomina = Nomina::create(array_merge($validated, ['estado' => 'Borrador']));
            
            $empleados = Empleado::where('activo', true)->get();
            $conceptosLey = NominaConcepto::where('activo', true)->where('origen', 'Ley')->get();

            foreach ($empleados as $empleado) {
                $salarioPeriodo = $empleado->salario_base / 2; 
                $deducciones = 0;
                $decimo = 0;
                $vacaciones = 0;

                if ($empleado->tipo_contrato !== 'Servicios Profesionales') {
                    // --- CÁLCULO PLANILLA REGULAR ---
                    $cSocialEducativo = $conceptosLey->whereIn('codigo', ['SS-EMP', 'SE-EMP']);
                    
                    foreach ($cSocialEducativo as $c) {
                        $deducciones += ($salarioPeriodo * ($c->porcentaje_empleado / 100));
                    }

                    // Provisiones (Pasivos acumulados)
                    $decimo = $salarioPeriodo / 12;
                    $vacaciones = $salarioPeriodo / 11;
                    
                } else {
                    // --- CÁLCULO SERVICIOS PROFESIONALES ---
                    $cISR = $conceptosLey->where('codigo', 'ISR-SP')->first();
                    $tasa = $cISR ? ($cISR->porcentaje_empleado / 100) : 0.10;
                    $deducciones = ($salarioPeriodo * $tasa);
                }

                NominaDetalle::create([
                    'nomina_id' => $nomina->id,
                    'empleado_id' => $empleado->id,
                    'salario_bruto' => $salarioPeriodo,
                    'total_deducciones' => $deducciones,
                    'neto_pagar' => $salarioPeriodo - $deducciones,
                    'decimo_tercer_mes_proporcional' => $decimo,
                    'vacaciones_proporcionales' => $vacaciones,
                ]);
            }

            // 2. Consolidar totales de la nómina
            $totalBruto = $nomina->detalles()->sum('salario_bruto');
            $totalDeducciones = $nomina->detalles()->sum('total_deducciones');
            $totalNeto = $nomina->detalles()->sum('neto_pagar');

            $nomina->update([
                'total_ingresos' => $totalBruto,
                'total_deducciones' => $totalDeducciones,
                'total_neto' => $totalNeto,
                'estado' => 'Procesada'
            ]);

            // 3. Generar Asiento Contable de Nómina
            // Débito: Gasto de Salarios (El costo total para la empresa)
            // Crédito: Retenciones por Pagar (Lo que le quitamos al empleado y debemos al estado)
            // Crédito: Salarios por Pagar / Bancos (Lo que efectivamente sale de caja)
            AccountingService::registrarAsiento(
                $validated['fecha_fin'],
                "NOM-{$nomina->id}",
                "Cierre de Planilla: {$validated['periodo_nombre']}",
                [
                    [
                        'account_id' => $config->cta_gasto_salario_id,
                        'debito'     => $totalBruto,
                        'credito'    => 0
                    ],
                    [
                        'account_id' => $config->cta_retenciones_id, // Pasivo: SS, SE e ISR retenido
                        'debito'     => 0,
                        'credito'    => $totalDeducciones
                    ],
                    [
                        'account_id' => $config->cta_caja_banco_id, // Sale el dinero neto
                        'debito'     => 0,
                        'credito'    => $totalNeto
                    ],
                ]
            );

            return redirect()->route('rrhh.nomina.index')->with('success', 'Nómina procesada y contabilizada con éxito.');
        });
    }
}