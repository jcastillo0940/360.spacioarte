<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('ordenes_compra', function (Blueprint $table) {
            if (!Schema::hasColumn('ordenes_compra', 'fecha_entrega')) {
                $table->date('fecha_entrega')->nullable()->after('fecha_emision');
            }
        });
    }

    public function down(): void
    {
        Schema::table('ordenes_compra', function (Blueprint $table) {
            if (Schema::hasColumn('ordenes_compra', 'fecha_entrega')) {
                $table->dropColumn('fecha_entrega');
            }
        });
    }
};
