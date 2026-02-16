<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('ordenes_venta', function (Blueprint $table) {
            // Control de aprobación de cobro por diseño
            $table->boolean('diseno_cobro_aprobado')->default(false)->after('diseno_intentos');
            $table->timestamp('diseno_cobro_aprobado_at')->nullable()->after('diseno_cobro_aprobado');
            $table->integer('diseno_minutos_acumulados')->default(0)->after('diseno_cobro_aprobado_at');
            $table->decimal('diseno_monto_calculado', 10, 2)->default(0)->after('diseno_minutos_acumulados');
        });
    }

    public function down(): void
    {
        Schema::table('ordenes_venta', function (Blueprint $table) {
            $table->dropColumn([
                'diseno_cobro_aprobado',
                'diseno_cobro_aprobado_at',
                'diseno_minutos_acumulados',
                'diseno_monto_calculado'
            ]);
        });
    }
};
