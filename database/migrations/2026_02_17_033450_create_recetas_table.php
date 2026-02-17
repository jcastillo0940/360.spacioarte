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
        Schema::create('recetas', function (Blueprint $table) {
            $table->id();
            $table->foreignId('producto_id')->constrained('items')->onDelete('cascade');
            $table->foreignId('insumo_id')->constrained('items')->onDelete('restrict');
            $table->decimal('cantidad', 12, 4); // Permite 0.25, 0.001, etc.
            $table->string('unidad')->default('unidad'); // unidad, pliego, cm, rollo, etc.
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('recetas');
    }
};
