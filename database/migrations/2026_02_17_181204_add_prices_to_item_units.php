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
        Schema::table('item_units', function (Blueprint $table) {
            $table->decimal('costo_compra', 15, 4)->nullable()->after('factor_conversion');
            $table->decimal('precio_venta', 15, 4)->nullable()->after('costo_compra');
            $table->boolean('incluye_impuestos')->default(false)->after('precio_venta');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('item_units', function (Blueprint $table) {
            $table->dropColumn(['costo_compra', 'precio_venta', 'incluye_impuestos']);
        });
    }
};
