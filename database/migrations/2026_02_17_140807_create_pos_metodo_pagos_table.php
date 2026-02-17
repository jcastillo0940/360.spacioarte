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
        Schema::create('pos_metodo_pagos', function (Blueprint $table) {
            $table->id();
            $table->string('nombre'); // Efectivo, Tarjeta, Yappy, Transferencia, etc.
            $table->string('tipo')->default('Efectivo'); // Efectivo, Electronico, Transferencia
            $table->foreignId('bank_account_id')->nullable()->constrained('bank_accounts')->nullOnDelete();
            $table->boolean('activo')->default(true);
            $table->boolean('requiere_referencia')->default(false);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pos_metodo_pagos');
    }
};
