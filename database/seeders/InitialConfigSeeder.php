<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use App\Models\TenantConfig;
use App\Models\Contacto;
use App\Models\Sucursal;

class InitialConfigSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Impuestos
        DB::table('taxes')->insertOrIgnore([
            [
                'id' => 1,
                'nombre' => 'ITBMS 7%',
                'tasa' => 7.00,
                'codigo_dgi' => '01',
                'es_exento' => false,
                'activo' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id' => 2,
                'nombre' => 'Exento',
                'tasa' => 0.00,
                'codigo_dgi' => '00',
                'es_exento' => true,
                'activo' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]
        ]);

        // 2. Términos de Pago
        DB::table('payment_terms')->insertOrIgnore([
            [
                'id' => 1,
                'nombre' => 'Contado',
                'dias_vencimiento' => 0,
                'activo' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id' => 2,
                'nombre' => 'Crédito 30 días',
                'dias_vencimiento' => 30,
                'activo' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]
        ]);

        // 3. Cliente General
        $contacto = Contacto::updateOrCreate(
            ['id' => 1],
            [
                'razon_social' => 'CONSUMIDOR FINAL',
                'tipo_identificacion' => 'Cedula',
                'identificacion' => '00-00-0000',
                'es_cliente' => true,
                'activo' => true
            ]
        );

        // 4. Sucursal Principal
        $sucursal = Sucursal::updateOrCreate(
            ['codigo' => 'SUC-001'],
            [
                'nombre' => 'CASA MATRIZ',
                'contacto_id' => $contacto->id,
                'activo' => true
            ]
        );

        // 5. Configuración del Sistema
        TenantConfig::updateOrCreate(
            ['id' => 1],
            [
                'razon_social' => '360 SPACIO ARTE',
                'ruc' => '1234567-1-123456',
                'dv' => '00',
                'direccion' => 'Panamá',
                'telefono' => '+507 888-8888',
                'email' => 'info@360spacioarte.com',
                'moneda_principal' => 'USD',
                'itbms_porcentaje' => 7.00,
                'cta_cxc_id' => 6,
                'cta_cxp_id' => 9,
                'cta_inventario_id' => 7,
                'cta_ventas_id' => 12,
                'cta_itbms_id' => 10,
                'cta_devoluciones_id' => 17,
                'cta_gasto_merma_id' => 18,
                'anticipo_minimo_porcentaje' => 50.00
            ]
        );
    }
}
