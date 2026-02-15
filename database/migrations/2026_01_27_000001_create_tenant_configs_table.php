<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tenant_configs', function (Blueprint $table) {
            $table->id();
            // Datos Generales de la Empresa
            $table->string('razon_social');
            $table->string('ruc')->unique();
            $table->string('dv', 2); // Digito verificador para Panamá
            $table->string('direccion');
            $table->string('telefono');
            $table->string('email');
            $table->string('logo_path')->nullable();

            // Configuración Fiscal y Moneda
            $table->string('moneda_principal', 3)->default('PAB'); // Balboas / USD
            $table->decimal('itbms_porcentaje', 5, 2)->default(7.00);
            $table->boolean('multimoneda_activa')->default(false);

            // Configuración de Facturación
            $table->string('factura_serie')->default('FAC');
            $table->integer('factura_inicio')->default(1);
            $table->text('factura_terminos_condiciones')->nullable();
            $table->string('factura_plantilla')->default('default');
            $table->enum('factura_formato_impresion', ['carta', 'media_carta', 'termica'])->default('carta');
            $table->boolean('mostrar_valores_letras')->default(true);

            // Servidor SMTP (Configuración dinámica)
            $table->string('smtp_host')->nullable();
            $table->integer('smtp_port')->nullable();
            $table->string('smtp_user')->nullable();
            $table->string('smtp_pass')->nullable();
            $table->string('smtp_encryption')->default('tls');

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tenant_configs');
    }
};