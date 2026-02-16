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
        Schema::table('items', function (Blueprint $table) {
            $table->boolean('requires_recipe')->default(false)->after('es_insumo');
            $table->string('tipo_impresion')->nullable()->after('requires_recipe'); // Sublimación, Láser, Offset, UV, Otros
            $table->decimal('ancho_imprimible', 10, 2)->nullable()->after('tipo_impresion');
            $table->decimal('largo_imprimible', 10, 2)->nullable()->after('ancho_imprimible');
            $table->boolean('permite_rotacion')->default(true)->after('largo_imprimible');
            $table->decimal('separacion_piezas', 10, 2)->default(0.5)->after('permite_rotacion');
            $table->decimal('sangrado', 10, 2)->default(0.3)->after('separacion_piezas');
        });
    }

    public function down(): void
    {
        Schema::table('items', function (Blueprint $table) {
            $table->dropColumn([
                'requires_recipe',
                'tipo_impresion',
                'ancho_imprimible',
                'largo_imprimible',
                'permite_rotacion',
                'separacion_piezas',
                'sangrado'
            ]);
        });
    }
};
