<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Mejoras en Contactos (Clientes)
        Schema::table('contactos', function (Blueprint $table) {
            $table->boolean('requiere_factura_electronica')->default(false)->after('identificacion');
            $table->string('digito_verificador', 10)->nullable()->after('identificacion');
        });

        // 2. Vincular Vendedores con Usuarios
        Schema::table('vendedores', function (Blueprint $table) {
            $table->foreignId('user_id')->nullable()->constrained('users')->onDelete('set null');
        });

        // 3. Parámetro de Anticipo en Configuración
        Schema::table('tenant_configs', function (Blueprint $table) {
            $table->decimal('anticipo_minimo_porcentaje', 5, 2)->default(50.00);
        });

        // 4. Tracking de Pago en Orden de Venta
        Schema::table('ordenes_venta', function (Blueprint $table) {
            $table->decimal('monto_abonado', 15, 2)->default(0);
            $table->string('metodo_pago_inicial')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('contactos', function (Blueprint $table) {
            $table->dropColumn(['requiere_factura_electronica', 'digito_verificador']);
        });

        Schema::table('vendedores', function (Blueprint $table) {
            $table->dropForeign(['user_id']);
            $table->dropColumn('user_id');
        });

        Schema::table('tenant_configs', function (Blueprint $table) {
            $table->dropColumn('anticipo_minimo_porcentaje');
        });

        Schema::table('ordenes_venta', function (Blueprint $table) {
            $table->dropColumn(['monto_abonado', 'metodo_pago_inicial']);
        });
    }
};
