<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('notas_credito', function (Blueprint $table) {
            $table->unsignedBigInteger('sucursal_id')->nullable()->after('contacto_id');
            $table->foreign('sucursal_id')->references('id')->on('sucursales')->onDelete('restrict');
        });
    }

    public function down(): void
    {
        Schema::table('notas_credito', function (Blueprint $table) {
            $table->dropForeign(['sucursal_id']);
            $table->dropColumn('sucursal_id');
        });
    }
};