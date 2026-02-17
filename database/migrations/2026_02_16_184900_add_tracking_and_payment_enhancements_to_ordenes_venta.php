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
        Schema::table('ordenes_venta', function (Blueprint $table) {
            $table->boolean('cliente_envia_muestra')->default(false)->after('observaciones');
            $table->boolean('cliente_envia_archivo')->default(false)->after('cliente_envia_muestra');
            $table->text('detalle_diseno')->nullable()->after('cliente_envia_archivo');
            $table->string('metodo_pago_referencia')->nullable()->after('metodo_pago_inicial');
        });
    }

    public function down(): void
    {
        Schema::table('ordenes_venta', function (Blueprint $table) {
            $table->dropColumn([
                'cliente_envia_muestra',
                'cliente_envia_archivo',
                'detalle_diseno',
                'metodo_pago_referencia'
            ]);
        });
    }
};
