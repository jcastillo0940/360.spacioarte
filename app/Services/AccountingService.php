<?php

namespace App\Services;

use App\Models\Asiento;
use App\Models\AsientoDetalle;
use Illuminate\Support\Facades\DB;

class AccountingService
{
    /**
     * Registra un asiento contable cuadrado
     * @param string $fecha, $referencia, $concepto
     * @param array $lineas [ ['account_id' => 1, 'debito' => 100, 'credito' => 0], ... ]
     */
    public static function registrarAsiento($fecha, $referencia, $concepto, array $lineas)
    {
        return DB::transaction(function () use ($fecha, $referencia, $concepto, $lineas) {
            // Usamos round para evitar problemas de precisión de punto flotante en PHP
            $totalDebito = round(collect($lineas)->sum('debito'), 2);
            $totalCredito = round(collect($lineas)->sum('credito'), 2);

            // Validación Partida Doble
            if (abs($totalDebito - $totalCredito) > 0.01) {
                throw new \Exception("El asiento contable no está cuadrado. Débito: $totalDebito, Crédito: $totalCredito. Diferencia: " . ($totalDebito - $totalCredito));
            }

            $asiento = Asiento::create([
                'fecha' => $fecha,
                'referencia' => $referencia,
                'concepto' => $concepto,
                'total_debito' => $totalDebito,
                'total_credito' => $totalCredito,
            ]);

            foreach ($lineas as $linea) {
                // Si el account_id llega nulo por error de configuración, fallará aquí con una excepción clara
                $asiento->detalles()->create([
                    'account_id' => $linea['account_id'],
                    'debito' => round($linea['debito'], 2),
                    'credito' => round($linea['credito'], 2),
                ]);
            }

            return $asiento;
        });
    }
}