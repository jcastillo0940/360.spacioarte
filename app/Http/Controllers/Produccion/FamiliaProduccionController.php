<?php

namespace App\Http\Controllers\Produccion;

use App\Http\Controllers\Controller;
use App\Models\FamiliaProduccion;
use Illuminate\Http\Request;
use Inertia\Inertia;

class FamiliaProduccionController extends Controller
{
    public function index()
    {
        return Inertia::render('Produccion/Familias/Index', [
            'familias' => FamiliaProduccion::withCount('items')->orderBy('nombre')->get(),
        ]);
    }

    public function store(Request $request)
    {
        FamiliaProduccion::create($this->validateData($request));

        return redirect()->route('produccion.familias.index')->with('success', 'Familia productiva creada correctamente.');
    }

    public function update(Request $request, FamiliaProduccion $familia)
    {
        $familia->update($this->validateData($request, $familia));

        return redirect()->route('produccion.familias.index')->with('success', 'Familia productiva actualizada correctamente.');
    }

    public function destroy(FamiliaProduccion $familia)
    {
        if ($familia->items()->exists()) {
            $familia->update(['activo' => false]);

            return redirect()->route('produccion.familias.index')->with(
                'success',
                'La familia tiene productos asociados, por eso fue desactivada en lugar de eliminarse.'
            );
        }

        $familia->delete();

        return redirect()->route('produccion.familias.index')->with('success', 'Familia productiva eliminada correctamente.');
    }

    private function validateData(Request $request, ?FamiliaProduccion $familia = null): array
    {
        $validated = $request->validate([
            'codigo' => 'required|string|max:30|unique:familias_produccion,codigo,' . ($familia?->id ?? 'NULL'),
            'nombre' => 'required|string|max:120',
            'descripcion' => 'nullable|string|max:500',
            'tipo_consumo_material' => 'required|in:pliego_fijo,rollo_lineal,unidad_completa,directo_sin_nesting',
            'requiere_material_base' => 'boolean',
            'requiere_soporte_impresion' => 'boolean',
            'requiere_nesting' => 'boolean',
            'requiere_receta' => 'boolean',
            'segundos_estandar_unidad' => 'nullable|numeric|min:0',
            'activo' => 'boolean',
        ]);

        $validated['requiere_material_base'] = $request->boolean('requiere_material_base');
        $validated['requiere_soporte_impresion'] = $request->boolean('requiere_soporte_impresion');
        $validated['requiere_nesting'] = $request->boolean('requiere_nesting');
        $validated['requiere_receta'] = $request->boolean('requiere_receta');
        $validated['activo'] = $request->boolean('activo', true);
        $validated['segundos_estandar_unidad'] = $validated['segundos_estandar_unidad'] ?? 0;

        return $validated;
    }
}
