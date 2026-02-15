<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('egresos', function (Blueprint $table) {
            $table->id();
            $table->string('numero_egreso')->unique();
            $table->foreignId('factura_compra_id')->constrained('facturas_compra');
            $table->foreignId('bank_account_id')->constrained('bank_accounts');
            $table->date('fecha_pago');
            $table->decimal('monto_pagado', 15, 2);
            $table->string('metodo_pago'); // Transferencia, Cheque, etc.
            $table->string('referencia')->nullable();
            $table->text('notas')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('egresos');
    }
};