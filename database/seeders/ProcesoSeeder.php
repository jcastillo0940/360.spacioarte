<?php

namespace Database\Seeders;

use App\Models\Proceso;
use Illuminate\Database\Seeder;

class ProcesoSeeder extends Seeder
{
    public function run(): void
    {
        $procesos = [
            [
                'nombre' => 'Impresora Sublimacion A3',
                'tipo_maquina' => 'Impresion Sublimacion',
                'categoria_tecnologia' => 'Sublimacion Inyeccion',
                'ancho_maximo_cm' => 33,
                'largo_maximo_cm' => 48,
                'tiempo_setup_minutos' => 8,
                'tiempo_estimado_por_unidad' => 12,
                'permite_nesting' => true,
                'margen_seguridad_cm' => 0.5,
                'costo_operativo_promedio' => 0.08,
                'capacidad_diaria' => 800,
                'activo' => true,
            ],
            [
                'nombre' => 'Plancha de Gorras',
                'tipo_maquina' => 'Termofijado',
                'categoria_tecnologia' => 'Sublimacion Plotter',
                'ancho_maximo_cm' => 15,
                'largo_maximo_cm' => 20,
                'tiempo_setup_minutos' => 5,
                'tiempo_estimado_por_unidad' => 45,
                'permite_nesting' => false,
                'margen_seguridad_cm' => 0.2,
                'costo_operativo_promedio' => 0.12,
                'capacidad_diaria' => 350,
                'activo' => true,
            ],
            [
                'nombre' => 'Prensa de Tazas #1',
                'tipo_maquina' => 'Sublimacion',
                'categoria_tecnologia' => 'Sublimacion Plotter',
                'ancho_maximo_cm' => 22,
                'largo_maximo_cm' => 10,
                'tiempo_setup_minutos' => 6,
                'tiempo_estimado_por_unidad' => 60,
                'permite_nesting' => false,
                'margen_seguridad_cm' => 0.2,
                'costo_operativo_promedio' => 0.15,
                'capacidad_diaria' => 100,
                'activo' => true,
            ],
            [
                'nombre' => 'Impresora DTF 60',
                'tipo_maquina' => 'DTF',
                'categoria_tecnologia' => 'DTF / Textil',
                'ancho_maximo_cm' => 60,
                'largo_maximo_cm' => 100,
                'tiempo_setup_minutos' => 10,
                'tiempo_estimado_por_unidad' => 18,
                'permite_nesting' => true,
                'margen_seguridad_cm' => 0.5,
                'costo_operativo_promedio' => 0.1,
                'capacidad_diaria' => 900,
                'activo' => true,
            ],
            [
                'nombre' => 'Plotter Ecosolvente 60',
                'tipo_maquina' => 'Vinil Impreso',
                'categoria_tecnologia' => 'Ecosolvente',
                'ancho_maximo_cm' => 60,
                'largo_maximo_cm' => 100,
                'tiempo_setup_minutos' => 10,
                'tiempo_estimado_por_unidad' => 15,
                'permite_nesting' => true,
                'margen_seguridad_cm' => 0.3,
                'costo_operativo_promedio' => 0.09,
                'capacidad_diaria' => 1200,
                'activo' => true,
            ],
            [
                'nombre' => 'Plotter de Corte Roland',
                'tipo_maquina' => 'Plotter de Corte',
                'categoria_tecnologia' => 'Plotter de Corte',
                'ancho_maximo_cm' => 60,
                'largo_maximo_cm' => 100,
                'tiempo_setup_minutos' => 5,
                'tiempo_estimado_por_unidad' => 8,
                'permite_nesting' => true,
                'margen_seguridad_cm' => 0.2,
                'costo_operativo_promedio' => 0.05,
                'capacidad_diaria' => 500,
                'activo' => true,
            ],
            [
                'nombre' => 'Laser CO2 60x40',
                'tipo_maquina' => 'Corte Laser',
                'categoria_tecnologia' => 'Corte',
                'ancho_maximo_cm' => 60,
                'largo_maximo_cm' => 40,
                'tiempo_setup_minutos' => 7,
                'tiempo_estimado_por_unidad' => 20,
                'permite_nesting' => true,
                'margen_seguridad_cm' => 0.2,
                'costo_operativo_promedio' => 0.11,
                'capacidad_diaria' => 450,
                'activo' => true,
            ],
            [
                'nombre' => 'Estacion de Diseno y Preprensa',
                'tipo_maquina' => 'Diseno',
                'categoria_tecnologia' => 'Preprensa',
                'ancho_maximo_cm' => 0,
                'largo_maximo_cm' => 0,
                'tiempo_setup_minutos' => 0,
                'tiempo_estimado_por_unidad' => 0,
                'permite_nesting' => false,
                'margen_seguridad_cm' => 0,
                'costo_operativo_promedio' => 0,
                'capacidad_diaria' => 1000,
                'activo' => true,
            ],
        ];

        foreach ($procesos as $proceso) {
            Proceso::updateOrCreate(
                ['nombre' => $proceso['nombre']],
                $proceso
            );
        }
    }
}
