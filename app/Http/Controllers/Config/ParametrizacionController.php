<?php

namespace App\Http\Controllers\Config;

use App\Http\Controllers\Controller;
use App\Models\Tax;
use App\Models\PaymentTerm;
use Illuminate\Http\Request;

class ParametrizacionController extends Controller
{
    public function index()
    {
        return response()->json([
            'impuestos' => Tax::all(),
            'terminos_pago' => PaymentTerm::all()
        ]);
    }

    public function storeTax(Request $request)
    {
        $validated = $request->validate([
            'nombre' => 'required|string|max:100',
            'tasa' => 'required|numeric|min:0|max:100',
            'codigo_dgi' => 'nullable|string|max:50',
            'es_exento' => 'boolean'
        ]);

        $tax = Tax::create($validated);

        return redirect()->back()->with('success', 'Impuesto creado correctamente');
    }

    public function storePaymentTerm(Request $request)
    {
        $validated = $request->validate([
            'nombre' => 'required|string|max:100',
            'dias_vencimiento' => 'required|integer|min:0'
        ]);

        $term = PaymentTerm::create($validated);

        return redirect()->back()->with('success', 'Término de pago creado correctamente');
    }
}