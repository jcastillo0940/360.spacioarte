<?php

namespace App\Http\Controllers\Inventario;

use App\Http\Controllers\Controller;
use App\Models\FamiliaProduccion;
use App\Models\Item;
use App\Models\ItemCategory;
use App\Models\Tax;
use App\Models\Proceso;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
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
                'items' => Item::with(['tax', 'category', 'familiaProduccion', 'procesosCompatibles', 'papelesCompatibles', 'units', 'ingredientes.insumo'])->get(),
                'taxes' => Tax::all(),
                'item_categories' => ItemCategory::where('activo', true)->orderBy('nombre')->get(),
                'procesos' => Proceso::where('activo', true)->get(),
                'familias_produccion' => FamiliaProduccion::where('activo', true)->orderBy('nombre')->get(),
                'papeles' => Item::materialesSoporte()->get(),
                'insumos' => Item::where('activo', true)->get()
            ]);
        }
        
        // Para Inertia - Enviamos los items inicialmente
        return Inertia::render('Inventario/Items/Index', [
            'items' => Item::with(['tax', 'category', 'familiaProduccion', 'procesosCompatibles', 'papelesCompatibles', 'units', 'ingredientes.insumo'])->get()
        ]);
    }

    /**
     * Formulario de creación
     */
    public function create()
    {
        return Inertia::render('Inventario/Items/Form', [
            'taxes' => Tax::all(),
            'itemCategories' => ItemCategory::where('activo', true)->orderBy('nombre')->get(),
            'procesos' => Proceso::where('activo', true)->get(),
            'familiasProduccion' => FamiliaProduccion::where('activo', true)->orderBy('nombre')->get(),
            'papeles' => Item::materialesSoporte()->get(),
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
            'category_id' => 'nullable|exists:item_categories,id',
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
            'familia_produccion_id' => 'nullable|exists:familias_produccion,id',
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

        $validated = $this->normalizeAndValidateBusinessRules($request, $validated);

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
        $item->load(['tax', 'category', 'familiaProduccion', 'procesosCompatibles', 'papelesCompatibles', 'units', 'ingredientes.insumo']);
        
        return Inertia::render('Inventario/Items/Form', [
            'item' => $item,
            'taxes' => Tax::all(),
            'itemCategories' => ItemCategory::where('activo', true)->orderBy('nombre')->get(),
            'procesos' => Proceso::where('activo', true)->get(),
            'familiasProduccion' => FamiliaProduccion::where('activo', true)->orderBy('nombre')->get(),
            'papeles' => Item::materialesSoporte()->get(),
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
            'category_id' => 'nullable|exists:item_categories,id',
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
            'familia_produccion_id' => 'nullable|exists:familias_produccion,id',
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

        $validated = $this->normalizeAndValidateBusinessRules($request, $validated, $item);

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
        try {
            DB::transaction(function () use ($item) {
                $item->procesosCompatibles()->detach();
                $item->papelesCompatibles()->detach();
                $item->units()->delete();
                $item->ingredientes()->delete();
                $item->delete();
            });

            return redirect()->route('items.index')->with('success', 'Articulo eliminado correctamente.');
        } catch (\Throwable $e) {
            $item->update(['activo' => false]);

            return redirect()->route('items.index')->with(
                'success',
                'El articulo tenia movimientos o relaciones historicas, asi que fue desactivado en lugar de borrarse.'
            );
        }
    }

    private function normalizeAndValidateBusinessRules(Request $request, array $validated, ?Item $item = null): array
    {
        $validated['es_rollo'] = $request->boolean('es_rollo');
        $validated['es_para_nesting'] = $request->boolean('es_para_nesting');
        $validated['es_insumo'] = $request->boolean('es_insumo');
        $validated['requires_recipe'] = $request->boolean('requires_recipe');
        $validated['permite_rotacion'] = $request->boolean('permite_rotacion', true);

        $validated['proceso_id'] = $validated['proceso_id'] ?? null;
        $validated['item_base_id'] = $validated['item_base_id'] ?? null;
        $validated['familia_produccion_id'] = $validated['familia_produccion_id'] ?? null;
        $validated['category_id'] = $validated['category_id'] ?? null;

        if (!empty($validated['category_id'])) {
            $categoria = ItemCategory::find($validated['category_id']);
            $validated['categoria'] = $categoria?->nombre;
        } elseif (empty($validated['categoria'])) {
            $validated['categoria'] = null;
        }

        $errors = [];

        $familia = !empty($validated['familia_produccion_id'])
            ? FamiliaProduccion::find($validated['familia_produccion_id'])
            : null;

        if ($item && !empty($validated['item_base_id']) && (int) $validated['item_base_id'] === (int) $item->id) {
            $errors['item_base_id'] = 'El material base no puede ser el mismo artículo.';
        }

        if ($validated['requires_recipe'] && empty($validated['proceso_id']) && empty($validated['procesos_ids'])) {
            $errors['proceso_id'] = 'Define un proceso principal o al menos un proceso compatible para fabricar este producto.';
        }

        if ($familia) {
            if ($familia->requiere_material_base && empty($validated['item_base_id'])) {
                $errors['item_base_id'] = 'La familia productiva seleccionada exige material base.';
            }

            if ($familia->requiere_soporte_impresion && empty($validated['papeles_ids'])) {
                $errors['papeles_ids'] = 'La familia productiva seleccionada exige al menos un soporte compatible.';
            }

            if ($familia->requiere_receta && empty($validated['ingredientes']) && empty($validated['item_base_id'])) {
                $errors['ingredientes'] = 'La familia productiva seleccionada exige receta o material base para poder fabricar.';
            }

            if ($familia->requiere_nesting && (empty($validated['ancho_imprimible']) || empty($validated['largo_imprimible']))) {
                $errors['ancho_imprimible'] = 'La familia productiva seleccionada exige ancho y alto imprimible para nesting.';
            }

            if ($familia->requiere_nesting && !empty($validated['proceso_id'])) {
                $procesoPrincipal = Proceso::find($validated['proceso_id']);
                if ($procesoPrincipal && !$procesoPrincipal->permite_nesting) {
                    $errors['proceso_id'] = 'La familia productiva seleccionada exige un proceso principal que permita nesting.';
                }
            }

            if ($familia->requiere_nesting && !empty($validated['procesos_ids'])) {
                $procesosConNesting = Proceso::whereIn('id', $validated['procesos_ids'])
                    ->where('permite_nesting', true)
                    ->count();

                if ($procesosConNesting === 0) {
                    $errors['procesos_ids'] = 'La familia productiva seleccionada exige al menos un proceso compatible que permita nesting.';
                }
            }
        }

        if ($validated['es_para_nesting'] && empty($validated['ancho_cm'])) {
            $errors['ancho_cm'] = 'Los materiales soporte para nesting deben definir el ancho del papel, vinilo o soporte.';
        }

        if ($validated['es_para_nesting'] && empty($validated['es_rollo']) && empty($validated['largo_cm'])) {
            $errors['largo_cm'] = 'Los materiales soporte en hoja o pliego deben definir el largo del soporte.';
        }

        if (!empty($validated['papeles_ids'])) {
            $papersCount = Item::whereIn('id', $validated['papeles_ids'])
                ->materialesSoporte()
                ->count();

            if ($papersCount !== count($validated['papeles_ids'])) {
                $errors['papeles_ids'] = 'Solo puedes asignar materiales soporte reales: papel, vinilo, transfer o insumos equivalentes.';
            }

            if (empty($validated['ancho_imprimible']) || empty($validated['largo_imprimible'])) {
                $errors['ancho_imprimible'] = 'Si el producto usa soportes para nesting, define el ancho y alto imprimible del arte.';
            }
        }

        if (!empty($validated['papeles_ids']) && $item && in_array((int) $item->id, array_map('intval', $validated['papeles_ids']), true)) {
            $errors['papeles_ids'] = 'Un producto no puede asignarse a sí mismo como papel o soporte compatible.';
        }

        if (!empty($validated['papeles_ids']) && !$item && !empty($request->codigo)) {
            // Sin ID aún no podemos comparar por registro, pero sí prevenimos el caso de marcar el mismo SKU como soporte fabricable.
            $supportsFabricables = Item::whereIn('id', $validated['papeles_ids'])
                ->where('requires_recipe', true)
                ->count();

            if ($supportsFabricables > 0) {
                $errors['papeles_ids'] = 'Los papeles o soportes compatibles no pueden ser productos que también se fabrican.';
            }
        }

        if ($validated['es_para_nesting'] && $validated['requires_recipe']) {
            $errors['es_para_nesting'] = 'Un producto fabricable no debe marcarse como material soporte de nesting.';
        }

        if ($validated['requires_recipe'] && !empty($validated['item_base_id']) && $validated['item_base_id'] === ($validated['papeles_ids'][0] ?? null)) {
            $errors['item_base_id'] = 'El material base del producto no debe ser el mismo soporte de impresion o nesting.';
        }

        if (!empty($validated['procesos_ids'])) {
            $processCount = Proceso::whereIn('id', $validated['procesos_ids'])
                ->where('activo', true)
                ->count();

            if ($processCount !== count($validated['procesos_ids'])) {
                $errors['procesos_ids'] = 'Solo puedes asignar procesos activos.';
            }
        }

        if (!empty($validated['ingredientes'])) {
            foreach ($validated['ingredientes'] as $index => $ingrediente) {
                if ($item && (int) $ingrediente['insumo_id'] === (int) $item->id) {
                    $errors["ingredientes.$index.insumo_id"] = 'El producto no puede ser insumo de su propia receta.';
                }
            }
        }

        if (!empty($errors)) {
            throw ValidationException::withMessages($errors);
        }

        return $validated;
    }
}
