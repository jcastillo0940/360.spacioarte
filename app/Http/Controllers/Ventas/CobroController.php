<?php

namespace App\Http\Controllers\Ventas;

use App\Http\Controllers\Controller;
use App\Models\ReciboPago;
use App\Models\FacturaVenta;
use App\Models\BankAccount;
use App\Models\BankTransaction;
use App\Models\TenantConfig;
use App\Services\AccountingService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class CobroController extends Controller
{
    /**
     * Carga la vista de creación con facturas pendientes y bancos.
     * Inyecta los datos directamente para evitar estados de carga vacíos en Inertia.
     */
    public function create()
    {
        return Inertia::render('Ventas/Cobros/Create', [
            'facturas' => FacturaVenta::with('cliente')
                ->where('saldo_pendiente', '>', 0)
                ->where('estado', '!=', 'Anulada')
                ->get(),
            'bancos' => BankAccount::all()
        ]);
    }

    /**
     * Registra un pago múltiple y afecta facturas, bancos y contabilidad simultáneamente.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'facturas_ids'    => 'required|array|min:1',
            'facturas_ids.*'  => 'exists:facturas_venta,id',
            'bank_account_id' => 'required|exists:bank_accounts,id',
            'monto_total'     => 'required|numeric|min:0.01',
            'fecha_pago'      => 'required|date',
            'metodo_pago'     => 'required|in:Efectivo,Cheque,Transferencia,Tarjeta,Otros',
            'referencia'      => 'nullable|string',
        ]);

        return DB::transaction(function () use ($validated) {
            $config = TenantConfig::first();
            
            // Bloquear la cuenta bancaria para actualizar el saldo de forma segura
            $banco = BankAccount::lockForUpdate()->findOrFail($validated['bank_account_id']);
            
            // Obtener y bloquear las facturas involucradas para evitar colisiones de pagos
            $facturas = FacturaVenta::whereIn('id', $validated['facturas_ids'])
                ->lockForUpdate()
                ->get();

            // Validar que el monto total enviado coincida con la suma de los saldos pendientes
            $sumaPendiente = $facturas->sum('saldo_pendiente');
            
            // Si permites pagos parciales en lote, aquí deberías ajustar la lógica. 
            // Por defecto, asumo que se liquidan las facturas seleccionadas.
            if (abs($validated['monto_total'] - $sumaPendiente) > 0.01) {
                return back()->withErrors([
                    'monto_total' => "El monto total ($" . $validated['monto_total'] . ") no coincide con la suma de las facturas seleccionadas ($" . $sumaPendiente . ")"
                ]);
            }

            $numeroRecibo = $this->generateReciboNumber();
            $descripcionOperacion = "Cobro múltiple: " . $facturas->pluck('numero_factura')->implode(', ');

            // 1. Procesar cada factura individualmente (Recibo + Actualización de Saldo)
            foreach ($facturas as $factura) {
                ReciboPago::create([
                    'numero_recibo'    => $numeroRecibo,
                    'factura_venta_id' => $factura->id,
                    'bank_account_id'  => $validated['bank_account_id'],
                    'fecha_pago'       => $validated['fecha_pago'],
                    'monto_pagado'     => $factura->saldo_pendiente,
                    'metodo_pago'      => $validated['metodo_pago'],
                    'referencia'       => $validated['referencia'],
                ]);

                $factura->update([
                    'saldo_pendiente' => 0,
                    'estado'          => 'Pagada'
                ]);
            }

            // 2. Afectar el Banco (Una sola transacción por el total depositado)
            BankTransaction::create([
                'bank_account_id' => $validated['bank_account_id'],
                'tipo'            => 'Ingreso',
                'monto'           => $validated['monto_total'],
                'fecha'           => $validated['fecha_pago'],
                'descripcion'     => $descripcionOperacion,
                'referencia'      => $validated['referencia'],
            ]);
            
            $banco->increment('saldo_actual', $validated['monto_total']);

            // 3. Generar Asiento Contable Automático (Consolidado)
            AccountingService::registrarAsiento(
                $validated['fecha_pago'],
                $numeroRecibo,
                "Cobro múltiple - Ref: " . ($validated['referencia'] ?? 'N/A'),
                [
                    // Entrada de dinero al Banco (Débito)
                    [
                        'account_id' => $banco->account_id, 
                        'debito'     => $validated['monto_total'], 
                        'credito'    => 0
                    ],
                    // Disminución de la Cuenta por Cobrar Cliente (Crédito)
                    [
                        'account_id' => $config->cta_cxc_id, 
                        'debito'     => 0, 
                        'credito'    => $validated['monto_total']
                    ],
                ]
            );

            return redirect()->route('facturas.index')->with('success', 'Cobro registrado y contabilidad actualizada correctamente.');
        });
    }

    /**
     * Genera el correlativo de recibos de pago con prefijo RC.
     */
    private function generateReciboNumber()
    {
        $last = ReciboPago::latest()->first();
        $number = $last ? (int) preg_replace('/[^0-9]/', '', $last->numero_recibo) + 1 : 1;
        return 'RC-' . str_pad($number, 6, '0', STR_PAD_LEFT);
    }

    /**
     * Endpoint para cargar datos frescos vía AJAX/Fetch si el usuario 
     * permanece mucho tiempo en la vista sin recargar.
     */
    public function getDatos()
    {
        return response()->json([
            'facturas' => FacturaVenta::with('cliente')
                ->where('saldo_pendiente', '>', 0)
                ->where('estado', '!=', 'Anulada')
                ->get(),
            'bancos' => BankAccount::all()
        ]);
    }
}