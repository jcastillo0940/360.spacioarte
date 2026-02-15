<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('contactos', function (Blueprint $table) {
            $table->id();
            $table->string('razon_social'); // [cite: 77]
            $table->enum('tipo_identificacion', ['RUC', 'Cedula', 'Pasaporte']); // [cite: 77]
            $table->string('identificacion')->unique(); // [cite: 77]
            $table->string('dv', 2)->nullable(); // Dígito Verificador (Panamá)
            $table->string('direccion')->nullable(); // [cite: 78]
            $table->string('telefono')->nullable(); // [cite: 79]
            $table->string('email')->nullable(); // [cite: 79]
            
            // Clasificación dual 
            $table->boolean('es_cliente')->default(true);
            $table->boolean('es_proveedor')->default(false);
            
            // Finanzas [cite: 80, 81]
            $table->foreignId('payment_term_id')->nullable()->constrained('payment_terms');
            $table->decimal('limite_credito', 15, 2)->default(0.00);
            
            $table->boolean('activo')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('contactos');
    }
};