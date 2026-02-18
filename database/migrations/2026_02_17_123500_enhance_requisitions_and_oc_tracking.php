<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Mejorar Requisiciones
        DB::statement("ALTER TABLE produccion_requisiciones MODIFY COLUMN estado ENUM('Borrador', 'Pendiente', 'Aprobada', 'Procesada a OC', 'Entregado', 'Rechazado') NOT NULL DEFAULT 'Borrador'");

        Schema::table('produccion_requisicion_items', function (Blueprint $table) {
            $table->foreignId('item_unit_id')->nullable()->after('item_id')->constrained('item_units'); 
            $table->decimal('factor_conversion_usado', 15, 4)->default(1.0000)->after('item_unit_id');
            $table->decimal('cantidad_base_equivalente', 15, 4)->nullable()->after('cantidad_solicitada');
            $table->text('notas')->nullable()->after('cantidad_base_equivalente');
        });

        // 2. Mejorar Órdenes de Compra
        Schema::table('ordenes_compra', function (Blueprint $table) {
            $table->foreignId('requisicion_id')->nullable()->after('contacto_id')->constrained('produccion_requisiciones');
        });

        // 3. Mejorar Detalles de Compra (OC y Factura) para soportar Unidades
        Schema::table('compra_detalles', function (Blueprint $table) {
            $table->foreignId('item_unit_id')->nullable()->after('item_id')->constrained('item_units');
            $table->decimal('factor_conversion_usado', 15, 4)->default(1.0000)->after('item_unit_id');
        });
    }

    public function down(): void
    {
        Schema::table('compra_detalles', function (Blueprint $table) {
            $table->dropForeign(['item_unit_id']);
            $table->dropColumn(['item_unit_id', 'factor_conversion_usado']);
        });

        Schema::table('ordenes_compra', function (Blueprint $table) {
            $table->dropForeign(['requisicion_id']);
            $table->dropColumn('requisicion_id');
        });

        Schema::table('produccion_requisicion_items', function (Blueprint $table) {
            $table->dropForeign(['item_unit_id']);
            $table->dropColumn(['item_unit_id', 'factor_conversion_usado', 'cantidad_base_equivalente', 'notas']);
        });

        DB::statement("ALTER TABLE produccion_requisiciones MODIFY COLUMN estado ENUM('Pendiente', 'Entregado', 'Rechazado') NOT NULL DEFAULT 'Pendiente'");
    }
};
