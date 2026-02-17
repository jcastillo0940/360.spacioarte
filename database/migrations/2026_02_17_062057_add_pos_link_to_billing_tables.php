<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Vincular Pagos a la Sesión de POS para arqueo
        Schema::table('recibos_pago', function (Blueprint $table) {
            if (!Schema::hasColumn('recibos_pago', 'pos_sesion_id')) {
                $table->foreignId('pos_sesion_id')->nullable()->constrained('pos_sesiones')->after('factura_venta_id');
            }
        });

        // Vincular Facturas a la Sesión
        Schema::table('facturas_venta', function (Blueprint $table) {
            if (!Schema::hasColumn('facturas_venta', 'pos_sesion_id')) {
                $table->foreignId('pos_sesion_id')->nullable()->constrained('pos_sesiones')->after('orden_venta_id');
            }
        });
    }

    public function down(): void
    {
        Schema::table('facturas_venta', function (Blueprint $table) {
            $table->dropForeign(['pos_sesion_id']);
            $table->dropColumn('pos_sesion_id');
        });

        Schema::table('recibos_pago', function (Blueprint $table) {
            $table->dropForeign(['pos_sesion_id']);
            $table->dropColumn('pos_sesion_id');
        });
    }
};
