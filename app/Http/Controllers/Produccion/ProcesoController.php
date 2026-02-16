<?php

namespace App\Http\Controllers\Produccion;

use App\Http\Controllers\Controller;
use App\Models\Proceso;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ProcesoController extends Controller
{
    /**
     * Listado de Centros de Trabajo
     */
    public function index()
    {
        return Inertia::render('Produccion/Procesos/Index', [
            'procesos' => Proceso::orderBy('id', 'desc')->get()
        ]);
    }

    /**
     * Guardar una nueva máquina o servicio productivo
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'nombre' => 'required|string|max:100',
            'tipo_maquina' => 'required|string|max:100',
            'categoria_tecnologia' => 'required|string',
            'ancho_maximo_cm' => 'nullable|numeric|min:0',
            'largo_maximo_cm' => 'nullable|numeric|min:0',
            'tiempo_setup_minutos' => 'nullable|integer|min:0',
            'tiempo_estimado_por_unidad' => 'nullable|integer|min:0',
            'permite_nesting' => 'boolean',
            'margen_seguridad_cm' => 'nullable|numeric|min:0',
            'costo_operativo_promedio' => 'required|numeric|min:0',
            'capacidad_diaria' => 'required|integer|min:0',
            'activo' => 'boolean'
        ]);

        Proceso::create($validated);

        return back()->with('success', 'Centro de trabajo creado correctamente.');
    }

    /**
     * Actualizar configuración de la máquina
     */
    public function update(Request $request, Proceso $proceso)
    {
        $validated = $request->validate([
            'nombre' => 'required|string|max:100',
            'tipo_maquina' => 'required|string|max:100',
            'categoria_tecnologia' => 'required|string',
            'ancho_maximo_cm' => 'nullable|numeric|min:0',
            'largo_maximo_cm' => 'nullable|numeric|min:0',
            'tiempo_setup_minutos' => 'nullable|integer|min:0',
            'tiempo_estimado_por_unidad' => 'nullable|integer|min:0',
            'permite_nesting' => 'boolean',
            'margen_seguridad_cm' => 'nullable|numeric|min:0',
            'costo_operativo_promedio' => 'required|numeric|min:0',
            'capacidad_diaria' => 'required|integer|min:0',
            'activo' => 'boolean'
        ]);

        $proceso->update($validated);

        return back()->with('success', 'Configuración actualizada.');
    }
}