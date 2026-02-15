<?php

namespace App\Http\Controllers\Inventario;

use App\Http\Controllers\Controller;
use App\Models\Item;
use App\Models\Tax;
use Illuminate\Http\Request;

class ItemController extends Controller
{
    public function index()
    {
        // Para la ruta API
        if (request()->is('api/*')) {
            return response()->json([
                'items' => Item::with('tax')->get(),
                'taxes' => Tax::all()
            ]);
        }
        
        // Para la ruta Inertia
        return inertia('Inventario/Items/Index');
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'codigo' => 'required|string|max:50|unique:items',
            'nombre' => 'required|string|max:255',
            'descripcion' => 'nullable|string',
            'tipo' => 'required|in:Inventariable,Servicio',
            'precio_venta' => 'required|numeric|min:0',
            'costo_promedio' => 'required|numeric|min:0',
            'stock_actual' => 'nullable|numeric|min:0',
            'stock_minimo' => 'nullable|numeric|min:0',
            'stock_maximo' => 'nullable|numeric|min:0',
            'tax_id' => 'required|exists:taxes,id',
            'categoria' => 'nullable|string|max:100',
            'unidad_medida' => 'required|string|max:20'
        ]);

        $validated['activo'] = true;

        $item = Item::create($validated);

        return redirect()->back()->with('success', 'Producto creado correctamente');
    }

    public function update(Request $request, Item $item)
    {
        $validated = $request->validate([
            'codigo' => 'required|string|max:50|unique:items,codigo,' . $item->id,
            'nombre' => 'required|string|max:255',
            'descripcion' => 'nullable|string',
            'tipo' => 'required|in:Inventariable,Servicio',
            'precio_venta' => 'required|numeric|min:0',
            'costo_promedio' => 'required|numeric|min:0',
            'stock_actual' => 'nullable|numeric|min:0',
            'stock_minimo' => 'nullable|numeric|min:0',
            'stock_maximo' => 'nullable|numeric|min:0',
            'tax_id' => 'required|exists:taxes,id',
            'categoria' => 'nullable|string|max:100',
            'unidad_medida' => 'required|string|max:20'
        ]);

        $item->update($validated);

        return redirect()->back()->with('success', 'Producto actualizado correctamente');
    }
}