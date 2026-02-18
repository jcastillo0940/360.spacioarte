<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Tabla de Unidades de Medida Especializadas
        Schema::create('item_units', function (Blueprint $table) {
            $table->id();
            $table->foreignId('item_id')->constrained('items')->cascadeOnDelete();
            $table->string('nombre'); // Ej: Paquete 100
            $table->decimal('factor_conversion', 15, 4); // Multiplicador a Unidad Base
            $table->boolean('es_unidad_compra')->default(true);
            $table->boolean('activo')->default(true);
            $table->timestamps();
        });

        // 2. Campo para Cuenta Puente en Configuración
        Schema::table('tenant_configs', function (Blueprint $table) {
            $table->unsignedBigInteger('cta_recepcion_transitoria_id')->nullable()->after('cta_cxp_id')
                ->comment('Cuenta de Pasivo Transitoria (Puente de Recepciones por Facturar)');
        });

        // 3. Agregar tracking de recepciones
        Schema::create('compras_recepciones', function (Blueprint $table) {
            $table->id();
            $table->string('numero_recepcion')->unique();
            $table->foreignId('orden_compra_id')->nullable()->constrained('ordenes_compra');
            $table->foreignId('contacto_id')->constrained('contactos'); // Proveedor
            $table->date('fecha_recepcion');
            $table->text('notas')->nullable();
            $table->enum('estado', ['Pendiente', 'Facturado', 'Anulado'])->default('Pendiente');
            $table->timestamps();
        });

        Schema::create('compras_recepcion_detalles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('recepcion_id')->constrained('compras_recepciones')->cascadeOnDelete();
            $table->foreignId('item_id')->constrained('items');
            $table->foreignId('item_unit_id')->nullable()->constrained('item_units'); // Unidad de Compra usada
            $table->decimal('cantidad_recibida_um_compra', 15, 2); 
            $table->decimal('factor_conversion_usado', 15, 4);
            $table->decimal('cantidad_recepcionada_um_base', 15, 2); // Resultante en Kardex
            $table->decimal('costo_unitario_um_compra', 15, 4)->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('compras_recepcion_detalles');
        Schema::dropIfExists('compras_recepciones');
        Schema::table('tenant_configs', function (Blueprint $table) {
            $table->dropColumn('cta_recepcion_transitoria_id');
        });
        Schema::dropIfExists('item_units');
    }
};
