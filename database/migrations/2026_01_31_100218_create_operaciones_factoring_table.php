<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('operaciones_factoring', function (Blueprint $table) {
            $table->id();
            $table->string('numero_operacion')->unique();
            
            // Tipo: 'compra' (descuento proveedor) o 'venta' (cargo banco)
            $table->enum('tipo', ['compra', 'venta']);
            
            // Referencia a la factura
            $table->unsignedBigInteger('factura_compra_id')->nullable();
            $table->unsignedBigInteger('factura_venta_id')->nullable();
            
            // Datos financieros
            $table->date('fecha_operacion');
            $table->decimal('monto_factura', 15, 2);
            $table->decimal('porcentaje', 5, 2); // 4% o 5%
            $table->decimal('monto_descuento', 15, 2); // Calculado
            $table->decimal('monto_neto', 15, 2); // Monto que realmente se paga/cobra
            
            // Cuenta bancaria involucrada
            $table->unsignedBigInteger('bank_account_id');
            
            // Entidad financiera (opcional)
            $table->string('entidad_financiera')->nullable();
            $table->string('numero_operacion_externa')->nullable();
            
            // Observaciones
            $table->text('notas')->nullable();
            
            // Estado
            $table->enum('estado', ['Activa', 'Anulada'])->default('Activa');
            
            $table->timestamps();
            
            // Foreign keys
            $table->foreign('factura_compra_id')->references('id')->on('facturas_compra')->onDelete('restrict');
            $table->foreign('factura_venta_id')->references('id')->on('facturas_venta')->onDelete('restrict');
            $table->foreign('bank_account_id')->references('id')->on('bank_accounts')->onDelete('restrict');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('operaciones_factoring');
    }
};