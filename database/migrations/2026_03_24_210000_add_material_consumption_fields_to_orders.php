<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orden_venta_detalles', function (Blueprint $table) {
            $table->boolean('usa_material_completo')->default(false)->after('material_id');
            $table->string('tipo_calculo_material', 30)->nullable()->after('usa_material_completo');
            $table->decimal('cantidad_material_calculada', 12, 4)->nullable()->after('tipo_calculo_material');
            $table->decimal('largo_material_calculado_cm', 12, 4)->nullable()->after('cantidad_material_calculada');
            $table->string('unidad_consumo_material', 20)->nullable()->after('largo_material_calculado_cm');
        });

        Schema::table('ordenes_produccion', function (Blueprint $table) {
            $table->boolean('usa_material_completo')->default(false)->after('materia_prima_id');
            $table->string('tipo_calculo_material', 30)->nullable()->after('usa_material_completo');
            $table->decimal('cantidad_material_calculada', 12, 4)->nullable()->after('tipo_calculo_material');
            $table->decimal('largo_material_calculado_cm', 12, 4)->nullable()->after('cantidad_material_calculada');
            $table->string('unidad_consumo_material', 20)->nullable()->after('largo_material_calculado_cm');
        });
    }

    public function down(): void
    {
        Schema::table('ordenes_produccion', function (Blueprint $table) {
            $table->dropColumn([
                'usa_material_completo',
                'tipo_calculo_material',
                'cantidad_material_calculada',
                'largo_material_calculado_cm',
                'unidad_consumo_material',
            ]);
        });

        Schema::table('orden_venta_detalles', function (Blueprint $table) {
            $table->dropColumn([
                'usa_material_completo',
                'tipo_calculo_material',
                'cantidad_material_calculada',
                'largo_material_calculado_cm',
                'unidad_consumo_material',
            ]);
        });
    }
};
