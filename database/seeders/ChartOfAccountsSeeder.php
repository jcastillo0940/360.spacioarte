<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Account;

class ChartOfAccountsSeeder extends Seeder
{
    public function run(): void
    {
        // 1. ACTIVOS [cite: 107]
        $activo = Account::create(['codigo' => '1', 'nombre' => 'ACTIVOS', 'tipo' => 'Activo', 'permite_movimiento' => false]);
        
        // Corrientes [cite: 108, 109]
        $caja = Account::create(['codigo' => '11', 'nombre' => 'Efectivo y Equivalentes', 'tipo' => 'Activo', 'parent_id' => $activo->id, 'permite_movimiento' => false]);
        Account::create(['codigo' => '1101', 'nombre' => 'Caja General', 'tipo' => 'Activo', 'parent_id' => $caja->id]);
        Account::create(['codigo' => '1102', 'nombre' => 'Bancos', 'tipo' => 'Activo', 'parent_id' => $caja->id]);

        // Deudores [cite: 110]
        $deudores = Account::create(['codigo' => '12', 'nombre' => 'Deudores Comerciales', 'tipo' => 'Activo', 'parent_id' => $activo->id, 'permite_movimiento' => false]);
        Account::create(['codigo' => '1201', 'nombre' => 'Clientes Nacionales', 'tipo' => 'Activo', 'parent_id' => $deudores->id]);
        
        // Inventarios [cite: 117]
        Account::create(['codigo' => '13', 'nombre' => 'Inventario de Mercancías', 'tipo' => 'Activo', 'parent_id' => $activo->id]);

        // 2. PASIVOS [cite: 122, 123]
        $pasivo = Account::create(['codigo' => '2', 'nombre' => 'PASIVOS', 'tipo' => 'Pasivo', 'permite_movimiento' => false]);
        Account::create(['codigo' => '2101', 'nombre' => 'Cuentas por Pagar Proveedores', 'tipo' => 'Pasivo', 'parent_id' => $pasivo->id]);
        Account::create(['codigo' => '2102', 'nombre' => 'ITBMS por Pagar', 'tipo' => 'Pasivo', 'parent_id' => $pasivo->id]); // [cite: 129]

        // 4. INGRESOS [cite: 139, 140]
        $ingresos = Account::create(['codigo' => '4', 'nombre' => 'INGRESOS', 'tipo' => 'Ingreso', 'permite_movimiento' => false]);
        Account::create(['codigo' => '4101', 'nombre' => 'Ventas Gravadas (ITBMS 7%)', 'tipo' => 'Ingreso', 'parent_id' => $ingresos->id]); // [cite: 141]
        Account::create(['codigo' => '4102', 'nombre' => 'Ventas Exentas', 'tipo' => 'Ingreso', 'parent_id' => $ingresos->id]); // [cite: 143]

        // 5. COSTOS Y 6. GASTOS [cite: 148, 155]
        $gastos = Account::create(['codigo' => '6', 'nombre' => 'GASTOS', 'tipo' => 'Gasto', 'permite_movimiento' => false]);
        Account::create(['codigo' => '6101', 'nombre' => 'Sueldos y Salarios', 'tipo' => 'Gasto', 'parent_id' => $gastos->id]); // [cite: 157]
        Account::create(['codigo' => '6102', 'nombre' => 'Servicios Públicos', 'tipo' => 'Gasto', 'parent_id' => $gastos->id]); // [cite: 163]
    }
}