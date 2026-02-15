<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('notas_credito', function (Blueprint $table) {
            $table->id();
            $table->string('numero_nota')->unique(); // Correlativo fiscal
            $table->foreignId('factura_venta_id')->constrained('facturas_venta');
            $table->date('fecha');
            $table->decimal('subtotal', 15, 2);
            $table->decimal('itbms_total', 15, 2);
            $table->decimal('total', 15, 2);
            $table->text('motivo'); // [cite: 349]
            $table->boolean('reintegra_inventario')->default(true);
            $table->timestamps();
        });

        Schema::create('nota_credito_detalles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('nota_credito_id')->constrained('notas_credito')->onDelete('cascade');
            $table->foreignId('item_id')->constrained('items');
            $table->decimal('cantidad', 15, 2);
            $table->decimal('precio_unitario', 15, 2);
            $table->decimal('total_item', 15, 2);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('nota_credito_detalles');
        Schema::dropIfExists('notas_credito');
    }
};