<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Asegurar que las columnas sean STRING para permitir los nuevos valores
        Schema::table('ordenes_venta', function (Blueprint $table) {
            $table->string('estado')->default('Pendiente')->change();
        });
        
        Schema::table('ordenes_produccion', function (Blueprint $table) {
            $table->string('estado')->default('Pendiente')->change();
        });

        // 2. Mapeo de Ordenes de Venta
        // 'Diseño Aprobado' -> 'Pre-Prensa' (Pasa a Nesting)
        DB::table('ordenes_venta')->where('estado', 'Diseño Aprobado')->update(['estado' => 'Pre-Prensa']);
        
        // 'En Producción', 'En Impresión', 'En Máquina' -> 'Producción'
        DB::table('ordenes_venta')->whereIn('estado', ['En Producción', 'En Impresión', 'En Máquina'])->update(['estado' => 'Producción']);
        
        // 'En Espera de Entrega' -> 'Terminado'
        DB::table('ordenes_venta')->where('estado', 'En Espera de Entrega')->update(['estado' => 'Terminado']);

        // 3. Mapeo de Ordenes de Producción
        // 'En Pliego' -> 'Pre-Prensa'
        DB::table('ordenes_produccion')->where('estado', 'En Pliego')->update(['estado' => 'Pre-Prensa']);
        
        // 'Impreso', 'En Máquina' -> 'Producción'
        DB::table('ordenes_produccion')->whereIn('estado', ['Impreso', 'En Cola', 'En Máquina'])->update(['estado' => 'Producción']);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // No es fácil revertir la unificación sin perder granularidad histórica
    }
};
