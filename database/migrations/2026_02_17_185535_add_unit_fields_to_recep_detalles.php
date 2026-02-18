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
        Schema::table('recepciones_ordenes_detalles', function (Blueprint $table) {
            $table->foreignId('item_unit_id')->nullable()->after('item_id')->constrained('item_units')->nullOnDelete();
            $table->decimal('factor_conversion_usado', 12, 4)->default(1.0000)->after('item_unit_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('recepciones_ordenes_detalles', function (Blueprint $table) {
            $table->dropForeign(['item_unit_id']);
            $table->dropColumn(['item_unit_id', 'factor_conversion_usado']);
        });
    }
};
