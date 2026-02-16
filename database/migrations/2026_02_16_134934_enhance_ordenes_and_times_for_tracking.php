<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Ampliar estados de la orden de venta
        Schema::table('ordenes_venta', function (Blueprint $table) {
            // Cambiamos el tipo de columna estado a string para permitir más flexibilidad sin recurrir a enums rígidos
            $table->string('estado')->default('Borrador')->change();
        });

        // 2. Permitir que los tiempos se vinculen directamente a la orden de venta (para diseño)
        Schema::table('produccion_tiempos', function (Blueprint $table) {
            if (!Schema::hasColumn('produccion_tiempos', 'orden_venta_id')) {
                $table->foreignId('orden_venta_id')->nullable()->constrained('ordenes_venta')->after('orden_produccion_id');
            }
            // Agregamos un campo para saber qué fase se está midiendo
            if (!Schema::hasColumn('produccion_tiempos', 'fase')) {
                $table->string('fase')->nullable()->after('orden_venta_id'); // Ej: 'Diseño', 'Pre-prensa', 'Producción'
            }
        });
    }

    public function down(): void
    {
        Schema::table('produccion_tiempos', function (Blueprint $table) {
            $table->dropForeign(['orden_venta_id']);
            $table->dropColumn(['orden_venta_id', 'fase']);
        });
    }
};
