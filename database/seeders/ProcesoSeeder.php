<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Proceso;

class ProcesoSeeder extends Seeder
{
    public function run(): void
    {
        $procesos = [
            [
                'nombre' => 'Prensa de Tazas #1',
                'tipo_maquina' => 'Sublimación',
                'costo_operativo_promedio' => 0.15,
                'capacidad_diaria' => 100,
                'activo' => true
            ],
            [
                'nombre' => 'Plotter de Corte Roland',
                'tipo_maquina' => 'Plotter de Corte',
                'costo_operativo_promedio' => 0.05,
                'capacidad_diaria' => 500,
                'activo' => true
            ],
            [
                'nombre' => 'Estación de Diseño y Pre-prensa',
                'tipo_maquina' => 'Impresión',
                'costo_operativo_promedio' => 0.00,
                'capacidad_diaria' => 1000,
                'activo' => true
            ]
        ];

        foreach ($procesos as $p) {
            Proceso::create($p);
        }
    }
}