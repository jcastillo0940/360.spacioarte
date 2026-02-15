<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\{
    OperacionFactoring, 
    ReciboPago, 
    Egreso, 
    BankTransaction,
    FacturaCompra,
    FacturaVenta
};
use Illuminate\Support\Facades\DB;

class FixFactoringRecords extends Command
{
    protected $signature = 'finance:fix-factoring';
    protected $description = 'Genera pagos y transacciones bancarias faltantes para factorings antiguos';

    public function handle()
    {
        $this->info('Iniciando reparación de historial de Factoring...');

        $operaciones = OperacionFactoring::with(['detalles', 'cuentaBancaria'])
            ->where('estado', 'Activa')
            ->get();

        $bar = $this->output->createProgressBar(count($operaciones));

        foreach ($operaciones as $op) {
            DB::transaction(function () use ($op) {
                // 1. REPARAR TRANSACCIÓN BANCARIA
                // Verificamos si ya existe una transacción para esta operación
                $existeTransaccion = BankTransaction::where('referencia', $op->numero_operacion)
                    ->where('bank_account_id', $op->bank_account_id)
                    ->exists();

                if (!$existeTransaccion) {
                    BankTransaction::create([
                        'bank_account_id' => $op->bank_account_id,
                        'tipo' => $op->tipo === 'compra' ? 'Egreso' : 'Ingreso',
                        'monto' => $op->monto_neto,
                        'fecha' => $op->fecha_operacion,
                        'referencia' => $op->numero_operacion,
                        'descripcion' => "FIX: Factoring " . $op->entidad_financiera,
                        'categoria_contable' => 'Factoring',
                        'conciliado' => false
                    ]);
                    // Nota: Al crear BankTransaction, tu modelo actualiza el saldo automáticamente.
                }

                // 2. REPARAR PAGOS (Estado de Cuenta)
                foreach ($op->detalles as $detalle) {
                    
                    // --- CASO COMPRA (EGRESOS) ---
                    if ($op->tipo === 'compra' && $detalle->factura_compra_id) {
                        // Verificar si existe el Egreso
                        $existeEgreso = Egreso::where('factura_compra_id', $detalle->factura_compra_id)
                            ->where('referencia', $op->numero_operacion)
                            ->exists();

                        if (!$existeEgreso) {
                            $factura = FacturaCompra::find($detalle->factura_compra_id);
                            if ($factura) {
                                // Calculamos monto: Si la factura dice 0 saldo, asumimos que se pagó completa por factoring
                                // O usamos el total si no tenemos el historial exacto del momento.
                                // Para seguridad, usamos el total de la factura si el saldo es 0.
                                $monto = $factura->saldo_pendiente == 0 ? $factura->total : $factura->total - $factura->saldo_pendiente;

                                Egreso::create([
                                    'numero_egreso' => 'EG-FIX-' . $op->id . '-' . $factura->id,
                                    'factura_compra_id' => $factura->id,
                                    'bank_account_id' => $op->bank_account_id,
                                    'fecha_pago' => $op->fecha_operacion,
                                    'monto_pagado' => $monto,
                                    'metodo_pago' => 'Factoring',
                                    'referencia' => $op->numero_operacion,
                                    'notas' => "Corrección automática historial Factoring"
                                ]);
                                
                                // Asegurar que la factura esté marcada como pagada
                                if ($factura->saldo_pendiente > 0 || $factura->estado != 'Pagada') {
                                    $factura->update(['estado' => 'Pagada', 'saldo_pendiente' => 0]);
                                }
                            }
                        }
                    }

                    // --- CASO VENTA (RECIBOS) ---
                    if ($op->tipo === 'venta' && $detalle->factura_venta_id) {
                        // Verificar si existe el Recibo
                        $existeRecibo = ReciboPago::where('factura_venta_id', $detalle->factura_venta_id)
                            ->where('referencia', $op->numero_operacion)
                            ->exists();

                        if (!$existeRecibo) {
                            $factura = FacturaVenta::find($detalle->factura_venta_id);
                            if ($factura) {
                                $monto = $factura->saldo_pendiente == 0 ? $factura->total : $factura->total - $factura->saldo_pendiente;

                                ReciboPago::create([
                                    'numero_recibo' => 'RC-FIX-' . $op->id . '-' . $factura->id,
                                    'factura_venta_id' => $factura->id,
                                    'bank_account_id' => $op->bank_account_id,
                                    'fecha_pago' => $op->fecha_operacion,
                                    'monto_pagado' => $monto,
                                    'metodo_pago' => 'Factoring',
                                    'referencia' => $op->numero_operacion,
                                    'notas' => "Corrección automática historial Factoring"
                                ]);

                                // Asegurar que la factura esté marcada como pagada
                                if ($factura->saldo_pendiente > 0 || $factura->estado != 'Pagada') {
                                    $factura->update(['estado' => 'Pagada', 'saldo_pendiente' => 0]);
                                }
                            }
                        }
                    }
                }
            });

            $bar->advance();
        }

        $bar->finish();
        $this->newLine();
        $this->info('¡Reparación completada! Verifica los saldos bancarios y estados de cuenta.');
    }
}