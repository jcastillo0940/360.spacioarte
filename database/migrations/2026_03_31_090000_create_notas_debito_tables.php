<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('notas_debito', function (Blueprint $table) {
            $table->id();
            $table->string('numero_nota')->unique();
            $table->foreignId('factura_venta_id')->nullable()->constrained('facturas_venta')->nullOnDelete();
            $table->string('factura_manual_ref')->nullable();
            $table->date('fecha_factura_original')->nullable();
            $table->foreignId('contacto_id')->nullable()->constrained('contactos')->nullOnDelete();
            $table->foreignId('sucursal_id')->nullable()->constrained('sucursales')->nullOnDelete();
            $table->date('fecha');
            $table->enum('tipo_nota', ['recargo', 'interes', 'ajuste'])->default('ajuste');
            $table->text('motivo');
            $table->decimal('subtotal', 15, 2)->default(0);
            $table->decimal('itbms_total', 15, 2)->default(0);
            $table->decimal('total', 15, 2)->default(0);
            $table->enum('estado', ['Activa', 'Anulada'])->default('Activa');
            $table->string('fe_provider')->nullable();
            $table->string('fe_status')->nullable();
            $table->string('fe_legal_status')->nullable();
            $table->string('fe_document_id')->nullable();
            $table->string('fe_cufe')->nullable();
            $table->timestamp('fe_issue_date')->nullable();
            $table->timestamp('fe_last_sync_at')->nullable();
            $table->text('fe_public_url')->nullable();
            $table->text('fe_container_xml_url')->nullable();
            $table->json('fe_request_payload')->nullable();
            $table->json('fe_response_payload')->nullable();
            $table->text('fe_error_message')->nullable();
            $table->timestamps();
        });

        Schema::create('nota_debito_detalles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('nota_debito_id')->constrained('notas_debito')->cascadeOnDelete();
            $table->foreignId('item_id')->constrained('items');
            $table->string('codigo_item')->nullable();
            $table->string('descripcion_item')->nullable();
            $table->decimal('cantidad', 15, 2);
            $table->decimal('precio_unitario', 15, 2);
            $table->decimal('subtotal_item', 15, 2)->default(0);
            $table->decimal('porcentaje_itbms', 8, 2)->default(0);
            $table->decimal('itbms_item', 15, 2)->default(0);
            $table->decimal('total_item', 15, 2);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('nota_debito_detalles');
        Schema::dropIfExists('notas_debito');
    }
};
