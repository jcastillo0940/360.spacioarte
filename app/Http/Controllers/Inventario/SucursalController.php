<?php

namespace App\Http\Controllers\Inventario;

use App\Http\Controllers\Controller;
use App\Models\Sucursal;
use App\Models\Contacto;
use Illuminate\Http\Request;

class SucursalController extends Controller
{
    public function index()
    {
        if (request()->is('api/*')) {
            return response()->json(Sucursal::with('contacto')->get());
        }
        
        return inertia('Inventario/Sucursales/Index');
    }
    
    public function getByContacto($contactoId)
    {
        $sucursales = Sucursal::where('contacto_id', $contactoId)->where('activo', true)->get();
        return response()->json($sucursales);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'contacto_id' => 'required|exists:contactos,id',
            'codigo' => 'required|string|max:50|unique:sucursales',
            'nombre' => 'required|string|max:255',
            'direccion' => 'nullable|string',
            'telefono' => 'nullable|string|max:50',
            'encargado' => 'nullable|string|max:255',
            'email' => 'nullable|email',
            'latitud' => 'nullable|numeric|between:-90,90',
            'longitud' => 'nullable|numeric|between:-180,180',
            'notas' => 'nullable|string'
        ]);

        $validated['activo'] = true;

        $sucursal = Sucursal::create($validated);

        return redirect()->back()->with('success', 'Sucursal creada correctamente');
    }

    public function update(Request $request, Sucursal $sucursal)
    {
        $validated = $request->validate([
            'codigo' => 'required|string|max:50|unique:sucursales,codigo,' . $sucursal->id,
            'nombre' => 'required|string|max:255',
            'direccion' => 'nullable|string',
            'telefono' => 'nullable|string|max:50',
            'encargado' => 'nullable|string|max:255',
            'email' => 'nullable|email',
            'latitud' => 'nullable|numeric|between:-90,90',
            'longitud' => 'nullable|numeric|between:-180,180',
            'activo' => 'boolean',
            'notas' => 'nullable|string'
        ]);

        $sucursal->update($validated);

        return redirect()->back()->with('success', 'Sucursal actualizada correctamente');
    }
}