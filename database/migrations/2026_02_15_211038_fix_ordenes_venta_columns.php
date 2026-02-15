<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('ordenes_venta', function (Blueprint $table) {
            // Solo añadimos si NO existen
            if (!Schema::hasColumn('ordenes_venta', 'tracking_token')) {
                $table->string('tracking_token')->unique()->nullable()->after('estado');
            }
            if (!Schema::hasColumn('ordenes_venta', 'estado_diseno')) {
                $table->enum('estado_diseno', ['Pendiente', 'Aprobado', 'Cambios_Solicitados'])
                      ->default('Pendiente')
                      ->after('tracking_token');
            }
        });
    }

    public function down(): void
    {
        Schema::table('ordenes_venta', function (Blueprint $table) {
            $table->dropColumn(['tracking_token', 'estado_diseno']);
        });
    }
};