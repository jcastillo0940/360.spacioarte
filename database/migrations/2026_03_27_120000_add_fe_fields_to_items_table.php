<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('items', function (Blueprint $table) {
            $table->string('fe_codigo_producto', 50)->nullable()->after('categoria');
            $table->string('fe_codigo_unidad', 20)->nullable()->after('fe_codigo_producto');
        });
    }

    public function down(): void
    {
        Schema::table('items', function (Blueprint $table) {
            $table->dropColumn([
                'fe_codigo_producto',
                'fe_codigo_unidad',
            ]);
        });
    }
};
