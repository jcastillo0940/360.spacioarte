<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\PosCaja;
use App\Models\Sucursal;

class PosSeeder extends Seeder
{
    public function run(): void
    {
        $sucursal = Sucursal::first();
        
        if ($sucursal) {
            PosCaja::updateOrCreate(
                ['nombre' => 'CAJA PRINCIPAL 01'],
                [
                    'sucursal_id' => $sucursal->id,
                    'activa' => true
                ]
            );
        }
    }
}
