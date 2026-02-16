<?php

namespace App\Http\Controllers\Config;

use App\Http\Controllers\Controller;
use App\Models\TenantConfig;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DesignConfigController extends Controller
{
    public function index()
    {
        $config = TenantConfig::getSettings();
        
        return Inertia::render('Config/Design/Index', [
            'config' => [
                'max_intentos_diseno' => $config->max_intentos_diseno,
                'diseno_precio_primera_hora' => $config->diseno_precio_primera_hora,
                'diseno_precio_hora_adicional' => $config->diseno_precio_hora_adicional,
                'diseno_revisiones_gratuitas' => $config->diseno_revisiones_gratuitas,
                'diseno_cobro_automatico' => $config->diseno_cobro_automatico
            ]
        ]);
    }

    public function update(Request $request)
    {
        $validated = $request->validate([
            'max_intentos_diseno' => 'required|integer|min:1',
            'diseno_precio_primera_hora' => 'required|numeric|min:0',
            'diseno_precio_hora_adicional' => 'required|numeric|min:0',
            'diseno_revisiones_gratuitas' => 'required|integer|min:0',
            'diseno_cobro_automatico' => 'required|boolean'
        ]);

        $config = TenantConfig::first();
        
        if (!$config) {
            return response()->json(['error' => 'Configuración no encontrada'], 404);
        }

        $config->update($validated);

        return response()->json([
            'message' => 'Configuración de diseño actualizada correctamente',
            'config' => $config
        ]);
    }
}
