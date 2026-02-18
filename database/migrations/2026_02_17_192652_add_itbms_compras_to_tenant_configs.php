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
        Schema::table('tenant_configs', function (Blueprint $table) {
            $table->unsignedBigInteger('cta_itbms_compras_id')->nullable()->after('cta_itbms_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tenant_configs', function (Blueprint $table) {
            $table->dropColumn('cta_itbms_compras_id');
        });
    }
};
