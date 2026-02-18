<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Account;
use Illuminate\Support\Facades\DB;

class ChartOfAccountsPanamaSeeder extends Seeder
{
    public function run()
    {
        // Desactivar claves foráneas para poder limpiar
        DB::statement('SET FOREIGN_KEY_CHECKS=0;');
        Account::truncate();
        DB::statement('SET FOREIGN_KEY_CHECKS=1;');

        $cuentas = [
            // 1. ACTIVOS
            ['codigo' => '1', 'nombre' => 'ACTIVOS', 'tipo' => 'Activo', 'permite_movimiento' => false],
            ['codigo' => '1.1', 'nombre' => 'Activo Corriente', 'tipo' => 'Activo', 'parent_codigo' => '1', 'permite_movimiento' => false],
            ['codigo' => '1.1.01', 'nombre' => 'Caja General', 'tipo' => 'Activo', 'parent_codigo' => '1.1', 'permite_movimiento' => true],
            ['codigo' => '1.1.02', 'nombre' => 'Caja Menuda (Caja Chica)', 'tipo' => 'Activo', 'parent_codigo' => '1.1', 'permite_movimiento' => true],
            ['codigo' => '1.1.05', 'nombre' => 'Banco General (Moneda Local)', 'tipo' => 'Activo', 'parent_codigo' => '1.1', 'permite_movimiento' => true],
            ['codigo' => '1.1.06', 'nombre' => 'Otros Bancos', 'tipo' => 'Activo', 'parent_codigo' => '1.1', 'permite_movimiento' => true],
            ['codigo' => '1.1.20', 'nombre' => 'Cuentas por Cobrar Clientes', 'tipo' => 'Activo', 'parent_codigo' => '1.1', 'permite_movimiento' => true],
            ['codigo' => '1.1.25', 'nombre' => 'Cuentas por Cobrar Empleados', 'tipo' => 'Activo', 'parent_codigo' => '1.1', 'permite_movimiento' => true],
            ['codigo' => '1.1.30', 'nombre' => 'Inventario de Mercancía', 'tipo' => 'Activo', 'parent_codigo' => '1.1', 'permite_movimiento' => true],
            ['codigo' => '1.1.40', 'nombre' => 'Crédito Fiscal ITBMS (Compras/Gastos)', 'tipo' => 'Activo', 'parent_codigo' => '1.1', 'permite_movimiento' => true],
            ['codigo' => '1.1.45', 'nombre' => 'Anticipo de Impuesto sobre la Renta (AMIR)', 'tipo' => 'Activo', 'parent_codigo' => '1.1', 'permite_movimiento' => true],
            ['codigo' => '1.1.50', 'nombre' => 'Anticipo a Proveedores', 'tipo' => 'Activo', 'parent_codigo' => '1.1', 'permite_movimiento' => true],
            
            ['codigo' => '1.2', 'nombre' => 'Activo No Corriente (Propiedad, Planta y Equipo)', 'tipo' => 'Activo', 'parent_codigo' => '1', 'permite_movimiento' => false],
            ['codigo' => '1.2.01', 'nombre' => 'Terrenos', 'tipo' => 'Activo', 'parent_codigo' => '1.2', 'permite_movimiento' => true],
            ['codigo' => '1.2.05', 'nombre' => 'Edificios y Mejoras', 'tipo' => 'Activo', 'parent_codigo' => '1.2', 'permite_movimiento' => true],
            ['codigo' => '1.2.10', 'nombre' => 'Mobiliario y Equipo de Oficina', 'tipo' => 'Activo', 'parent_codigo' => '1.2', 'permite_movimiento' => true],
            ['codigo' => '1.2.15', 'nombre' => 'Equipo de Cómputo', 'tipo' => 'Activo', 'parent_codigo' => '1.2', 'permite_movimiento' => true],
            ['codigo' => '1.2.20', 'nombre' => 'Equipo Rodante (Vehículos)', 'tipo' => 'Activo', 'parent_codigo' => '1.2', 'permite_movimiento' => true],
            ['codigo' => '1.2.25', 'nombre' => 'Depreciación Acumulada', 'tipo' => 'Activo', 'parent_codigo' => '1.2', 'permite_movimiento' => true],
            ['codigo' => '1.2.40', 'nombre' => 'Depósitos de Garantía', 'tipo' => 'Activo', 'parent_codigo' => '1.2', 'permite_movimiento' => true],

            // 2. PASIVOS
            ['codigo' => '2', 'nombre' => 'PASIVOS', 'tipo' => 'Pasivo', 'permite_movimiento' => false],
            ['codigo' => '2.1', 'nombre' => 'Pasivo Corriente (Corto Plazo)', 'tipo' => 'Pasivo', 'parent_codigo' => '2', 'permite_movimiento' => false],
            ['codigo' => '2.1.01', 'nombre' => 'Proveedores Locales', 'tipo' => 'Pasivo', 'parent_codigo' => '2.1', 'permite_movimiento' => true],
            ['codigo' => '2.1.02', 'nombre' => 'Proveedores del Exterior', 'tipo' => 'Pasivo', 'parent_codigo' => '2.1', 'permite_movimiento' => true],
            ['codigo' => '2.1.05', 'nombre' => 'Acreedores Varios', 'tipo' => 'Pasivo', 'parent_codigo' => '2.1', 'permite_movimiento' => true],
            ['codigo' => '2.1.10', 'nombre' => 'ITBMS por Pagar (Tesoro Nacional - Ventas)', 'tipo' => 'Pasivo', 'parent_codigo' => '2.1', 'permite_movimiento' => true],
            ['codigo' => '2.1.15', 'nombre' => 'Retención ITBMS por Pagar', 'tipo' => 'Pasivo', 'parent_codigo' => '2.1', 'permite_movimiento' => true],
            ['codigo' => '2.1.20', 'nombre' => 'Retención ISR Salarios (Planilla)', 'tipo' => 'Pasivo', 'parent_codigo' => '2.1', 'permite_movimiento' => true],
            ['codigo' => '2.1.21', 'nombre' => 'Retención ISR Servicios Profesionales', 'tipo' => 'Pasivo', 'parent_codigo' => '2.1', 'permite_movimiento' => true],
            ['codigo' => '2.1.25', 'nombre' => 'CSS Cuota Obrero-Patronal por Pagar', 'tipo' => 'Pasivo', 'parent_codigo' => '2.1', 'permite_movimiento' => true],
            ['codigo' => '2.1.26', 'nombre' => 'Seguro Educativo por Pagar', 'tipo' => 'Pasivo', 'parent_codigo' => '2.1', 'permite_movimiento' => true],
            ['codigo' => '2.1.27', 'nombre' => 'Riesgos Profesionales por Pagar', 'tipo' => 'Pasivo', 'parent_codigo' => '2.1', 'permite_movimiento' => true],
            ['codigo' => '2.1.30', 'nombre' => 'Salarios por Pagar', 'tipo' => 'Pasivo', 'parent_codigo' => '2.1', 'permite_movimiento' => true],
            ['codigo' => '2.1.35', 'nombre' => 'Provisión Décimo Tercer Mes (XIII Mes)', 'tipo' => 'Pasivo', 'parent_codigo' => '2.1', 'permite_movimiento' => true],
            ['codigo' => '2.1.36', 'nombre' => 'Provisión Vacaciones', 'tipo' => 'Pasivo', 'parent_codigo' => '2.1', 'permite_movimiento' => true],
            ['codigo' => '2.1.37', 'nombre' => 'Provisión Prima de Antigüedad', 'tipo' => 'Pasivo', 'parent_codigo' => '2.1', 'permite_movimiento' => true],
            ['codigo' => '2.1.40', 'nombre' => 'Dividendos por Pagar', 'tipo' => 'Pasivo', 'parent_codigo' => '2.1', 'permite_movimiento' => true],

            ['codigo' => '2.2', 'nombre' => 'Pasivo No Corriente (Largo Plazo)', 'tipo' => 'Pasivo', 'parent_codigo' => '2', 'permite_movimiento' => false],
            ['codigo' => '2.2.01', 'nombre' => 'Préstamos Bancarios LP', 'tipo' => 'Pasivo', 'parent_codigo' => '2.2', 'permite_movimiento' => true],
            ['codigo' => '2.2.10', 'nombre' => 'Cuentas por Pagar Accionistas', 'tipo' => 'Pasivo', 'parent_codigo' => '2.2', 'permite_movimiento' => true],

            // 3. PATRIMONIO
            ['codigo' => '3', 'nombre' => 'PATRIMONIO', 'tipo' => 'Patrimonio', 'permite_movimiento' => false],
            ['codigo' => '3.1.01', 'nombre' => 'Capital Social (Acciones Comunes)', 'tipo' => 'Patrimonio', 'parent_codigo' => '3', 'permite_movimiento' => true],
            ['codigo' => '3.1.05', 'nombre' => 'Utilidades Retenidas (Acumuladas)', 'tipo' => 'Patrimonio', 'parent_codigo' => '3', 'permite_movimiento' => true],
            ['codigo' => '3.1.10', 'nombre' => 'Resultado del Periodo (Utilidad/Pérdida Actual)', 'tipo' => 'Patrimonio', 'parent_codigo' => '3', 'permite_movimiento' => true],

            // 4. INGRESOS
            ['codigo' => '4', 'nombre' => 'INGRESOS', 'tipo' => 'Ingreso', 'permite_movimiento' => false],
            ['codigo' => '4.1.01', 'nombre' => 'Ventas Gravadas 7% (Bienes y Servicios)', 'tipo' => 'Ingreso', 'parent_codigo' => '4', 'permite_movimiento' => true],
            ['codigo' => '4.1.02', 'nombre' => 'Ventas Exentas', 'tipo' => 'Ingreso', 'parent_codigo' => '4', 'permite_movimiento' => true],
            ['codigo' => '4.1.03', 'nombre' => 'Ventas Exportación (Tasa 0%)', 'tipo' => 'Ingreso', 'parent_codigo' => '4', 'permite_movimiento' => true],
            ['codigo' => '4.1.05', 'nombre' => 'Devoluciones y Descuentos en Ventas', 'tipo' => 'Ingreso', 'parent_codigo' => '4', 'permite_movimiento' => true],
            ['codigo' => '4.2.01', 'nombre' => 'Otros Ingresos', 'tipo' => 'Ingreso', 'parent_codigo' => '4', 'permite_movimiento' => true],

            // 5. COSTOS
            ['codigo' => '5', 'nombre' => 'COSTOS', 'tipo' => 'Costo', 'permite_movimiento' => false],
            ['codigo' => '5.1.01', 'nombre' => 'Costo de Ventas', 'tipo' => 'Costo', 'parent_codigo' => '5', 'permite_movimiento' => true],
            ['codigo' => '5.1.05', 'nombre' => 'Compras de Mercancía Locales', 'tipo' => 'Costo', 'parent_codigo' => '5', 'permite_movimiento' => true],
            ['codigo' => '5.1.06', 'nombre' => 'Importaciones (Compras Exterior)', 'tipo' => 'Costo', 'parent_codigo' => '5', 'permite_movimiento' => true],
            ['codigo' => '5.1.10', 'nombre' => 'Fletes y Acarreos en Compras', 'tipo' => 'Costo', 'parent_codigo' => '5', 'permite_movimiento' => true],
            ['codigo' => '5.1.15', 'nombre' => 'Liquidación de Aduanas', 'tipo' => 'Costo', 'parent_codigo' => '5', 'permite_movimiento' => true],

            // 6. GASTOS OPERATIVOS
            ['codigo' => '6', 'nombre' => 'GASTOS OPERATIVOS', 'tipo' => 'Gasto', 'permite_movimiento' => false],
            ['codigo' => '6.1', 'nombre' => 'Gastos de Personal (Planilla)', 'tipo' => 'Gasto', 'parent_codigo' => '6', 'permite_movimiento' => false],
            ['codigo' => '6.1.01', 'nombre' => 'Salarios y Jornales', 'tipo' => 'Gasto', 'parent_codigo' => '6.1', 'permite_movimiento' => true],
            ['codigo' => '6.1.02', 'nombre' => 'Horas Extras', 'tipo' => 'Gasto', 'parent_codigo' => '6.1', 'permite_movimiento' => true],
            ['codigo' => '6.1.03', 'nombre' => 'Gasto Décimo Tercer Mes (XIII Mes)', 'tipo' => 'Gasto', 'parent_codigo' => '6.1', 'permite_movimiento' => true],
            ['codigo' => '6.1.04', 'nombre' => 'Gasto Vacaciones', 'tipo' => 'Gasto', 'parent_codigo' => '6.1', 'permite_movimiento' => true],
            ['codigo' => '6.1.05', 'nombre' => 'Cuota Patronal CSS (12.25%)', 'tipo' => 'Gasto', 'parent_codigo' => '6.1', 'permite_movimiento' => true],
            ['codigo' => '6.1.06', 'nombre' => 'Gasto Seguro Educativo Patronal (1.50%)', 'tipo' => 'Gasto', 'parent_codigo' => '6.1', 'permite_movimiento' => true],
            ['codigo' => '6.1.07', 'nombre' => 'Gasto Riesgos Profesionales', 'tipo' => 'Gasto', 'parent_codigo' => '6.1', 'permite_movimiento' => true],
            ['codigo' => '6.1.08', 'nombre' => 'Gasto Prima de Antigüedad', 'tipo' => 'Gasto', 'parent_codigo' => '6.1', 'permite_movimiento' => true],
            ['codigo' => '6.1.09', 'nombre' => 'Indemnizaciones Laborales', 'tipo' => 'Gasto', 'parent_codigo' => '6.1', 'permite_movimiento' => true],

            ['codigo' => '6.2', 'nombre' => 'Gastos Generales y Administrativos', 'tipo' => 'Gasto', 'parent_codigo' => '6', 'permite_movimiento' => false],
            ['codigo' => '6.2.01', 'nombre' => 'Alquileres de Local/Oficina', 'tipo' => 'Gasto', 'parent_codigo' => '6.2', 'permite_movimiento' => true],
            ['codigo' => '6.2.02', 'nombre' => 'Electricidad y Agua', 'tipo' => 'Gasto', 'parent_codigo' => '6.2', 'permite_movimiento' => true],
            ['codigo' => '6.2.03', 'nombre' => 'Telecomunicaciones', 'tipo' => 'Gasto', 'parent_codigo' => '6.2', 'permite_movimiento' => true],
            ['codigo' => '6.2.04', 'nombre' => 'Honorarios Profesionales', 'tipo' => 'Gasto', 'parent_codigo' => '6.2', 'permite_movimiento' => true],
            ['codigo' => '6.2.05', 'nombre' => 'Mantenimiento y Reparaciones', 'tipo' => 'Gasto', 'parent_codigo' => '6.2', 'permite_movimiento' => true],
            ['codigo' => '6.2.06', 'nombre' => 'Suministros de Oficina', 'tipo' => 'Gasto', 'parent_codigo' => '6.2', 'permite_movimiento' => true],
            ['codigo' => '6.2.07', 'nombre' => 'Atenciones a Clientes y Empleados', 'tipo' => 'Gasto', 'parent_codigo' => '6.2', 'permite_movimiento' => true],
            ['codigo' => '6.2.08', 'nombre' => 'Seguros y Fianzas', 'tipo' => 'Gasto', 'parent_codigo' => '6.2', 'permite_movimiento' => true],
            ['codigo' => '6.2.09', 'nombre' => 'Gastos de Viaje y Representación', 'tipo' => 'Gasto', 'parent_codigo' => '6.2', 'permite_movimiento' => true],
            ['codigo' => '6.2.10', 'nombre' => 'Combustible y Lubricantes', 'tipo' => 'Gasto', 'parent_codigo' => '6.2', 'permite_movimiento' => true],
            ['codigo' => '6.2.11', 'nombre' => 'Publicidad y Propaganda', 'tipo' => 'Gasto', 'parent_codigo' => '6.2', 'permite_movimiento' => true],
            ['codigo' => '6.2.15', 'nombre' => 'Gastos Bancarios', 'tipo' => 'Gasto', 'parent_codigo' => '6.2', 'permite_movimiento' => true],
            ['codigo' => '6.2.20', 'nombre' => 'Depreciación Activos Fijos', 'tipo' => 'Gasto', 'parent_codigo' => '6.2', 'permite_movimiento' => true],

            ['codigo' => '6.3', 'nombre' => 'Impuestos y Tasas (Gastos)', 'tipo' => 'Gasto', 'parent_codigo' => '6', 'permite_movimiento' => false],
            ['codigo' => '6.3.01', 'nombre' => 'Impuesto de Aviso de Operación', 'tipo' => 'Gasto', 'parent_codigo' => '6.3', 'permite_movimiento' => true],
            ['codigo' => '6.3.02', 'nombre' => 'Impuestos Municipales', 'tipo' => 'Gasto', 'parent_codigo' => '6.3', 'permite_movimiento' => true],
            ['codigo' => '6.3.03', 'nombre' => 'Tasa Única Anual', 'tipo' => 'Gasto', 'parent_codigo' => '6.3', 'permite_movimiento' => true],
            ['codigo' => '6.3.04', 'nombre' => 'ITBMS Gasto (No deducible)', 'tipo' => 'Gasto', 'parent_codigo' => '6.3', 'permite_movimiento' => true],
        ];

        foreach ($cuentas as $c) {
            $parentId = null;
            if (isset($c['parent_codigo'])) {
                $parent = Account::where('codigo', $c['parent_codigo'])->first();
                $parentId = $parent ? $parent->id : null;
            }

            Account::create([
                'codigo' => $c['codigo'],
                'nombre' => $c['nombre'],
                'tipo' => $c['tipo'],
                'parent_id' => $parentId,
                'permite_movimiento' => $c['permite_movimiento'],
                'activo' => true
            ]);
        }
    }
}
