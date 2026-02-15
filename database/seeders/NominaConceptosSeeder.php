<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\NominaConcepto;

class NominaConceptosSeeder extends Seeder
{
    public function run(): void
    {
        // Deducciones de Ley para Planilla
        NominaConcepto::create([
            'nombre' => 'Seguro Social (Planilla)',
            'tipo' => 'Deduccion',
            'origen' => 'Ley',
            'porcentaje_empleado' => 0.0975, // 9.75%
            'porcentaje_patronal' => 0.1225, // 12.25%
        ]);

        NominaConcepto::create([
            'nombre' => 'Seguro Educativo',
            'tipo' => 'Deduccion',
            'origen' => 'Ley',
            'porcentaje_empleado' => 0.0125, // 1.25%
            'porcentaje_patronal' => 0.0150, // 1.50%
        ]);

        NominaConcepto::create([
            'nombre' => 'Servicios Profesionales (Retención ISR)',
            'tipo' => 'Deduccion',
            'origen' => 'Ley',
            'porcentaje_empleado' => 0.1000, // 10% de retención fija
            'porcentaje_patronal' => 0,
        ]);
    }
}