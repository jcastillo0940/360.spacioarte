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
            'nombre'                    => 'required|string|max:100',
            'tipo_maquina'              => 'required|string|max:100', // Ej. Prensa, Láser, DTF
            'costo_operativo_promedio'  => 'required|numeric|min:0',
            'capacidad_diaria'          => 'required|integer|min:0',   // Base para el cálculo predictivo
            'activo'                    => 'boolean'
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
            'nombre'                    => 'required|string|max:100',
            'tipo_maquina'              => 'required|string|max:100',
            'costo_operativo_promedio'  => 'required|numeric|min:0',
            'capacidad_diaria'          => 'required|integer|min:0',
            'activo'                    => 'boolean'
        ]);

        $proceso->update($validated);

        return back()->with('success', 'Configuración actualizada.');
    }
}