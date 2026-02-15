<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('operaciones_factoring', function (Blueprint $table) {
            $table->foreignId('nota_credito_id')->nullable()->after('factura_venta_id')->constrained('notas_credito')->onDelete('cascade');
        });
    }

    public function down()
    {
        Schema::table('operaciones_factoring', function (Blueprint $table) {
            $table->dropForeign(['nota_credito_id']);
            $table->dropColumn('nota_credito_id');
        });
    }
};