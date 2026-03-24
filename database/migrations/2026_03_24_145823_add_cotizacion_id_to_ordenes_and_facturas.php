<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('ordenes_venta', function (Blueprint $table) {
            $table->unsignedBigInteger('cotizacion_id')->nullable()->after('id');
            $table->foreign('cotizacion_id')->references('id')->on('cotizaciones')->onDelete('set null');
        });

        Schema::table('facturas_venta', function (Blueprint $table) {
            $table->unsignedBigInteger('cotizacion_id')->nullable()->after('orden_venta_id');
            $table->foreign('cotizacion_id')->references('id')->on('cotizaciones')->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::table('facturas_venta', function (Blueprint $table) {
            $table->dropForeign(['cotizacion_id']);
            $table->dropColumn('cotizacion_id');
        });

        Schema::table('ordenes_venta', function (Blueprint $table) {
            $table->dropForeign(['cotizacion_id']);
            $table->dropColumn('cotizacion_id');
        });
    }
};
