<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Item;
use App\Models\Proceso;

class ItemProduccionSeeder extends Seeder
{
    public function run(): void
    {
        $prensa = Proceso::where('tipo_maquina', 'Sublimación')->first();

        // 1. Materia Prima
        $base = Item::create([
            'codigo' => 'MAT-001',
            'nombre' => 'Taza Blanca 11oz (Base)',
            'tipo' => 'Materia Prima',
            'precio_venta' => 0,
            'stock_actual' => 500,
            'tax_id' => 1,
            'activo' => true
        ]);

        // 2. Producto Terminado (Viculado a la base y a la máquina)
        Item::create([
            'codigo' => 'PROD-001',
            'nombre' => 'Taza Personalizada Full Color',
            'tipo' => 'Producto Terminado',
            'precio_venta' => 5.50,
            'item_base_id' => $base->id, // Usa la taza blanca
            'proceso_id' => $prensa->id,  // Se hace en la prensa
            'tax_id' => 1,
            'activo' => true
        ]);

        // 3. Consumible (Para Requisiciones)
        Item::create([
            'codigo' => 'CONS-001',
            'nombre' => 'Tinta Sublimación CMYK (Pack)',
            'tipo' => 'Consumible',
            'precio_venta' => 0,
            'stock_actual' => 20,
            'tax_id' => 1,
            'activo' => true
        ]);
    }
}