<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Tabla de Rutas
        Schema::create('rutas', function (Blueprint $table) {
            $table->id();
            $table->string('nombre');
            $table->foreignId('vendedor_id')->constrained('users'); // Usuario asignado (Vendedor/Repartidor)
            $table->foreignId('vehiculo_id')->nullable()->constrained('vehiculos');
            $table->boolean('activa')->default(true);
            $table->timestamps();
        });

        // 2. Detalle de Clientes en Ruta (Secuencia de visita)
        Schema::create('ruta_clientes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('ruta_id')->constrained('rutas')->onDelete('cascade');
            $table->foreignId('contacto_id')->constrained('contactos'); // Clientes
            $table->integer('dia_visita')->default(1); // 1: Lunes, etc.
            $table->integer('orden')->default(0); // Orden de visita
            $table->timestamps();
        });

        // 3. Inventario a Bordo (Autoventa / Reparto)
        Schema::create('inventario_vehiculo', function (Blueprint $table) {
            $table->id();
            $table->foreignId('vehiculo_id')->constrained('vehiculos');
            $table->foreignId('item_id')->constrained('items');
            $table->decimal('cantidad', 10, 2)->default(0);
            $table->timestamps();
        });

        // 4. Registro de Visitas (Geolocalización y Evidencia)
        Schema::create('visitas', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid_local')->unique(); // Para evitar duplicados en sync
            $table->foreignId('user_id')->constrained('users');
            $table->foreignId('contacto_id')->constrained('contactos');
            $table->decimal('latitud', 10, 8)->nullable();
            $table->decimal('longitud', 11, 8)->nullable();
            $table->text('observaciones')->nullable();
            $table->string('foto_evidencia_path')->nullable();
            $table->timestamp('fecha_visita');
            $table->boolean('sincronizado')->default(false);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('visitas');
        Schema::dropIfExists('inventario_vehiculo');
        Schema::dropIfExists('ruta_clientes');
        Schema::dropIfExists('rutas');
    }
};