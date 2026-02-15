<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Agregar 'Aplicada' al enum de estado
        DB::statement("ALTER TABLE notas_credito MODIFY COLUMN estado ENUM('Activa', 'Anulada', 'Aplicada') NOT NULL DEFAULT 'Activa'");
        
        // 2. Agregar campo es_merma
        Schema::table('notas_credito', function (Blueprint $table) {
            $table->boolean('es_merma')->default(false)->after('estado')
                ->comment('Si es true, va a gasto por merma en lugar de inventario');
        });

        // 3. Agregar foreign key a contacto_id si no existe
        Schema::table('notas_credito', function (Blueprint $table) {
            $table->foreign('contacto_id')->references('id')->on('contactos')->onDelete('restrict');
        });
    }

    public function down(): void
    {
        Schema::table('notas_credito', function (Blueprint $table) {
            $table->dropForeign(['contacto_id']);
            $table->dropColumn('es_merma');
        });
        
        DB::statement("ALTER TABLE notas_credito MODIFY COLUMN estado ENUM('Activa', 'Anulada') NOT NULL DEFAULT 'Activa'");
    }
};