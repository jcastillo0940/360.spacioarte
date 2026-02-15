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
    Schema::table('items', function (Blueprint $table) {
        if (!Schema::hasColumn('items', 'proceso_id')) {
            $table->foreignId('proceso_id')->nullable()->constrained('procesos');
            $table->foreignId('item_base_id')->nullable()->constrained('items');
        }
    });
}

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('items', function (Blueprint $table) {
            //
        });
    }
};
