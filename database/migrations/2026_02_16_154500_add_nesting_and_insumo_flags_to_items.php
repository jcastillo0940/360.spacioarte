<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('items', function (Blueprint $table) {
            $table->boolean('es_para_nesting')->default(false)->after('margen_seguridad_cm');
            $table->boolean('es_insumo')->default(false)->after('es_para_nesting');
        });
    }

    public function down(): void
    {
        Schema::table('items', function (Blueprint $table) {
            $table->dropColumn(['es_para_nesting', 'es_insumo']);
        });
    }
};
