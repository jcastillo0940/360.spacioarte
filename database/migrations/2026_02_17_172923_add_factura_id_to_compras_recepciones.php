<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('compras_recepciones', function (Blueprint $box) {
            $box->foreignId('factura_compra_id')->nullable()->constrained('facturas_compra')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('compras_recepciones', function (Blueprint $box) {
            $box->dropForeign(['factura_compra_id']);
            $box->dropColumn('factura_compra_id');
        });
    }
};
