<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Modificar columnas existentes
        Schema::table('notas_credito', function (Blueprint $table) {
            $table->foreignId('factura_venta_id')->nullable()->change();
            
            // Agregar nuevos campos
            $table->unsignedBigInteger('contacto_id')->nullable()->after('factura_venta_id');
            $table->string('factura_manual_ref')->nullable()->after('contacto_id');
            $table->date('fecha_factura_original')->nullable()->after('factura_manual_ref');
            $table->boolean('es_merma')->default(false)->after('fecha_factura_original')
                ->comment('Si es true, va a gasto por merma en lugar de inventario');
        });

        // 2. Aplicar foreign key y modificar enum de estado
        DB::statement("ALTER TABLE notas_credito MODIFY COLUMN estado ENUM('Activa', 'Anulada', 'Aplicada') NOT NULL DEFAULT 'Activa'");
        
        Schema::table('notas_credito', function (Blueprint $table) {
            $table->foreign('contacto_id')->references('id')->on('contactos')->onDelete('restrict');
        });
    }

    public function down(): void
    {
        Schema::table('notas_credito', function (Blueprint $table) {
            $table->dropForeign(['contacto_id']);
            $table->dropColumn(['contacto_id', 'factura_manual_ref', 'fecha_factura_original', 'es_merma']);
            $table->foreignId('factura_venta_id')->nullable(false)->change();
        });
        
        DB::statement("ALTER TABLE notas_credito MODIFY COLUMN estado ENUM('Activa', 'Anulada') NOT NULL DEFAULT 'Activa'");
    }
};