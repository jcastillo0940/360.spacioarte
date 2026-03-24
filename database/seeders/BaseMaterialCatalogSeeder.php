<?php

namespace Database\Seeders;

use App\Models\Item;
use Illuminate\Database\Seeder;

class BaseMaterialCatalogSeeder extends Seeder
{
    public function run(): void
    {
        $bases = [
            ['codigo' => 'BASE-GORRA', 'nombre' => 'Gorra Sublimable Lisa', 'categoria' => 'Bases Textiles'],
            ['codigo' => 'BASE-TAZA11', 'nombre' => 'Taza Blanca 11oz', 'categoria' => 'Bases Rigidas'],
            ['codigo' => 'BASE-CAMISETA', 'nombre' => 'Camiseta Blanca', 'categoria' => 'Bases Textiles'],
            ['codigo' => 'BASE-LLAVERO', 'nombre' => 'Llavero Acrilico Base', 'categoria' => 'Bases Rigidas'],
            ['codigo' => 'BASE-STICKER', 'nombre' => 'Sticker Vinil Base', 'categoria' => 'Bases Adhesivas'],
        ];

        foreach ($bases as $base) {
            Item::updateOrCreate(
                ['codigo' => $base['codigo']],
                array_merge([
                    'tipo' => 'Materia Prima',
                    'precio_venta' => 0,
                    'costo_promedio' => 0,
                    'stock_actual' => 0,
                    'stock_minimo' => 0,
                    'stock_maximo' => 0,
                    'tax_id' => 1,
                    'unidad_medida' => 'UND',
                    'activo' => true,
                    'es_insumo' => true,
                    'requires_recipe' => false,
                    'es_para_nesting' => false,
                ], $base)
            );
        }
    }
}
