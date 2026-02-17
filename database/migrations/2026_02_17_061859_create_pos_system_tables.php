<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Catálogo de Cajas Físicas o Virtuales
        Schema::create('pos_cajas', function (Blueprint $table) {
            $table->engine = 'InnoDB';
            $table->id();
            $table->string('nombre');
            $table->foreignId('sucursal_id')->constrained('sucursales');
            $table->boolean('activa')->default(true);
            $table->timestamps();
        });

        // 2. Sesiones de Caja (Turnos)
        Schema::create('pos_sesiones', function (Blueprint $table) {
            $table->engine = 'InnoDB';
            $table->id();
            $table->foreignId('caja_id')->constrained('pos_cajas');
            $table->foreignId('user_id')->constrained('users'); // Cajero
            $table->decimal('monto_apertura', 15, 2);
            $table->decimal('monto_cierre', 15, 2)->nullable();
            $table->decimal('monto_esperado_efectivo', 15, 2)->nullable();
            $table->decimal('diferencia', 15, 2)->nullable();
            
            $table->timestamp('fecha_apertura')->nullable(); // Permitir null para evitar líos con timestamps de MySQL
            $table->timestamp('fecha_cierre')->nullable();
            
            $table->enum('estado', ['Abierta', 'Cerrada'])->default('Abierta');
            $table->text('observaciones')->nullable();
            $table->timestamps();
        });

        // 3. Movimientos de Caja (Entradas/Salidas Manuales)
        Schema::create('pos_movimientos', function (Blueprint $table) {
            $table->engine = 'InnoDB';
            $table->id();
            $table->foreignId('pos_sesion_id')->constrained('pos_sesiones');
            $table->enum('tipo', ['Entrada', 'Salida', 'Venta']);
            $table->decimal('monto', 15, 2);
            $table->string('metodo_pago')->default('Efectivo');
            $table->string('concepto');
            $table->string('referencia')->nullable();
            $table->foreignId('user_id')->constrained('users');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pos_movimientos');
        Schema::dropIfExists('pos_sesiones');
        Schema::dropIfExists('pos_cajas');
    }
};
