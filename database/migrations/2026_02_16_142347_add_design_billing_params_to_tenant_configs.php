<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tenant_configs', function (Blueprint $table) {
            // Parámetros de facturación de diseño por tiempo
            $table->decimal('diseno_precio_primera_hora', 10, 2)->default(50.00)->after('max_intentos_diseno');
            $table->decimal('diseno_precio_hora_adicional', 10, 2)->default(35.00)->after('diseno_precio_primera_hora');
            $table->integer('diseno_revisiones_gratuitas')->default(3)->after('diseno_precio_hora_adicional');
            $table->boolean('diseno_cobro_automatico')->default(true)->after('diseno_revisiones_gratuitas');
        });
    }

    public function down(): void
    {
        Schema::table('tenant_configs', function (Blueprint $table) {
            $table->dropColumn([
                'diseno_precio_primera_hora',
                'diseno_precio_hora_adicional',
                'diseno_revisiones_gratuitas',
                'diseno_cobro_automatico'
            ]);
        });
    }
};
