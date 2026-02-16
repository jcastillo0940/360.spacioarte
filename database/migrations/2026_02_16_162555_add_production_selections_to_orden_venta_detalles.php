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
        Schema::table('orden_venta_detalles', function (Blueprint $table) {
            $table->foreignId('proceso_id')->nullable()->constrained('procesos')->onDelete('set null')->after('item_id');
            $table->foreignId('material_id')->nullable()->constrained('items')->onDelete('set null')->after('proceso_id');
            $table->decimal('pliegos_necesarios', 10, 2)->nullable()->after('material_id');
            $table->integer('capacidad_por_pliego')->nullable()->after('pliegos_necesarios');
            $table->integer('total_piezas_calculadas')->nullable()->after('capacidad_por_pliego');
        });
    }

    public function down(): void
    {
        Schema::table('orden_venta_detalles', function (Blueprint $table) {
            $table->dropForeign(['proceso_id']);
            $table->dropForeign(['material_id']);
            $table->dropColumn([
                'proceso_id',
                'material_id',
                'pliegos_necesarios',
                'capacidad_por_pliego',
                'total_piezas_calculadas'
            ]);
        });
    }
};
