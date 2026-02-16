<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('procesos', function (Blueprint $table) {
            // Categorización detallada de tecnología de impresión
            $table->enum('categoria_tecnologia', [
                'Sublimación Plotter',
                'Sublimación Inyección',
                'Impresión Láser',
                'Plotter de Corte',
                'UV',
                'Ecosolvente',
                'Látex',
                'Serigrafía',
                'Offset',
                'Otro'
            ])->default('Otro')->after('tipo_maquina');
            
            // Parámetros de nesting/pliegos
            $table->decimal('ancho_maximo_cm', 10, 2)->nullable()->after('categoria_tecnologia');
            $table->decimal('largo_maximo_cm', 10, 2)->nullable()->after('ancho_maximo_cm');
            $table->integer('tiempo_setup_minutos')->default(0)->after('largo_maximo_cm');
            $table->integer('tiempo_estimado_por_unidad')->default(0)->after('tiempo_setup_minutos');
            
            // Configuración de nesting
            $table->boolean('permite_nesting')->default(true)->after('tiempo_estimado_por_unidad');
            $table->decimal('margen_seguridad_cm', 5, 2)->default(1.00)->after('permite_nesting');
        });
    }

    public function down(): void
    {
        Schema::table('procesos', function (Blueprint $table) {
            $table->dropColumn([
                'categoria_tecnologia',
                'ancho_maximo_cm',
                'largo_maximo_cm',
                'tiempo_setup_minutos',
                'tiempo_estimado_por_unidad',
                'permite_nesting',
                'margen_seguridad_cm'
            ]);
        });
    }
};
