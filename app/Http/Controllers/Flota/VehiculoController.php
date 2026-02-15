<?php

namespace App\Http\Controllers\Flota;

use App\Http\Controllers\Controller;
use App\Models\Vehiculo;
use App\Models\VehiculoCombustible;
use App\Models\VehiculoMantenimiento;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class VehiculoController extends Controller
{
    public function index()
    {
        return response()->json(Vehiculo::with('conductor')->get());
    }

    /**
     * Registro de combustible y actualización de kilometraje [cite: 437, 438]
     */
    public function registrarCombustible(Request $request)
    {
        $validated = $request->validate([
            'vehiculo_id' => 'required|exists:vehiculos,id',
            'fecha' => 'required|date',
            'cantidad_galones' => 'required|numeric',
            'costo_total' => 'required|numeric',
            'kilometraje_registro' => 'required|integer',
        ]);

        return DB::transaction(function () use ($validated) {
            $combustible = VehiculoCombustible::create($validated);
            
            // Actualizar el odómetro del vehículo 
            Vehiculo::where('id', $validated['vehiculo_id'])
                ->update(['kilometraje_actual' => $validated['kilometraje_registro']]);

            return response()->json(['message' => 'Carga de combustible registrada', 'data' => $combustible]);
        });
    }

    /**
     * Programación y registro de mantenimiento [cite: 431, 435]
     */
    public function registrarMantenimiento(Request $request)
    {
        $validated = $request->validate([
            'vehiculo_id' => 'required|exists:vehiculos,id',
            'tipo' => 'required|in:Preventivo,Correctivo',
            'fecha_servicio' => 'required|date',
            'costo_servicio' => 'required|numeric',
            'descripcion_trabajo' => 'required|string',
            'kilometraje_servicio' => 'required|integer',
        ]);

        $mantenimiento = VehiculoMantenimiento::create($validated);
        return response()->json(['message' => 'Mantenimiento registrado', 'data' => $mantenimiento]);
    }
}