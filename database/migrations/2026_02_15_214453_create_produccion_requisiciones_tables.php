<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Cabecera de la Requisición
        Schema::create('produccion_requisiciones', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users'); // Operador que solicita
            $table->foreignId('jefe_bodega_id')->nullable()->constrained('users'); // Quién autoriza
            $table->enum('estado', ['Pendiente', 'Entregado', 'Rechazado'])->default('Pendiente');
            $table->text('notas_solicitante')->nullable();
            $table->text('notas_bodega')->nullable();
            $table->timestamps();
        });

        // 2. Detalle de items solicitados (Tintas, Solventes, etc.)
        Schema::create('produccion_requisicion_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('requisicion_id')->constrained('produccion_requisiciones')->cascadeOnDelete();
            $table->foreignId('item_id')->constrained('items');
            $table->decimal('cantidad_solicitada', 15, 4);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('produccion_requisicion_items');
        Schema::dropIfExists('produccion_requisiciones');
    }
};