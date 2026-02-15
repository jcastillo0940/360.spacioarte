<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('vendedores', function (Blueprint $table) {
            $table->id();
            $table->string('nombre_completo'); // [cite: 57]
            $table->string('identificacion')->unique();
            $table->string('telefono')->nullable();
            $table->string('email')->unique();
            $table->string('zona_venta')->nullable(); // [cite: 58]
            $table->decimal('porcentaje_comision', 5, 2)->default(0.00); // [cite: 59]
            $table->decimal('meta_mensual', 12, 2)->default(0.00); // [cite: 60]
            $table->boolean('activo')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('vendedores');
    }
};