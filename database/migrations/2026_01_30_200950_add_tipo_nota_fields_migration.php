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
        // Agregar campos a notas_credito
        Schema::table('notas_credito', function (Blueprint $table) {
            if (!Schema::hasColumn('notas_credito', 'tipo_nota')) {
                $table->enum('tipo_nota', ['devolucion', 'merma', 'descuento'])
                      ->default('devolucion')
                      ->after('fecha')
                      ->comment('Tipo de nota de crédito');
            }
            
            if (!Schema::hasColumn('notas_credito', 'estado')) {
                $table->enum('estado', ['Activa', 'Anulada'])
                      ->default('Activa')
                      ->after('total')
                      ->comment('Estado de la nota de crédito');
            }
        });

        // Agregar campo a nota_credito_detalles
        Schema::table('nota_credito_detalles', function (Blueprint $table) {
            if (!Schema::hasColumn('nota_credito_detalles', 'devuelto_stock')) {
                $table->boolean('devuelto_stock')
                      ->default(true)
                      ->after('total_item')
                      ->comment('Indica si el producto fue devuelto al inventario');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('notas_credito', function (Blueprint $table) {
            $table->dropColumn(['tipo_nota', 'estado']);
        });

        Schema::table('nota_credito_detalles', function (Blueprint $table) {
            $table->dropColumn('devuelto_stock');
        });
    }
};