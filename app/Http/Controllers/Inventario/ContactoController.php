<?php

namespace App\Http\Controllers\Inventario;

use App\Http\Controllers\Controller;
use App\Models\Contacto;
use App\Models\PaymentTerm;
use Illuminate\Http\Request;

class ContactoController extends Controller
{
    public function index()
    {
        // Para la ruta API
        if (request()->is('api/*')) {
            return response()->json([
                'contactos' => Contacto::with('payment_term')->get(),
                'terminos_pago' => PaymentTerm::all()
            ]);
        }
        
        // Para la ruta Inertia
        return inertia('Inventario/Contactos/Index');
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'razon_social' => 'required|string|max:255',
            'tipo_identificacion' => 'required|in:RUC,Cedula,Pasaporte',
            'identificacion' => 'required|string|max:50|unique:contactos',
            'digito_verificador' => 'nullable|string|max:10',
            'requiere_factura_electronica' => 'boolean',
            'dv' => 'nullable|string|max:2',
            'direccion' => 'nullable|string',
            'telefono' => 'nullable|string|max:50',
            'email' => 'nullable|email',
            'es_cliente' => 'boolean',
            'es_proveedor' => 'boolean',
            'payment_term_id' => 'required|exists:payment_terms,id',
            'limite_credito' => 'nullable|numeric|min:0'
        ]);

        $contacto = Contacto::create($validated);

        if ($request->wantsJson()) {
            return response()->json($contacto);
        }

        return redirect()->back()->with('success', 'Contacto creado correctamente');
    }

    public function update(Request $request, Contacto $contacto)
    {
        $validated = $request->validate([
            'razon_social' => 'required|string|max:255',
            'tipo_identificacion' => 'required|in:RUC,Cedula,Pasaporte',
            'identificacion' => 'required|string|max:50|unique:contactos,identificacion,' . $contacto->id,
            'dv' => 'nullable|string|max:2',
            'direccion' => 'nullable|string',
            'telefono' => 'nullable|string|max:50',
            'email' => 'nullable|email',
            'es_cliente' => 'boolean',
            'es_proveedor' => 'boolean',
            'payment_term_id' => 'required|exists:payment_terms,id',
            'limite_credito' => 'nullable|numeric|min:0'
        ]);

        $contacto->update($validated);

        return redirect()->back()->with('success', 'Contacto actualizado correctamente');
    }
}