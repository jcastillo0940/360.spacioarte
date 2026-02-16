<?php

namespace App\Http\Controllers\Config;

use App\Http\Controllers\Controller;
use App\Models\TenantConfig;
use Illuminate\Http\Request;

class SettingsController extends Controller
{
    public function index()
    {
        $config = TenantConfig::first();
        
        return response()->json($config ?? [
            'razon_social' => '',
            'ruc' => '',
            'dv' => '',
            'direccion' => '',
            'telefono' => '',
            'email' => '',
            'itbms_porcentaje' => 7,
            'factura_serie' => 'FAC',
            'factura_inicio' => 1
        ]);
    }

    public function update(Request $request)
    {
        $validated = $request->validate([
            'razon_social' => 'required|string|max:255',
            'ruc' => 'required|string|max:50',
            'dv' => 'nullable|string|max:2',
            'direccion' => 'nullable|string',
            'telefono' => 'nullable|string|max:50',
            'email' => 'nullable|email',
            'itbms_porcentaje' => 'required|numeric|min:0|max:100',
            'factura_serie' => 'required|string|max:10',
            'factura_inicio' => 'required|integer|min:1',
            'cta_gasto_salario_id' => 'nullable|exists:chart_of_accounts,id',
            'cta_retenciones_id' => 'nullable|exists:chart_of_accounts,id',
            'cta_caja_banco_id' => 'nullable|exists:chart_of_accounts,id',
            'max_intentos_diseno' => 'required|integer|min:1|max:10'
        ]);

        $config = TenantConfig::first();
        
        if ($config) {
            $config->update($validated);
        } else {
            $config = TenantConfig::create($validated);
        }

        return redirect()->back()->with('success', 'Configuración actualizada correctamente');
    }
}