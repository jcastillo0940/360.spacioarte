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
        Schema::table('pliegos_impresion', function (Blueprint $table) {
            if (!Schema::hasColumn('pliegos_impresion', 'material_utilizado_id')) {
                $table->foreignId('material_utilizado_id')->nullable()->constrained('items');
            }
            if (!Schema::hasColumn('pliegos_impresion', 'cantidad_material')) {
                $table->decimal('cantidad_material', 10, 2)->nullable();
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('pliegos_impresion', function (Blueprint $table) {
            //
        });
    }
};
