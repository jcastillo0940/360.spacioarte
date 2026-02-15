<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Ampliamos el enum de tipo en items para soportar la filosofía del SRS
        // Usamos una consulta cruda porque Doctrine (el motor de migraciones) a veces falla con ENUMs
        DB::statement("ALTER TABLE items MODIFY COLUMN tipo ENUM('Inventariable', 'Servicio', 'Materia Prima', 'Producto Terminado', 'Consumible') NOT NULL");

        Schema::table('items', function (Blueprint $table) {
            // ID del proceso/máquina por defecto para este producto (Receta simple)
            if (!Schema::hasColumn('items', 'proceso_id')) {
                $table->unsignedBigInteger('proceso_id')->nullable()->after('tax_id');
            }
            // Para productos terminados, referencia a su materia prima base
            if (!Schema::hasColumn('items', 'item_base_id')) {
                $table->unsignedBigInteger('item_base_id')->nullable()->after('proceso_id');
            }
        });
    }

    public function down(): void
    {
        Schema::table('items', function (Blueprint $table) {
            $table->dropColumn(['proceso_id', 'item_base_id']);
        });
        DB::statement("ALTER TABLE items MODIFY COLUMN tipo ENUM('Inventariable', 'Servicio') NOT NULL");
    }
};