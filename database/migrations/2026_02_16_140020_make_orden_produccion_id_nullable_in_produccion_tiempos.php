<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('produccion_tiempos', function (Blueprint $table) {
            $table->foreignId('orden_produccion_id')->nullable()->change();
            $table->foreignId('maquina_id')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('produccion_tiempos', function (Blueprint $table) {
            $table->foreignId('orden_produccion_id')->nullable(false)->change();
            $table->foreignId('maquina_id')->nullable(false)->change();
        });
    }
};
