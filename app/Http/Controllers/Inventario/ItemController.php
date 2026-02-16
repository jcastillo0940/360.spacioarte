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
                'items' => Item::with(['tax', 'procesosCompatibles', 'papelesCompatibles'])->get(),
                'taxes' => Tax::all(),
                'procesos' => \App\Models\Proceso::where('activo', true)->get(),
                'papeles' => Item::where('es_para_nesting', true)->where('activo', true)->get()
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
            'tipo' => 'required|in:Inventariable,Servicio,Materia Prima,Producto Terminado,Consumible',
            'precio_venta' => 'required|numeric|min:0',
            'costo_promedio' => 'required|numeric|min:0',
            'stock_actual' => 'nullable|numeric|min:0',
            'stock_minimo' => 'nullable|numeric|min:0',
            'stock_maximo' => 'nullable|numeric|min:0',
            'tax_id' => 'required|exists:taxes,id',
            'categoria' => 'nullable|string|max:100',
            'ancho_cm' => 'nullable|numeric|min:0',
            'largo_cm' => 'nullable|numeric|min:0',
            'es_rollo' => 'boolean',
            'margen_seguridad_cm' => 'nullable|numeric|min:0',
            'es_para_nesting' => 'boolean',
            'es_insumo' => 'boolean',
            'requires_recipe' => 'boolean',
            'tipo_impresion' => 'nullable|string',
            'ancho_imprimible' => 'nullable|numeric|min:0',
            'largo_imprimible' => 'nullable|numeric|min:0',
            'permite_rotacion' => 'boolean',
            'separacion_piezas' => 'nullable|numeric|min:0',
            'sangrado' => 'nullable|numeric|min:0',
            'proceso_id' => 'nullable|exists:procesos,id',
            'item_base_id' => 'nullable|exists:items,id',
            'procesos_ids' => 'nullable|array',
            'procesos_ids.*' => 'exists:procesos,id',
            'papeles_ids' => 'nullable|array',
            'papeles_ids.*' => 'exists:items,id',
        ]);

        $validated['activo'] = true;

        $item = Item::create($validated);

        if ($request->has('procesos_ids')) {
            $item->procesosCompatibles()->sync($request->procesos_ids);
        }

        if ($request->has('papeles_ids')) {
            $item->papelesCompatibles()->sync($request->papeles_ids);
        }

        return redirect()->back()->with('success', 'Producto creado correctamente');
    }

    public function update(Request $request, Item $item)
    {
        $validated = $request->validate([
            'codigo' => 'required|string|max:50|unique:items,codigo,' . $item->id,
            'nombre' => 'required|string|max:255',
            'descripcion' => 'nullable|string',
            'tipo' => 'required|in:Inventariable,Servicio,Materia Prima,Producto Terminado,Consumible',
            'precio_venta' => 'required|numeric|min:0',
            'costo_promedio' => 'required|numeric|min:0',
            'stock_actual' => 'nullable|numeric|min:0',
            'stock_minimo' => 'nullable|numeric|min:0',
            'stock_maximo' => 'nullable|numeric|min:0',
            'tax_id' => 'required|exists:taxes,id',
            'categoria' => 'nullable|string|max:100',
            'unidad_medida' => 'required|string|max:20',
            'ancho_cm' => 'nullable|numeric|min:0',
            'largo_cm' => 'nullable|numeric|min:0',
            'es_rollo' => 'boolean',
            'margen_seguridad_cm' => 'nullable|numeric|min:0',
            'es_para_nesting' => 'boolean',
            'es_insumo' => 'boolean',
            'requires_recipe' => 'boolean',
            'tipo_impresion' => 'nullable|string',
            'ancho_imprimible' => 'nullable|numeric|min:0',
            'largo_imprimible' => 'nullable|numeric|min:0',
            'permite_rotacion' => 'boolean',
            'separacion_piezas' => 'nullable|numeric|min:0',
            'sangrado' => 'nullable|numeric|min:0',
            'proceso_id' => 'nullable|exists:procesos,id',
            'item_base_id' => 'nullable|exists:items,id',
            'procesos_ids' => 'nullable|array',
            'procesos_ids.*' => 'exists:procesos,id',
            'papeles_ids' => 'nullable|array',
            'papeles_ids.*' => 'exists:items,id',
        ]);

        $item->update($validated);

        if ($request->has('procesos_ids')) {
            $item->procesosCompatibles()->sync($request->procesos_ids);
        }

        if ($request->has('papeles_ids')) {
            $item->papelesCompatibles()->sync($request->papeles_ids);
        }

        return redirect()->back()->with('success', 'Producto actualizado correctamente');
    }
}