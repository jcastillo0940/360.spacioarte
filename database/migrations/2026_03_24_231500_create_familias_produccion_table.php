<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('familias_produccion', function (Blueprint $table) {
            $table->id();
            $table->string('codigo', 30)->unique();
            $table->string('nombre', 120);
            $table->text('descripcion')->nullable();
            $table->string('tipo_consumo_material', 30);
            $table->boolean('requiere_material_base')->default(false);
            $table->boolean('requiere_soporte_impresion')->default(false);
            $table->boolean('requiere_nesting')->default(false);
            $table->boolean('requiere_receta')->default(false);
            $table->decimal('segundos_estandar_unidad', 10, 2)->default(0);
            $table->boolean('activo')->default(true);
            $table->timestamps();
        });

        Schema::table('items', function (Blueprint $table) {
            $table->foreignId('familia_produccion_id')
                ->nullable()
                ->after('item_base_id')
                ->constrained('familias_produccion')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('items', function (Blueprint $table) {
            $table->dropForeign(['familia_produccion_id']);
            $table->dropColumn('familia_produccion_id');
        });

        Schema::dropIfExists('familias_produccion');
    }
};
