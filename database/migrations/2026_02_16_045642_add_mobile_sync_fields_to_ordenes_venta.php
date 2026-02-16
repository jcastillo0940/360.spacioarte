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
            $table->string('referencia_externa')->nullable()->unique()->after('numero_orden');
            $table->foreignId('user_id')->nullable()->after('vendedor_id')->constrained('users');
            $table->text('observaciones')->nullable()->after('estado');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('ordenes_venta', function (Blueprint $table) {
            $table->dropForeign(['user_id']);
            $table->dropColumn(['referencia_externa', 'user_id', 'observaciones']);
        });
    }
};
