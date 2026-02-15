<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Tabla Principal de la Orden
        Schema::create('ordenes_venta', function (Blueprint $table) {
            $table->id();
            $table->string('numero_orden')->unique(); // Ej: OV-0001
            $table->foreignId('contacto_id')->constrained('contactos'); // Cliente [cite: 196]
            $table->foreignId('vendedor_id')->nullable()->constrained('vendedores'); // Vendedor [cite: 220]
            $table->date('fecha_emision');
            $table->date('fecha_entrega_estimada')->nullable(); //[cite: 204]
            
            // Totales
            $table->decimal('subtotal', 15, 2)->default(0.00);
            $table->decimal('itbms_total', 15, 2)->default(0.00);// [cite: 203]
            $table->decimal('descuento_total', 15, 2)->default(0.00); //[cite: 202]
            $table->decimal('total', 15, 2)->default(0.00);
            
            // Estados del Ciclo [cite: 205]
            $table->enum('estado', [
                'Borrador', 
                'Confirmada', 
                'En Preparación', 
                'Despachada', 
                'Entregada', 
                'Facturada', 
                'Cancelada'
            ])->default('Borrador');

            $table->text('notas_publicas')->nullable();
            $table->text('notas_internas')->nullable();
            $table->timestamps();
        });

        // Detalle de la Orden (Items asociados)
        Schema::create('orden_venta_detalles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('orden_venta_id')->constrained('ordenes_venta')->onDelete('cascade');
            $table->foreignId('item_id')->constrained('items'); //[cite: 197]
            $table->decimal('cantidad', 15, 2);
            $table->decimal('precio_unitario', 15, 2);
            $table->decimal('porcentaje_itbms', 5, 2)->default(7.00);
            $table->decimal('porcentaje_descuento', 5, 2)->default(0.00);
            $table->decimal('subtotal', 15, 2);
            $table->decimal('total', 15, 2);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('orden_venta_detalles');
        Schema::dropIfExists('ordenes_venta');
    }
};