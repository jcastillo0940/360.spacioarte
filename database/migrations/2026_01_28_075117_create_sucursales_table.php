<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sucursales', function (Blueprint $table) {
            $table->id();
            $table->foreignId('contacto_id')->constrained('contactos')->onDelete('cascade');
            $table->string('codigo', 50)->unique();
            $table->string('nombre', 255);
            $table->string('direccion')->nullable();
            $table->string('telefono', 50)->nullable();
            $table->string('encargado', 255)->nullable();
            $table->string('email', 255)->nullable();
            $table->decimal('latitud', 10, 8)->nullable();
            $table->decimal('longitud', 11, 8)->nullable();
            $table->boolean('activo')->default(true);
            $table->text('notas')->nullable();
            $table->timestamps();
        });
        
        // Agregar sucursal_id a ordenes_venta y facturas_venta
        Schema::table('ordenes_venta', function (Blueprint $table) {
            $table->foreignId('sucursal_id')->nullable()->after('contacto_id')->constrained('sucursales')->onDelete('set null');
        });
        
        Schema::table('facturas_venta', function (Blueprint $table) {
            $table->foreignId('sucursal_id')->nullable()->after('contacto_id')->constrained('sucursales')->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::table('facturas_venta', function (Blueprint $table) {
            $table->dropForeign(['sucursal_id']);
            $table->dropColumn('sucursal_id');
        });
        
        Schema::table('ordenes_venta', function (Blueprint $table) {
            $table->dropForeign(['sucursal_id']);
            $table->dropColumn('sucursal_id');
        });
        
        Schema::dropIfExists('sucursales');
    }
};