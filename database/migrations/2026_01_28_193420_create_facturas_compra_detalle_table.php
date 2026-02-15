<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('facturas_compra_detalle')) {
            Schema::create('facturas_compra_detalle', function (Blueprint $table) {
                $table->id();
                $table->foreignId('factura_compra_id')->constrained('facturas_compra')->onDelete('cascade');
                $table->foreignId('item_id')->constrained('items')->onDelete('restrict');
                $table->decimal('cantidad', 15, 4);
                $table->decimal('costo_unitario', 15, 2);
                $table->decimal('subtotal', 15, 2);
                $table->decimal('tasa_itbms', 5, 2)->default(0);
                $table->decimal('monto_itbms', 15, 2)->default(0);
                $table->decimal('total', 15, 2);
                $table->timestamps();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('facturas_compra_detalle');
    }
};