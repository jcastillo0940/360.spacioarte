<?php
namespace App\Http\Controllers\Contabilidad;

use App\Http\Controllers\Controller;
use App\Models\BankAccount;
use App\Models\BankTransaction;
use App\Models\Account;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class BankController extends Controller
{
    /**
     * Lista todas las cuentas con su cuenta contable asociada para la UI de React
     */
    public function index()
    {
        $bancos = BankAccount::with('accountContable')->latest()->get();
        $accounts = Account::where('tipo', 'Activo')->get();
        
        // Si es una petición API, devolver JSON
        if (request()->is('api/*') || request()->wantsJson()) {
            return response()->json([
                'bancos' => $bancos,
                'accounts' => $accounts
            ]);
        }
        
        // Si es petición web, devolver vista Inertia
        return Inertia::render('Contabilidad/Bancos/Index', [
            'bancos' => $bancos,
            'accounts' => $accounts
        ]);
    }
    
    /**
     * Registro de nueva cuenta bancaria
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'nombre_banco'  => 'required|string|max:255',
            'numero_cuenta' => 'required|string|unique:bank_accounts,numero_cuenta',
            'tipo_cuenta'   => 'required|in:Corriente,Ahorros,Caja Chica',
            'account_id'    => 'required|exists:accounts,id',
            'saldo_inicial' => 'required|numeric|min:0',
        ]);
        
        // Inicializamos el saldo_actual con el inicial
        $validated['saldo_actual'] = $request->saldo_inicial;
        
        $banco = BankAccount::create($validated);
        
        // Si es API, devolver JSON
        if (request()->is('api/*') || request()->wantsJson()) {
            return response()->json([
                'message' => 'Cuenta bancaria creada exitosamente',
                'data' => $banco->load('accountContable')
            ], 201);
        }
        
        return redirect()->route('bancos.index')->with('success', 'Cuenta bancaria creada');
    }
    
    /**
     * Transferencia entre cuentas con actualización de saldos
     */
    public function transfer(Request $request)
    {
        $request->validate([
            'from_id' => 'required|exists:bank_accounts,id',
            'to_id'   => 'required|exists:bank_accounts,id|different:from_id',
            'monto'   => 'required|numeric|min:0.01',
        ]);
        
        return DB::transaction(function () use ($request) {
            $fromAccount = BankAccount::lockForUpdate()->find($request->from_id);
            $toAccount = BankAccount::lockForUpdate()->find($request->to_id);
            
            if ($fromAccount->saldo_actual < $request->monto) {
                if (request()->is('api/*') || request()->wantsJson()) {
                    return response()->json([
                        'error' => 'Saldo insuficiente en la cuenta de origen.'
                    ], 400);
                }
                return back()->withErrors(['monto' => 'Saldo insuficiente en la cuenta de origen.']);
            }
            
            // 1. Registro del Egreso y actualización de saldo origen
            BankTransaction::create([
                'bank_account_id' => $fromAccount->id,
                'tipo' => 'Egreso',
                'monto' => $request->monto,
                'fecha' => now(),
                'descripcion' => 'Transferencia enviada a ' . $toAccount->nombre_banco,
            ]);
            $fromAccount->decrement('saldo_actual', $request->monto);
            
            // 2. Registro del Ingreso y actualización de saldo destino
            BankTransaction::create([
                'bank_account_id' => $toAccount->id,
                'tipo' => 'Ingreso',
                'monto' => $request->monto,
                'fecha' => now(),
                'descripcion' => 'Transferencia recibida de ' . $fromAccount->nombre_banco,
            ]);
            $toAccount->increment('saldo_actual', $request->monto);
            
            if (request()->is('api/*') || request()->wantsJson()) {
                return response()->json([
                    'message' => 'Transferencia completada exitosamente',
                    'from_account' => $fromAccount->fresh(),
                    'to_account' => $toAccount->fresh()
                ]);
            }
            
            return redirect()->route('bancos.index')->with('success', 'Transferencia completada exitosamente');
        });
    }
}