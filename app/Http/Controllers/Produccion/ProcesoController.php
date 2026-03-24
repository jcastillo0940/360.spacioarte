<?php

namespace App\Http\Controllers\Produccion;

use App\Http\Controllers\Controller;
use App\Models\Proceso;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class ProcesoController extends Controller
{
    public function index()
    {
        return Inertia::render('Produccion/Procesos/Index', [
            'procesos' => Proceso::orderBy('id', 'desc')->get(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $this->validateProceso($request);
        Proceso::create($validated);

        return back()->with('success', 'Centro de trabajo creado correctamente.');
    }

    public function update(Request $request, Proceso $proceso)
    {
        $validated = $this->validateProceso($request);
        $proceso->update($validated);

        return back()->with('success', 'Configuracion actualizada.');
    }

    public function destroy(Proceso $proceso)
    {
        if ($proceso->ordenesProduccion()->exists()) {
            $proceso->update(['activo' => false]);

            return back()->with('success', 'La maquina tiene historial, por lo que fue desactivada en lugar de eliminarse.');
        }

        DB::transaction(function () use ($proceso) {
            $proceso->delete();
        });

        return back()->with('success', 'Maquina eliminada correctamente.');
    }

    private function validateProceso(Request $request): array
    {
        return $request->validate([
            'nombre' => 'required|string|max:100',
            'tipo_maquina' => 'required|string|max:100',
            'categoria_tecnologia' => 'required|string',
            'ancho_maximo_cm' => 'nullable|numeric|min:0',
            'largo_maximo_cm' => 'nullable|numeric|min:0',
            'tiempo_setup_minutos' => 'nullable|numeric|min:0',
            'tiempo_estimado_por_unidad' => 'nullable|numeric|min:0',
            'permite_nesting' => 'boolean',
            'margen_seguridad_cm' => 'nullable|numeric|min:0',
            'costo_operativo_promedio' => 'required|numeric|min:0',
            'capacidad_diaria' => 'required|integer|min:0',
            'activo' => 'boolean',
        ]);
    }
}
