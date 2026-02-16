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
            if (!Schema::hasColumn('tenant_configs', 'max_intentos_diseno')) {
                $table->integer('max_intentos_diseno')->default(3)->after('mostrar_valores_letras');
            }
        });
    }

    public function down(): void
    {
        Schema::table('tenant_configs', function (Blueprint $table) {
            $table->dropColumn('max_intentos_diseno');
        });
    }
};
