<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('accounts', function (Blueprint $table) {
            $table->id();
            $table->string('codigo')->unique(); // Ej: 1101.01 [cite: 186]
            $table->string('nombre'); // [cite: 186]
            $table->enum('tipo', ['Activo', 'Pasivo', 'Patrimonio', 'Ingreso', 'Costo', 'Gasto', 'Orden']); // [cite: 95, 182]
            $table->foreignId('parent_id')->nullable()->constrained('accounts')->onDelete('cascade');
            $table->boolean('permite_movimiento')->default(true); // Si es cuenta auxiliar o de grupo
            $table->decimal('saldo_inicial', 15, 2)->default(0.00); // [cite: 191]
            $table->text('descripcion')->nullable(); // [cite: 186]
            $table->boolean('activo')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('accounts');
    }
};