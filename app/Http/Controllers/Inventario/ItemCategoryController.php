<?php

namespace App\Http\Controllers\Inventario;

use App\Http\Controllers\Controller;
use App\Models\ItemCategory;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ItemCategoryController extends Controller
{
    public function index()
    {
        return Inertia::render('Inventario/Categorias/Index', [
            'categories' => ItemCategory::orderBy('nombre')->get(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'nombre' => 'required|string|max:100|unique:item_categories,nombre',
            'descripcion' => 'nullable|string',
        ]);

        ItemCategory::create([
            ...$validated,
            'activo' => true,
        ]);

        return redirect()->route('inventario.categorias.index')->with('success', 'Categoria creada correctamente.');
    }

    public function update(Request $request, ItemCategory $categoria)
    {
        $validated = $request->validate([
            'nombre' => 'required|string|max:100|unique:item_categories,nombre,' . $categoria->id,
            'descripcion' => 'nullable|string',
            'activo' => 'boolean',
        ]);

        $categoria->update([
            'nombre' => $validated['nombre'],
            'descripcion' => $validated['descripcion'] ?? null,
            'activo' => $request->boolean('activo', true),
        ]);

        return redirect()->route('inventario.categorias.index')->with('success', 'Categoria actualizada correctamente.');
    }

    public function destroy(ItemCategory $categoria)
    {
        if ($categoria->items()->exists()) {
            $categoria->update(['activo' => false]);

            return redirect()->route('inventario.categorias.index')->with(
                'success',
                'La categoria tenia productos relacionados, asi que fue desactivada en lugar de borrarse.'
            );
        }

        $categoria->delete();

        return redirect()->route('inventario.categorias.index')->with('success', 'Categoria eliminada correctamente.');
    }
}
