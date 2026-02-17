<?php

namespace App\Http\Controllers\Config;

use App\Http\Controllers\Controller;
use App\Models\PosMetodoPago;
use App\Models\BankAccount;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PosMetodoPagoController extends Controller
{
    public function index()
    {
        return Inertia::render('Configuracion/Pos/MetodosPago/Index', [
            'metodos' => PosMetodoPago::with('cuentaBancaria')->get(),
            'cuentas' => BankAccount::all()
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'nombre' => 'required|string|max:255',
            'tipo' => 'required|string',
            'bank_account_id' => 'nullable|exists:bank_accounts,id',
            'activo' => 'boolean',
            'requiere_referencia' => 'boolean'
        ]);

        PosMetodoPago::create($request->all());

        return redirect()->back()->with('success', 'Método de pago creado');
    }

    public function update(Request $request, PosMetodoPago $metodo)
    {
        $request->validate([
            'nombre' => 'required|string|max:255',
            'tipo' => 'required|string',
            'bank_account_id' => 'nullable|exists:bank_accounts,id',
            'activo' => 'boolean',
            'requiere_referencia' => 'boolean'
        ]);

        $metodo->update($request->all());

        return redirect()->back()->with('success', 'Método de pago actualizado');
    }

    public function destroy(PosMetodoPago $metodo)
    {
        $metodo->delete();
        return redirect()->back()->with('success', 'Método de pago eliminado');
    }
}
