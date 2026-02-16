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
        if (!Schema::hasTable('recepciones_ordenes')) {
            Schema::create('recepciones_ordenes', function (Blueprint $table) {
                $table->id();
                $table->string('numero_recepcion')->unique();
                $table->foreignId('orden_compra_id')->constrained('ordenes_compra');
                $table->foreignId('user_id')->constrained('users');
                $table->timestamp('fecha_recepcion');
                $table->string('tipo')->nullable(); // parcial, completa
                $table->text('observaciones')->nullable();
                $table->string('estado')->default('Completada');
                $table->timestamps();
            });
        }

        if (!Schema::hasTable('recepciones_ordenes_detalles')) {
            Schema::create('recepciones_ordenes_detalles', function (Blueprint $table) {
                $table->id();
                $table->foreignId('recepcion_orden_id')->constrained('recepciones_ordenes')->onDelete('cascade');
                $table->foreignId('item_id')->constrained('items');
                $table->decimal('cantidad_ordenada', 15, 4);
                $table->decimal('cantidad_recibida', 15, 4);
                $table->decimal('costo_unitario', 15, 2);
                $table->timestamps();
            });
        }
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
