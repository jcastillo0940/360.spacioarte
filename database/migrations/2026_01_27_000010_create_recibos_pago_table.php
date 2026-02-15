<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('recibos_pago', function (Blueprint $table) {
            $table->id();
            $table->string('numero_recibo')->unique(); // Correlativo interno [cite: 254]
            $table->foreignId('factura_venta_id')->constrained('facturas_venta');
            $table->foreignId('bank_account_id')->constrained('bank_accounts'); // Cuenta donde entra el dinero [cite: 88]
            $table->date('fecha_pago');
            $table->decimal('monto_pagado', 15, 2);
            $table->enum('metodo_pago', ['Efectivo', 'Cheque', 'Transferencia', 'Tarjeta', 'Otros']); // [cite: 250]
            $table->string('referencia')->nullable(); // Num de cheque o transferencia
            $table->text('notas')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('recibos_pago');
    }
};