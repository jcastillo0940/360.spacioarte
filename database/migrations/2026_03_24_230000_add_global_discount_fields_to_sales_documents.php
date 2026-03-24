<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('cotizaciones', function (Blueprint $table) {
            $table->string('descuento_tipo', 20)->nullable()->after('itbms_total');
            $table->decimal('descuento_valor', 15, 2)->default(0)->after('descuento_tipo');
            $table->decimal('descuento_total', 15, 2)->default(0)->after('descuento_valor');
        });

        Schema::table('ordenes_venta', function (Blueprint $table) {
            $table->string('descuento_tipo', 20)->nullable()->after('itbms_total');
            $table->decimal('descuento_valor', 15, 2)->default(0)->after('descuento_tipo');
        });

        Schema::table('facturas_venta', function (Blueprint $table) {
            $table->string('descuento_tipo', 20)->nullable()->after('itbms_total');
            $table->decimal('descuento_valor', 15, 2)->default(0)->after('descuento_tipo');
            $table->decimal('descuento_total', 15, 2)->default(0)->after('descuento_valor');
        });
    }

    public function down(): void
    {
        Schema::table('facturas_venta', function (Blueprint $table) {
            $table->dropColumn(['descuento_tipo', 'descuento_valor', 'descuento_total']);
        });

        Schema::table('ordenes_venta', function (Blueprint $table) {
            $table->dropColumn(['descuento_tipo', 'descuento_valor']);
        });

        Schema::table('cotizaciones', function (Blueprint $table) {
            $table->dropColumn(['descuento_tipo', 'descuento_valor', 'descuento_total']);
        });
    }
};
