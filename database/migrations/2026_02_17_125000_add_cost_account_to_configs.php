<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tenant_configs', function (Blueprint $table) {
            $table->unsignedBigInteger('cta_costo_produccion_id')->nullable()->after('cta_recepcion_transitoria_id');
        });
    }

    public function down(): void
    {
        Schema::table('tenant_configs', function (Blueprint $table) {
            $table->dropColumn('cta_costo_produccion_id');
        });
    }
};
