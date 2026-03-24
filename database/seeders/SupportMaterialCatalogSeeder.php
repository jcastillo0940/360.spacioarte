<?php

namespace Database\Seeders;

use App\Models\Item;
use Illuminate\Database\Seeder;

class SupportMaterialCatalogSeeder extends Seeder
{
    public function run(): void
    {
        $supports = [
            [
                'codigo' => 'SOP-SUBL-2550',
                'nombre' => 'Papel Sublimable 25x50 cm',
                'tipo' => 'Materia Prima',
                'categoria' => 'Soportes Sublimacion',
                'unidad_medida' => 'UND',
                'ancho_cm' => 25,
                'largo_cm' => 50,
                'es_rollo' => false,
                'margen_seguridad_cm' => 0.5,
                'es_para_nesting' => true,
                'es_insumo' => true,
            ],
            [
                'codigo' => 'SOP-SUBL-A4',
                'nombre' => 'Papel Sublimable A4',
                'tipo' => 'Materia Prima',
                'categoria' => 'Soportes Sublimacion',
                'unidad_medida' => 'UND',
                'ancho_cm' => 21,
                'largo_cm' => 29.7,
                'es_rollo' => false,
                'margen_seguridad_cm' => 0.3,
                'es_para_nesting' => true,
                'es_insumo' => true,
            ],
            [
                'codigo' => 'SOP-DTF-60',
                'nombre' => 'Film DTF 60 cm',
                'tipo' => 'Materia Prima',
                'categoria' => 'Soportes DTF',
                'unidad_medida' => 'CM',
                'ancho_cm' => 60,
                'largo_cm' => 100,
                'es_rollo' => true,
                'margen_seguridad_cm' => 0.5,
                'es_para_nesting' => true,
                'es_insumo' => true,
            ],
            [
                'codigo' => 'SOP-VINIL-60',
                'nombre' => 'Vinil Adhesivo Blanco 60 cm',
                'tipo' => 'Materia Prima',
                'categoria' => 'Soportes Vinil',
                'unidad_medida' => 'CM',
                'ancho_cm' => 60,
                'largo_cm' => 100,
                'es_rollo' => true,
                'margen_seguridad_cm' => 0.3,
                'es_para_nesting' => true,
                'es_insumo' => true,
            ],
            [
                'codigo' => 'SOP-MDF-3060',
                'nombre' => 'Lamina MDF 30x60 cm',
                'tipo' => 'Materia Prima',
                'categoria' => 'Soportes Rigidos',
                'unidad_medida' => 'UND',
                'ancho_cm' => 30,
                'largo_cm' => 60,
                'es_rollo' => false,
                'margen_seguridad_cm' => 0.3,
                'es_para_nesting' => true,
                'es_insumo' => true,
            ],
        ];

        foreach ($supports as $support) {
            Item::updateOrCreate(
                ['codigo' => $support['codigo']],
                array_merge([
                    'precio_venta' => 0,
                    'costo_promedio' => 0,
                    'stock_actual' => 0,
                    'stock_minimo' => 0,
                    'stock_maximo' => 0,
                    'tax_id' => 1,
                    'activo' => true,
                    'requires_recipe' => false,
                    'permite_rotacion' => true,
                    'separacion_piezas' => 0.5,
                    'sangrado' => 0.2,
                ], $support)
            );
        }
    }
}
