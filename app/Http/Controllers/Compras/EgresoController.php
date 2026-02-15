<?php

namespace App\Http\Controllers\Compras;

use App\Http\Controllers\Controller;
use App\Models\Egreso;
use App\Models\FacturaCompra;
use App\Models\BankAccount;
use App\Models\BankTransaction;
use App\Models\TenantConfig;
use App\Services\AccountingService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class EgresoController extends Controller
{
    /**
     * Lista de egresos para la interfaz de React
     */
    public function index()
    {
        return Inertia::render('Compras/Egresos/Index', [
            'egresos' => Egreso::with(['facturaCompra.proveedor', 'bankAccount'])->latest()->paginate(15)
        ]);
    }

    /**
     * Registra un pago a proveedor (Cuentas por Pagar) e integra contabilidad
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'factura_compra_id' => 'required|exists:facturas_compra,id',
            'bank_account_id'   => 'required|exists:bank_accounts,id',
            'monto_pagado'      => 'required|numeric|min:0.01',
            'fecha_pago'        => 'required|date',
            'metodo_pago'       => 'required|string',
            'referencia'        => 'nullable|string',
        ]);

        return DB::transaction(function () use ($validated) {
            $config = TenantConfig::first();
            
            // Bloqueamos la factura y el banco para evitar inconsistencias
            $factura = FacturaCompra::with('proveedor')->lockForUpdate()->findOrFail($validated['factura_compra_id']);
            $banco = BankAccount::lockForUpdate()->findOrFail($validated['bank_account_id']);

            // Validar que no se pague más de la deuda
            if ($validated['monto_pagado'] > $factura->saldo_pendiente) {
                return back()->withErrors([
                    'monto_pagado' => "El monto excede la deuda pendiente ($" . $factura->saldo_pendiente . ")"
                ]);
            }

            // 1. Crear el Comprobante de Egreso
            $egreso = Egreso::create([
                'numero_egreso'     => 'CE-' . str_pad(time(), 8, '0', STR_PAD_LEFT),
                'factura_compra_id' => $factura->id,
                'bank_account_id'   => $validated['bank_account_id'],
                'fecha_pago'        => $validated['fecha_pago'],
                'monto_pagado'      => $validated['monto_pagado'],
                'metodo_pago'       => $validated['metodo_pago'],
                'referencia'        => $validated['referencia'],
            ]);

            // 2. Afectar el Banco (Transacción + Reducción de Saldo Actual)
            BankTransaction::create([
                'bank_account_id' => $validated['bank_account_id'],
                'tipo'            => 'Egreso',
                'monto'           => $validated['monto_pagado'],
                'fecha'           => $validated['fecha_pago'],
                'descripcion'     => "Pago a proveedor. Factura: " . $factura->numero_factura_proveedor,
                'referencia'      => $validated['referencia'],
            ]);

            $banco->decrement('saldo_actual', $validated['monto_pagado']);

            // 3. Generar Asiento Contable Automático
            // Débito: Cuentas por Pagar (Disminuye Pasivo)
            // Crédito: Bancos (Disminuye Activo)
            AccountingService::registrarAsiento(
                $validated['fecha_pago'],
                $egreso->numero_egreso,
                "Pago a proveedor: " . $factura->proveedor->razon_social . " - Factura: " . $factura->numero_factura_proveedor,
                [
                    [
                        'account_id' => $config->cta_cxp_id, // Cuenta de Pasivo configurada
                        'debito'     => $validated['monto_pagado'],
                        'credito'    => 0
                    ],
                    [
                        'account_id' => $banco->account_id, // Cuenta de Activo vinculada al banco
                        'debito'     => 0,
                        'credito'    => $validated['monto_pagado']
                    ],
                ]
            );

            // 4. Actualizar saldo de la factura de compra
            $factura->decrement('saldo_pendiente', $validated['monto_pagado']);
            
            if ($factura->saldo_pendiente <= 0) {
                $factura->update(['estado' => 'Pagada']);
            }

            return redirect()->back()->with('success', 'Egreso registrado, saldos actualizados y asiento contable generado.');
        });
        
    }
    public function getDatos()
{
    return response()->json([
        'facturas' => FacturaCompra::with('proveedor')
            ->where('saldo_pendiente', '>', 0)
            ->where('estado', '!=', 'Anulada')
            ->get(),
        'bancos' => BankAccount::all()
    ]);
}
}