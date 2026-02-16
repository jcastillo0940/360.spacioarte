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
        Schema::table('ordenes_produccion', function (Blueprint $table) {
            $table->foreignId('materia_prima_id')->nullable()->constrained('items')->onDelete('set null')->after('item_id');
            $table->decimal('pliegos', 10, 2)->nullable()->after('materia_prima_id');
            $table->integer('capacidad_nesting')->nullable()->after('pliegos');
        });
    }

    public function down(): void
    {
        Schema::table('ordenes_produccion', function (Blueprint $table) {
            $table->dropForeign(['materia_prima_id']);
            $table->dropColumn(['materia_prima_id', 'pliegos', 'capacidad_nesting']);
        });
    }
};
