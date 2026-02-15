<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Órdenes de Compra [cite: 255]
        Schema::create('ordenes_compra', function (Blueprint $table) {
            $table->id();
            $table->string('numero_orden')->unique();
            $table->foreignId('contacto_id')->constrained('contactos'); // Proveedor [cite: 260]
            $table->date('fecha_emision');
            $table->date('fecha_entrega_estimada')->nullable();
            $table->decimal('total', 15, 2)->default(0.00);
            $table->enum('estado', ['Borrador', 'Enviada', 'Confirmada', 'Recibida Parcial', 'Recibida Total', 'Cancelada'])->default('Borrador');// [cite: 266]
            $table->timestamps();
        });

        // Facturas de Compra (Gastos) [cite: 284]
        Schema::create('facturas_compra', function (Blueprint $table) {
            $table->id();
            $table->string('numero_factura_proveedor'); // El número físico de la factura recibida [cite: 289]
            $table->foreignId('contacto_id')->constrained('contactos');
            $table->foreignId('orden_compra_id')->nullable()->constrained('ordenes_compra');
            $table->date('fecha_emision');
            $table->date('fecha_vencimiento');
            $table->decimal('subtotal', 15, 2);
            $table->decimal('itbms_total', 15, 2);
            $table->decimal('total', 15, 2);
            $table->decimal('saldo_pendiente', 15, 2);
            $table->enum('estado', ['Abierta', 'Pagada', 'Anulada'])->default('Abierta');
            $table->timestamps();
        });

        // Detalle unificado para compras
        Schema::create('compra_detalles', function (Blueprint $table) {
            $table->id();
            $table->morphs('compraable'); // Permite asociar a Orden o Factura
            $table->foreignId('item_id')->constrained('items');
            $table->decimal('cantidad', 15, 2);
            $table->decimal('precio_unitario', 15, 2);
            $table->decimal('total', 15, 2);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('compra_detalles');
        Schema::dropIfExists('facturas_compra');
        Schema::dropIfExists('ordenes_compra');
    }
};