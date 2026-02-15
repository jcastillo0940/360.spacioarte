<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('facturas_venta', function (Blueprint $table) {
            $table->id();
            $table->string('numero_factura')->unique(); // Correlativo fiscal
            $table->foreignId('contacto_id')->constrained('contactos'); // Cliente
            $table->foreignId('vendedor_id')->nullable()->constrained('vendedores');
            $table->foreignId('orden_venta_id')->nullable()->constrained('ordenes_venta'); // Vínculo de auditoría
            
            $table->date('fecha_emision');
            $table->date('fecha_vencimiento');
            $table->foreignId('payment_term_id')->constrained('payment_terms');
            
            // Totales fiscales
            $table->decimal('subtotal', 15, 2);
            $table->decimal('itbms_total', 15, 2);
            $table->decimal('total', 15, 2);
            $table->decimal('saldo_pendiente', 15, 2); // Para gestión de cobro
            
            $table->enum('estado', ['Abierta', 'Pagada', 'Anulada'])->default('Abierta');
            $table->timestamps();
        });

        Schema::create('factura_venta_detalles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('factura_venta_id')->constrained('facturas_venta')->onDelete('cascade');
            $table->foreignId('item_id')->constrained('items');
            $table->decimal('cantidad', 15, 2);
            $table->decimal('precio_unitario', 15, 2);
            $table->decimal('porcentaje_itbms', 5, 2);
            $table->decimal('total_item', 15, 2);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('factura_venta_detalles');
        Schema::dropIfExists('facturas_venta');
    }
};