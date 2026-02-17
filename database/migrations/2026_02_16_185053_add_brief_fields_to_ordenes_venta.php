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
        Schema::table('ordenes_venta', function (Blueprint $table) {
            $table->text('brief_cliente')->nullable()->after('detalle_diseno');
            $table->string('archivo_brief_path')->nullable()->after('brief_cliente');
        });
    }

    public function down(): void
    {
        Schema::table('ordenes_venta', function (Blueprint $table) {
            $table->dropColumn(['brief_cliente', 'archivo_brief_path']);
        });
    }
};
