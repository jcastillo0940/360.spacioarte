<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('items', function (Blueprint $table) {
            $table->id();
            $table->string('codigo')->unique(); // [cite: 65]
            $table->string('nombre'); // [cite: 65]
            $table->text('descripcion')->nullable();
            $table->enum('tipo', ['Inventariable', 'Servicio']); // 
            
            // Precios y Costos [cite: 65, 67]
            $table->decimal('precio_venta', 15, 2)->default(0.00);
            $table->decimal('costo_promedio', 15, 2)->default(0.00); 
            
            // Inventario [cite: 71]
            $table->decimal('stock_actual', 15, 2)->default(0.00);
            $table->decimal('stock_minimo', 15, 2)->default(0.00);
            $table->decimal('stock_maximo', 15, 2)->default(0.00);
            
            // Relaciones [cite: 36, 69]
            $table->foreignId('tax_id')->constrained('taxes'); // ITBMS asociado
            $table->string('categoria')->nullable(); 
            $table->string('unidad_medida')->default('Unidad');
            
            $table->boolean('activo')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('items');
    }
};