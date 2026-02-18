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
        Schema::create('asientos', function (Blueprint $table) {
            $table->id();
            $table->dateTime('fecha');
            $table->string('referencia')->nullable();
            $table->string('concepto')->nullable();
            $table->decimal('total_debito', 15, 2)->default(0.00);
            $table->decimal('total_credito', 15, 2)->default(0.00);
            $table->timestamps();
        });

        Schema::create('asiento_detalles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('asiento_id')->constrained('asientos')->onDelete('cascade');
            $table->foreignId('account_id')->constrained('accounts');
            $table->decimal('debito', 15, 2)->default(0.00);
            $table->decimal('credito', 15, 2)->default(0.00);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('asiento_detalles');
        Schema::dropIfExists('asientos');
    }
};
