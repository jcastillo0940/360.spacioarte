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
        // Tabla de recepciones de órdenes de compra
        Schema::create('recepciones_ordenes', function (Blueprint $table) {
            $table->id();
            $table->string('numero_recepcion', 50)->unique();
            $table->unsignedBigInteger('orden_compra_id');
            $table->unsignedBigInteger('user_id'); // Usuario/Vendedor que recibe
            $table->dateTime('fecha_recepcion');
            $table->enum('tipo', ['parcial', 'completa'])->default('parcial');
            $table->text('observaciones')->nullable();
            $table->enum('estado', ['Completada', 'Cancelada'])->default('Completada');
            $table->timestamps();

            // Foreign keys
            $table->foreign('orden_compra_id')->references('id')->on('ordenes_compra')->onDelete('cascade');
            $table->foreign('user_id')->references('id')->on('users')->onDelete('restrict');

            // Índices
            $table->index('fecha_recepcion');
            $table->index('estado');
        });

        // Tabla de detalles de recepción
        Schema::create('recepciones_ordenes_detalles', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('recepcion_orden_id');
            $table->unsignedBigInteger('item_id');
            $table->decimal('cantidad_ordenada', 15, 4); // Para referencia
            $table->decimal('cantidad_recibida', 15, 4);
            $table->decimal('costo_unitario', 15, 4);
            $table->timestamps();

            // Foreign keys
            $table->foreign('recepcion_orden_id')->references('id')->on('recepciones_ordenes')->onDelete('cascade');
            $table->foreign('item_id')->references('id')->on('items')->onDelete('restrict');

            // Índices
            $table->index(['recepcion_orden_id', 'item_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('recepciones_ordenes_detalles');
        Schema::dropIfExists('recepciones_ordenes');
    }
};
