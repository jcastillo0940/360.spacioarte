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
        // Reconciliación: Las columnas ya existen en la base de datos por creación manual previa.
        // Solo registramos la migración como ejecutada.
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tenant_configs', function (Blueprint $table) {
            $table->dropForeign(['cta_gasto_salario_id']);
            $table->dropForeign(['cta_retenciones_id']);
            $table->dropForeign(['cta_caja_banco_id']);
            $table->dropColumn(['cta_gasto_salario_id', 'cta_retenciones_id', 'cta_caja_banco_id']);
        });
    }
};
