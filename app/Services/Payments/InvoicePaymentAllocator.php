<?php

namespace App\Services\Payments;

use App\Models\BankAccount;
use App\Models\BankTransaction;
use App\Models\FacturaVenta;
use App\Models\PosSesion;
use App\Models\ReciboPago;
use App\Models\TenantConfig;
use App\Services\AccountingService;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use RuntimeException;

class InvoicePaymentAllocator
{
    private function money($value): float
    {
        return round((float) $value, 2);
    }

    public function apply(array $payload): array
    {
        return DB::transaction(function () use ($payload) {
            $contactoId = (int) $payload['contacto_id'];
            $bankAccountId = (int) $payload['bank_account_id'];
            $montoTotal = $this->money($payload['monto_total']);
            $fechaPago = $payload['fecha_pago'];
            $metodoPago = $payload['metodo_pago'];
            $referencia = $payload['referencia'] ?? null;
            $notas = $payload['notas'] ?? null;
            $posSesionId = $payload['pos_sesion_id'] ?? null;
            $facturaIds = collect($payload['facturas_ids'] ?? [])->filter()->map(fn ($id) => (int) $id)->all();

            if ($montoTotal <= 0) {
                throw new RuntimeException('El monto a aplicar debe ser mayor que cero.');
            }

            $banco = BankAccount::lockForUpdate()->findOrFail($bankAccountId);
            $config = TenantConfig::first();

            $facturas = FacturaVenta::query()
                ->where('contacto_id', $contactoId)
                ->where('saldo_pendiente', '>', 0)
                ->whereNotIn('estado', ['Anulada', 'Cancelada'])
                ->when(!empty($facturaIds), fn ($query) => $query->whereIn('id', $facturaIds))
                ->orderBy('fecha_emision')
                ->orderBy('id')
                ->lockForUpdate()
                ->get();

            if ($facturas->isEmpty()) {
                throw new RuntimeException('El cliente no tiene facturas pendientes para aplicar el pago.');
            }

            $pendienteTotal = $this->money($facturas->sum('saldo_pendiente'));
            if ($montoTotal > $pendienteTotal + 0.01) {
                throw new RuntimeException("El monto excede el saldo pendiente del cliente ($pendienteTotal).");
            }

            $numeroRecibo = $this->generateReciboNumber();
            $batchUuid = (string) Str::uuid();
            $montoRestante = $montoTotal;
            $ordenAplicacion = 1;
            $aplicaciones = [];

            foreach ($facturas as $factura) {
                if ($montoRestante <= 0) {
                    break;
                }

                $saldoFactura = $this->money($factura->saldo_pendiente);
                if ($saldoFactura <= 0) {
                    continue;
                }

                $montoAplicado = min($montoRestante, $saldoFactura);

                ReciboPago::create([
                    'numero_recibo' => $numeroRecibo,
                    'payment_batch_uuid' => $batchUuid,
                    'orden_aplicacion' => $ordenAplicacion,
                    'factura_venta_id' => $factura->id,
                    'bank_account_id' => $bankAccountId,
                    'pos_sesion_id' => $posSesionId,
                    'fecha_pago' => $fechaPago,
                    'monto_pagado' => $montoAplicado,
                    'metodo_pago' => $metodoPago,
                    'referencia' => $referencia,
                    'notas' => $notas,
                ]);

                $nuevoSaldo = $this->money($saldoFactura - $montoAplicado);
                $factura->update([
                    'saldo_pendiente' => $nuevoSaldo,
                    'estado' => $nuevoSaldo <= 0.01 ? 'Pagada' : 'Abierta',
                ]);

                $aplicaciones[] = [
                    'factura_id' => $factura->id,
                    'numero_factura' => $factura->numero_factura,
                    'monto_aplicado' => $this->money($montoAplicado),
                    'saldo_restante' => $this->money(max($nuevoSaldo, 0)),
                ];

                $montoRestante = $this->money($montoRestante - $montoAplicado);
                $ordenAplicacion++;
            }

            if ($montoRestante > 0.01) {
                throw new RuntimeException('No se pudo distribuir completamente el pago entre las facturas seleccionadas.');
            }

            BankTransaction::create([
                'bank_account_id' => $bankAccountId,
                'tipo' => 'Ingreso',
                'monto' => $montoTotal,
                'fecha' => $fechaPago,
                'descripcion' => 'Cobro facturas ' . collect($aplicaciones)->pluck('numero_factura')->implode(', '),
                'referencia' => $referencia,
            ]);

            $banco->increment('saldo_actual', $montoTotal);

            if ($config?->cta_cxc_id && $banco->account_id) {
                AccountingService::registrarAsiento(
                    $fechaPago,
                    $numeroRecibo,
                    'Cobro de facturas por FIFO',
                    [
                        ['account_id' => $banco->account_id, 'debito' => $montoTotal, 'credito' => 0],
                        ['account_id' => $config->cta_cxc_id, 'debito' => 0, 'credito' => $montoTotal],
                    ]
                );
            }

            if ($posSesionId) {
                $sesion = PosSesion::find($posSesionId);
                if ($sesion && $metodoPago === 'Efectivo') {
                    $sesion->movimientos()->create([
                        'tipo' => 'Venta',
                        'monto' => $montoTotal,
                        'metodo_pago' => 'Efectivo',
                        'concepto' => 'Cobro FIFO ' . $numeroRecibo,
                        'user_id' => auth()->id(),
                    ]);
                }
            }

            return [
                'numero_recibo' => $numeroRecibo,
                'payment_batch_uuid' => $batchUuid,
                'monto_total' => $this->money($montoTotal),
                'aplicaciones' => $aplicaciones,
            ];
        });
    }

    public function getPendingInvoicesForContact(int $contactoId): Collection
    {
        return FacturaVenta::query()
            ->with('cliente')
            ->where('contacto_id', $contactoId)
            ->where('saldo_pendiente', '>', 0)
            ->whereNotIn('estado', ['Anulada', 'Cancelada'])
            ->orderBy('fecha_emision')
            ->orderBy('id')
            ->get();
    }

    private function generateReciboNumber(): string
    {
        $last = ReciboPago::latest('id')->first();
        $number = $last ? (int) preg_replace('/[^0-9]/', '', (string) $last->numero_recibo) + 1 : 1;

        return 'RC-' . str_pad((string) $number, 6, '0', STR_PAD_LEFT);
    }
}
