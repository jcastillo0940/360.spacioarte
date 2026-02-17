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
        Schema::table('ordenes_compra', function (Blueprint $table) {
            if (!Schema::hasColumn('ordenes_compra', 'vendedor_id')) {
                $table->unsignedBigInteger('vendedor_id')->nullable()->index();
            }
            if (!Schema::hasColumn('ordenes_compra', 'user_id')) {
                $table->unsignedBigInteger('user_id')->nullable()->index();
            }
        });
    }

    public function down(): void
    {
        Schema::table('ordenes_compra', function (Blueprint $table) {
            $table->dropForeign(['vendedor_id']);
            $table->dropForeign(['user_id']);
            $table->dropColumn(['vendedor_id', 'user_id']);
        });
    }
};
