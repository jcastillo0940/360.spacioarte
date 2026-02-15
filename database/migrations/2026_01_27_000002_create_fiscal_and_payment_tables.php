<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Tabla para Impuestos (ITBMS, etc.)
        Schema::create('taxes', function (Blueprint $table) {
            $table->id();
            $table->string('nombre'); 
            $table->decimal('tasa', 5, 2); 
            $table->string('codigo_dgi')->nullable(); // Para cumplimiento fiscal
            $table->boolean('es_exento')->default(false); // Corregido
            $table->boolean('activo')->default(true);
            $table->timestamps();
        });

        // Tabla para Términos de Pago
        Schema::create('payment_terms', function (Blueprint $table) {
            $table->id();
            $table->string('nombre'); 
            $table->integer('dias_vencimiento')->default(0); // Corregido
            $table->boolean('activo')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payment_terms');
        Schema::dropIfExists('taxes');
    }
};