<?php

namespace App\Http\Controllers\Inventario;

use App\Http\Controllers\Controller;
use App\Models\Item;
use App\Models\Tax;
use App\Models\Proceso;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ItemController extends Controller
{
    /**
     * Muestra la lista de items (Vista Index)
     */
    public function index()
    {
        // Para la ruta API (si se sigue usando para búsquedas asíncronas)
        if (request()->is('api/*')) {
            return response()->json([
                'items' => Item::with(['tax', 'procesosCompatibles', 'papelesCompatibles', 'units', 'ingredientes.insumo'])->get(),
                'taxes' => Tax::all(),
                'procesos' => Proceso::where('activo', true)->get(),
                'papeles' => Item::where('es_para_nesting', true)->where('activo', true)->get(),
                'insumos' => Item::where('activo', true)->get()
            ]);
        }
        
        // Para Inertia - Enviamos los items inicialmente
        return Inertia::render('Inventario/Items/Index', [
            'items' => Item::with(['tax', 'procesosCompatibles', 'papelesCompatibles', 'units', 'ingredientes.insumo'])->get()
        ]);
    }

    /**
     * Formulario de creación
     */
    public function create()
    {
        return Inertia::render('Inventario/Items/Form', [
            'taxes' => Tax::all(),
            'procesos' => Proceso::where('activo', true)->get(),
            'papeles' => Item::where('es_para_nesting', true)->where('activo', true)->get(),
            'insumos' => Item::where('activo', true)->get()
        ]);
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
            'units' => 'nullable|array',
            'units.*.nombre' => 'required|string',
            'units.*.factor_conversion' => 'required|numeric|min:0',
            'units.*.costo_compra' => 'nullable|numeric|min:0',
            'units.*.precio_venta' => 'nullable|numeric|min:0',
            'units.*.incluye_impuestos' => 'boolean',
            'units.*.es_unidad_compra' => 'boolean',
            'ingredientes' => 'nullable|array',
            'ingredientes.*.insumo_id' => 'required|exists:items,id',
            'ingredientes.*.cantidad' => 'required|numeric|min:0.0001',
            'ingredientes.*.unidad' => 'nullable|string',
        ]);

        $item = Item::create($validated);

        if (!empty($request->units)) {
            foreach ($request->units as $unit) {
                $item->units()->create($unit);
            }
        }

        if ($request->has('ingredientes')) {
            foreach ($request->ingredientes as $ing) {
                $item->ingredientes()->create($ing);
            }
        }

        if ($request->has('procesos_ids')) {
            $item->procesosCompatibles()->sync($request->procesos_ids);
        }

        if ($request->has('papeles_ids')) {
            $item->papelesCompatibles()->sync($request->papeles_ids);
        }

        return redirect()->route('items.index')->with('success', 'Producto creado correctamente');
    }

    /**
     * Formulario de edición
     */
    public function edit(Item $item)
    {
        $item->load(['tax', 'procesosCompatibles', 'papelesCompatibles', 'units', 'ingredientes.insumo']);
        
        return Inertia::render('Inventario/Items/Form', [
            'item' => $item,
            'taxes' => Tax::all(),
            'procesos' => Proceso::where('activo', true)->get(),
            'papeles' => Item::where('es_para_nesting', true)->where('activo', true)->get(),
            'insumos' => Item::where('activo', true)->get()
        ]);
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
            'units' => 'nullable|array',
            'units.*.id' => 'nullable|exists:item_units,id',
            'units.*.nombre' => 'required|string',
            'units.*.factor_conversion' => 'required|numeric|min:0',
            'units.*.costo_compra' => 'nullable|numeric|min:0',
            'units.*.precio_venta' => 'nullable|numeric|min:0',
            'units.*.incluye_impuestos' => 'boolean',
            'units.*.es_unidad_compra' => 'boolean',
            'ingredientes' => 'nullable|array',
            'ingredientes.*.insumo_id' => 'required|exists:items,id',
            'ingredientes.*.cantidad' => 'required|numeric|min:0.0001',
            'ingredientes.*.unidad' => 'nullable|string',
        ]);

        $item->update($validated);

        if ($request->has('units')) {
            $existingUnitIds = $item->units()->pluck('id')->toArray();
            $sentUnits = collect($request->units);
            $sentUnitIds = $sentUnits->pluck('id')->filter()->toArray();

            // 1. Unidades a Desactivar/Eliminar
            $toRemove = array_diff($existingUnitIds, $sentUnitIds);
            foreach ($toRemove as $removeId) {
                try {
                    \App\Models\ItemUnit::where('id', $removeId)->delete();
                } catch (\Exception $e) {
                    \App\Models\ItemUnit::where('id', $removeId)->update(['activo' => false]);
                }
            }

            // 2. Unidades a Crear o Actualizar
            foreach ($request->units as $unitData) {
                if (!empty($unitData['id'])) {
                    \App\Models\ItemUnit::where('id', $unitData['id'])->update([
                        'nombre' => $unitData['nombre'],
                        'factor_conversion' => $unitData['factor_conversion'],
                        'costo_compra' => $unitData['costo_compra'] ?? null,
                        'precio_venta' => $unitData['precio_venta'] ?? null,
                        'incluye_impuestos' => $unitData['incluye_impuestos'] ?? false,
                        'es_unidad_compra' => $unitData['es_unidad_compra'] ?? false,
                        'activo' => true
                    ]);
                } else {
                    $item->units()->create([
                        'nombre' => $unitData['nombre'],
                        'factor_conversion' => $unitData['factor_conversion'],
                        'costo_compra' => $unitData['costo_compra'] ?? null,
                        'precio_venta' => $unitData['precio_venta'] ?? null,
                        'incluye_impuestos' => $unitData['incluye_impuestos'] ?? false,
                        'es_unidad_compra' => $unitData['es_unidad_compra'] ?? false,
                        'activo' => true
                    ]);
                }
            }
        }

        if ($request->has('procesos_ids')) {
            $item->procesosCompatibles()->sync($request->procesos_ids);
        }

        if ($request->has('papeles_ids')) {
            $item->papelesCompatibles()->sync($request->papeles_ids);
        }

        if ($request->has('ingredientes')) {
            $item->ingredientes()->delete();
            foreach ($request->ingredientes as $ing) {
                $item->ingredientes()->create([
                    'insumo_id' => $ing['insumo_id'],
                    'cantidad' => $ing['cantidad'],
                    'unidad' => $ing['unidad'] ?? null
                ]);
            }
        }

        return redirect()->route('items.index')->with('success', 'Producto actualizado correctamente');
    }

    public function destroy(Item $item)
    {
        $item->delete();
        return redirect()->route('items.index')->with('success', 'Producto eliminado correctamente');
    }
}