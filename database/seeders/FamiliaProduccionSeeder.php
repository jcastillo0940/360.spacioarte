<?php

namespace Database\Seeders;

use App\Models\FamiliaProduccion;
use Illuminate\Database\Seeder;

class FamiliaProduccionSeeder extends Seeder
{
    public function run(): void
    {
        $familias = [
            [
                'codigo' => 'SUBL',
                'nombre' => 'Sublimacion',
                'descripcion' => 'Productos sublimados que usan producto base, soporte impreso y nesting por pliego o rollo.',
                'tipo_consumo_material' => 'pliego_fijo',
                'requiere_material_base' => true,
                'requiere_soporte_impresion' => true,
                'requiere_nesting' => true,
                'requiere_receta' => true,
                'segundos_estandar_unidad' => 45,
                'activo' => true,
            ],
            [
                'codigo' => 'DTF',
                'nombre' => 'DTF Textil',
                'descripcion' => 'Productos textiles que consumen pelicula DTF en rollo y prenda base.',
                'tipo_consumo_material' => 'rollo_lineal',
                'requiere_material_base' => true,
                'requiere_soporte_impresion' => true,
                'requiere_nesting' => true,
                'requiere_receta' => true,
                'segundos_estandar_unidad' => 35,
                'activo' => true,
            ],
            [
                'codigo' => 'VINIL',
                'nombre' => 'Vinil Impreso',
                'descripcion' => 'Productos que consumen vinil en rollo y requieren nesting por ancho util del material.',
                'tipo_consumo_material' => 'rollo_lineal',
                'requiere_material_base' => true,
                'requiere_soporte_impresion' => true,
                'requiere_nesting' => true,
                'requiere_receta' => true,
                'segundos_estandar_unidad' => 30,
                'activo' => true,
            ],
            [
                'codigo' => 'LASER',
                'nombre' => 'Corte / Laser',
                'descripcion' => 'Productos que se fabrican a partir de una base y pueden o no usar nesting segun la lamina.',
                'tipo_consumo_material' => 'pliego_fijo',
                'requiere_material_base' => true,
                'requiere_soporte_impresion' => false,
                'requiere_nesting' => true,
                'requiere_receta' => true,
                'segundos_estandar_unidad' => 20,
                'activo' => true,
            ],
            [
                'codigo' => 'PROMO',
                'nombre' => 'Promocionales Rigidos',
                'descripcion' => 'Promocionales como tazas, llaveros o articulos que usan base, arte y terminacion.',
                'tipo_consumo_material' => 'directo_sin_nesting',
                'requiere_material_base' => true,
                'requiere_soporte_impresion' => true,
                'requiere_nesting' => false,
                'requiere_receta' => true,
                'segundos_estandar_unidad' => 60,
                'activo' => true,
            ],
        ];

        foreach ($familias as $familia) {
            FamiliaProduccion::updateOrCreate(
                ['codigo' => $familia['codigo']],
                $familia
            );
        }
    }
}
