<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tenant_configs', function (Blueprint $table) {
            // Cuentas para Factoring
            $table->unsignedBigInteger('cta_ingresos_financieros_id')->nullable()
                ->comment('Cuenta de Ingresos Financieros (Descuento de Proveedores)');
            $table->unsignedBigInteger('cta_gastos_financieros_id')->nullable()
                ->comment('Cuenta de Gastos Financieros (Cargo por Factoring Ventas)');
            $table->unsignedBigInteger('cta_cxc_id')->nullable()
                ->comment('Cuenta de Cuentas por Cobrar');
            $table->unsignedBigInteger('cta_cxp_id')->nullable()
                ->comment('Cuenta de Cuentas por Pagar');
            $table->unsignedBigInteger('cta_inventario_id')->nullable()
                ->comment('Cuenta de Inventario');
            $table->unsignedBigInteger('cta_ventas_id')->nullable()
                ->comment('Cuenta de Ingresos por Ventas');
            $table->unsignedBigInteger('cta_itbms_id')->nullable()
                ->comment('Cuenta de ITBMS por Pagar');
            $table->unsignedBigInteger('cta_devoluciones_id')->nullable()
                ->comment('Cuenta de Devoluciones y Bonificaciones');
            $table->unsignedBigInteger('cta_gasto_merma_id')->nullable()
                ->comment('Cuenta de Gasto por Merma');
        });
    }

    public function down(): void
    {
        Schema::table('tenant_configs', function (Blueprint $table) {
            $table->dropColumn([
                'cta_ingresos_financieros_id',
                'cta_gastos_financieros_id',
                'cta_cxc_id',
                'cta_cxp_id',
                'cta_inventario_id',
                'cta_ventas_id',
                'cta_itbms_id',
                'cta_devoluciones_id',
                'cta_gasto_merma_id'
            ]);
        });
    }
};