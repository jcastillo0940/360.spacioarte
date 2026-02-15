<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('bank_accounts', function (Blueprint $table) {
            $table->id();
            $table->string('nombre_banco'); // Ej: Banco General
            $table->string('numero_cuenta');
            $table->enum('tipo_cuenta', ['Corriente', 'Ahorros', 'Caja Chica']);
            $table->string('moneda', 3)->default('PAB');
            
            // Relación con el Catálogo Contable (Módulo 3.3)
            $table->foreignId('account_id')->constrained('accounts'); 
            
            // Corregido: La cita debe ser un comentario
            $table->decimal('saldo_actual', 15, 2)->default(0.00); //
            $table->boolean('activo')->default(true);
            $table->timestamps();
        });

        // Tabla para movimientos (Ingresos/Egresos/Transferencias)
        Schema::create('bank_transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('bank_account_id')->constrained('bank_accounts');
            $table->enum('tipo', ['Ingreso', 'Egreso', 'Transferencia']); //
            $table->decimal('monto', 15, 2);
            $table->date('fecha');
            $table->string('referencia')->nullable(); // Num. Cheque o Transferencia
            $table->text('descripcion')->nullable();
            $table->string('categoria_contable')->nullable(); //
            $table->boolean('conciliado')->default(false); //
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bank_transactions');
        Schema::dropIfExists('bank_accounts');
    }
};