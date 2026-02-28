<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('recibos_pago', function (Blueprint $table) {
            if (!Schema::hasColumn('recibos_pago', 'pdf_path')) {
                $table->string('pdf_path')->nullable()->after('notas');
            }
        });
    }

    public function down(): void
    {
        Schema::table('recibos_pago', function (Blueprint $table) {
            if (Schema::hasColumn('recibos_pago', 'pdf_path')) {
                $table->dropColumn('pdf_path');
            }
        });
    }
};
