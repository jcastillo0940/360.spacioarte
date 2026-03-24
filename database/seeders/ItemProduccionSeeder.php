<?php

namespace Database\Seeders;

use App\Models\FamiliaProduccion;
use App\Models\Item;
use App\Models\Proceso;
use Illuminate\Database\Seeder;

class ItemProduccionSeeder extends Seeder
{
    public function run(): void
    {
        $prensa = Proceso::where('tipo_maquina', 'Sublimacion')->first()
            ?? Proceso::where('tipo_maquina', 'Sublimación')->first();
        $familiaPromo = FamiliaProduccion::where('codigo', 'PROMO')->first();

        $base = Item::updateOrCreate([
            'codigo' => 'MAT-001',
        ], [
            'nombre' => 'Taza Blanca 11oz (Base)',
            'tipo' => 'Materia Prima',
            'precio_venta' => 0,
            'stock_actual' => 500,
            'tax_id' => 1,
            'activo' => true,
        ]);

        Item::updateOrCreate([
            'codigo' => 'PROD-001',
        ], [
            'nombre' => 'Taza Personalizada Full Color',
            'tipo' => 'Producto Terminado',
            'precio_venta' => 5.50,
            'item_base_id' => $base->id,
            'proceso_id' => $prensa?->id,
            'familia_produccion_id' => $familiaPromo?->id,
            'requires_recipe' => true,
            'tax_id' => 1,
            'activo' => true,
        ]);

        Item::updateOrCreate([
            'codigo' => 'CONS-001',
        ], [
            'nombre' => 'Tinta Sublimacion CMYK (Pack)',
            'tipo' => 'Consumible',
            'precio_venta' => 0,
            'stock_actual' => 20,
            'tax_id' => 1,
            'activo' => true,
        ]);
    }
}
