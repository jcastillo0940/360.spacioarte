<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ordenes_compra_detalle', function (Blueprint $table) {
            $table->id();
            $table->foreignId('orden_compra_id')->constrained('ordenes_compra')->onDelete('cascade');
            $table->foreignId('item_id')->constrained('items')->onDelete('restrict');
            $table->decimal('cantidad', 15, 4);
            $table->decimal('costo_unitario', 15, 2);
            $table->decimal('total', 15, 2);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ordenes_compra_detalle');
    }
};