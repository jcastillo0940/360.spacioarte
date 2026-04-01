<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('recibos_pago', function (Blueprint $table) {
            $table->uuid('payment_batch_uuid')->nullable()->after('numero_recibo');
            $table->unsignedInteger('orden_aplicacion')->default(1)->after('payment_batch_uuid');

            $table->index(['payment_batch_uuid', 'orden_aplicacion'], 'recibos_pago_batch_order_idx');
        });
    }

    public function down(): void
    {
        Schema::table('recibos_pago', function (Blueprint $table) {
            $table->dropIndex('recibos_pago_batch_order_idx');
            $table->dropColumn(['payment_batch_uuid', 'orden_aplicacion']);
        });
    }
};
