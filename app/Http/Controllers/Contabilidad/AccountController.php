<?php

namespace App\Http\Controllers\Contabilidad;

use App\Http\Controllers\Controller;
use App\Models\Account;
use Illuminate\Http\Request;

class AccountController extends Controller
{
    public function index()
    {
        // Retorna el árbol de cuentas para el componente de React/Inertia
        $cuentas = Account::with('children')
            ->whereNull('parent_id')
            ->orderBy('codigo')
            ->get();
            
        return response()->json($cuentas);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'codigo' => 'required|unique:accounts,codigo',
            'nombre' => 'required|string',
            'tipo'   => 'required|in:Activo,Pasivo,Patrimonio,Ingreso,Costo,Gasto,Orden',
            'parent_id' => 'nullable|exists:accounts,id',
            'permite_movimiento' => 'boolean'
        ]);

        $cuenta = Account::create($validated);
        return response()->json(['message' => 'Cuenta contable creada', 'data' => $cuenta]);
    }
}