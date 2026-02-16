<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('items', function (Blueprint $table) {
            // Parámetros para pliegos y nesting
            $table->decimal('ancho_cm', 10, 2)->nullable()->after('unidad_medida')->comment('Ancho material para nesting');
            $table->decimal('largo_cm', 10, 2)->nullable()->after('ancho_cm')->comment('Largo material para nesting');
            $table->boolean('es_rollo')->default(false)->after('largo_cm')->comment('Si es rollo, el largo es variable');
            $table->decimal('margen_seguridad_cm', 10, 2)->default(0.50)->after('es_rollo')->comment('Margen entre piezas');
        });
    }

    public function down(): void
    {
        Schema::table('items', function (Blueprint $table) {
            $table->dropColumn(['ancho_cm', 'largo_cm', 'es_rollo', 'margen_seguridad_cm']);
        });
    }
};
