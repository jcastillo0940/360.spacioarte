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
        Schema::table('produccion_tiempos', function (Blueprint $table) {
            $table->foreignId('orden_produccion_id')->nullable()->change();
            if (!Schema::hasColumn('produccion_tiempos', 'orden_venta_id')) {
                $table->foreignId('orden_venta_id')->nullable()->after('orden_produccion_id');
            }
        });
    }

    public function down(): void
    {
        Schema::table('produccion_tiempos', function (Blueprint $table) {
            $table->foreignId('orden_produccion_id')->nullable(false)->change();
        });
    }
};
