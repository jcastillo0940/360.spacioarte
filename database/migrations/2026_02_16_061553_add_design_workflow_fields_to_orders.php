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
            if (!Schema::hasColumn('ordenes_venta', 'imagen_referencia')) {
                $table->string('imagen_referencia')->nullable()->after('observaciones');
            }
            if (!Schema::hasColumn('ordenes_venta', 'imagen_diseno')) {
                $table->string('imagen_diseno')->nullable()->after('imagen_referencia');
            }
            if (!Schema::hasColumn('ordenes_venta', 'diseno_intentos')) {
                $table->integer('diseno_intentos')->default(0)->after('imagen_diseno');
            }
            if (!Schema::hasColumn('ordenes_venta', 'diseno_notas')) {
                $table->text('diseno_notas')->nullable()->after('diseno_intentos');
            }
            
            // Cambiamos a string para evitar líos con el enum en migraciones incrementales
            $table->string('estado_diseno')->default('Pendiente')->change();
        });
    }

    public function down(): void
    {
        Schema::table('ordenes_venta', function (Blueprint $table) {
            $table->dropColumn(['imagen_referencia', 'imagen_diseno', 'diseno_intentos', 'diseno_notas']);
        });
    }
};
