<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('inventory_movements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('item_id')->constrained('items')->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->dateTime('fecha');
            $table->enum('naturaleza', ['Entrada', 'Salida', 'Ajuste']);
            $table->string('origen', 100);
            $table->unsignedBigInteger('origen_id')->nullable();
            $table->string('referencia', 100)->nullable();
            $table->decimal('cantidad', 18, 4);
            $table->decimal('costo_unitario', 18, 4)->default(0);
            $table->decimal('valor_movimiento', 18, 4)->default(0);
            $table->decimal('stock_anterior', 18, 4)->default(0);
            $table->decimal('stock_posterior', 18, 4)->default(0);
            $table->decimal('costo_promedio_anterior', 18, 4)->default(0);
            $table->decimal('costo_promedio_posterior', 18, 4)->default(0);
            $table->text('observacion')->nullable();
            $table->json('meta')->nullable();
            $table->timestamps();

            $table->index(['item_id', 'fecha']);
            $table->index(['origen', 'origen_id']);
            $table->index('naturaleza');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('inventory_movements');
    }
};
