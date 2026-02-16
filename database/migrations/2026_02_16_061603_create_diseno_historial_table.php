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
        Schema::create('diseno_historial', function (Blueprint $table) {
            $table->id();
            $table->foreignId('orden_venta_id')->constrained('ordenes_venta')->onDelete('cascade');
            $table->string('imagen')->nullable();
            $table->text('comentarios_cliente')->nullable();
            $table->text('comentarios_staff')->nullable();
            $table->string('estado'); // Aprobado, Rechazado, Enviado
            $table->integer('intento')->default(1);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('diseno_historial');
    }
};
