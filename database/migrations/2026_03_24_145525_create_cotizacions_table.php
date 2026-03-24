<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cotizaciones', function (Blueprint $table) {
            $table->id();
            $table->string('numero_cotizacion')->unique();
            $table->unsignedBigInteger('contacto_id');
            $table->unsignedBigInteger('user_id')->nullable();
            $table->string('estado')->default('Borrador'); // Borrador, Emitido, Aprobado, Convertido, Cancelado
            $table->date('fecha_emision')->nullable();
            $table->date('fecha_vencimiento')->nullable();
            $table->decimal('subtotal', 15, 2)->default(0);
            $table->decimal('itbms_total', 15, 2)->default(0);
            $table->decimal('total', 15, 2)->default(0);
            $table->text('notas_internas')->nullable();
            $table->text('terminos_condiciones')->nullable();
            $table->timestamps();

            $table->foreign('contacto_id')->references('id')->on('contactos')->onDelete('cascade');
            $table->foreign('user_id')->references('id')->on('users')->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cotizaciones');
    }
};
