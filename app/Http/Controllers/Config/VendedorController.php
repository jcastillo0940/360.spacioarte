<?php

namespace App\Http\Controllers\Config;

use App\Http\Controllers\Controller;
use App\Models\Vendedor;
use Illuminate\Http\Request;

class VendedorController extends Controller
{
    public function index()
    {
        return response()->json(Vendedor::all());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'nombre_completo' => 'required|string|max:255',
            'identificacion' => 'required|string|max:50|unique:vendedores',
            'email' => 'required|email|unique:vendedores',
            'telefono' => 'nullable|string|max:50',
            'zona_venta' => 'nullable|string|max:100',
            'porcentaje_comision' => 'nullable|numeric|min:0|max:100',
            'meta_mensual' => 'nullable|numeric|min:0'
        ]);

        // Compatibilidad DB: en algunos entornos meta_mensual no acepta NULL.
        $validated['meta_mensual'] = $validated['meta_mensual'] ?? 0;
        $validated['porcentaje_comision'] = $validated['porcentaje_comision'] ?? 0;

        $vendedor = Vendedor::create($validated);

        return redirect()->back()->with('success', 'Vendedor registrado correctamente');
    }

    public function update(Request $request, Vendedor $vendedor)
    {
        $validated = $request->validate([
            'nombre_completo' => 'required|string|max:255',
            'identificacion' => 'required|string|max:50|unique:vendedores,identificacion,' . $vendedor->id,
            'email' => 'required|email|unique:vendedores,email,' . $vendedor->id,
            'telefono' => 'nullable|string|max:50',
            'zona_venta' => 'nullable|string|max:100',
            'porcentaje_comision' => 'nullable|numeric|min:0|max:100',
            'meta_mensual' => 'nullable|numeric|min:0'
        ]);

        // Compatibilidad DB: en algunos entornos meta_mensual no acepta NULL.
        $validated['meta_mensual'] = $validated['meta_mensual'] ?? ($vendedor->meta_mensual ?? 0);
        $validated['porcentaje_comision'] = $validated['porcentaje_comision'] ?? ($vendedor->porcentaje_comision ?? 0);

        $vendedor->update($validated);

        return redirect()->back()->with('success', 'Vendedor actualizado correctamente');
    }
}
