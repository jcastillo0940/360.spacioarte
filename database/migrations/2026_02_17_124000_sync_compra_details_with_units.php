<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Actualizar Detalles de Orden de Compra
        Schema::table('ordenes_compra_detalle', function (Blueprint $table) {
            $table->foreignId('item_unit_id')->nullable()->after('item_id')->constrained('item_units');
            $table->decimal('factor_conversion_usado', 15, 4)->default(1.0000)->after('item_unit_id');
        });

        // 2. Actualizar Detalles de Factura de Compra
        Schema::table('facturas_compra_detalle', function (Blueprint $table) {
            $table->foreignId('item_unit_id')->nullable()->after('item_id')->constrained('item_units');
            $table->decimal('factor_conversion_usado', 15, 4)->default(1.0000)->after('item_unit_id');
        });
    }

    public function down(): void
    {
        Schema::table('facturas_compra_detalle', function (Blueprint $table) {
            $table->dropForeign(['item_unit_id']);
            $table->dropColumn(['item_unit_id', 'factor_conversion_usado']);
        });

        Schema::table('ordenes_compra_detalle', function (Blueprint $table) {
            $table->dropForeign(['item_unit_id']);
            $table->dropColumn(['item_unit_id', 'factor_conversion_usado']);
        });
    }
};
