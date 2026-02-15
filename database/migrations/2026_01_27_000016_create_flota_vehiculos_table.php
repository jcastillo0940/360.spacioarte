<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Registro Maestro de Vehículos 
        Schema::create('vehiculos', function (Blueprint $table) {
            $table->id();
            $table->string('placa')->unique(); // [cite: 419]
            $table->string('marca'); // [cite: 418]
            $table->string('modelo'); // [cite: 418]
            $table->integer('anio'); // [cite: 418]
            $table->string('chasis')->nullable(); // [cite: 420]
            $table->string('motor')->nullable(); // [cite: 420]
            $table->string('color')->nullable(); // [cite: 421]
            $table->enum('tipo_combustible', ['Gasolina', 'Diesel', 'Electrico', 'Hibrido']); // [cite: 422]
            $table->decimal('capacidad_carga', 10, 2)->nullable(); // [cite: 423]
            $table->integer('kilometraje_actual')->default(0);
            $table->enum('estado', ['Activo', 'En Mantenimiento', 'Fuera de Servicio'])->default('Activo'); // [cite: 424]
            $table->date('vencimiento_seguro')->nullable(); // [cite: 442]
            $table->date('vencimiento_revision')->nullable(); // [cite: 443]
            $table->foreignId('conductor_asignado_id')->nullable()->constrained('empleados'); // [cite: 427]
            $table->timestamps();
        });

        // Registro de Cargas de Combustible [cite: 436]
        Schema::create('vehiculo_combustible', function (Blueprint $table) {
            $table->id();
            $table->foreignId('vehiculo_id')->constrained('vehiculos');
            $table->date('fecha'); // [cite: 437]
            $table->decimal('cantidad_galones', 10, 2); // [cite: 437]
            $table->decimal('costo_total', 15, 2); // [cite: 437]
            $table->integer('kilometraje_registro'); // 
            $table->string('estacion_servicio')->nullable(); // [cite: 437]
            $table->timestamps();
        });

        // Historial de Mantenimientos [cite: 430]
        Schema::create('vehiculo_mantenimientos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('vehiculo_id')->constrained('vehiculos');
            $table->enum('tipo', ['Preventivo', 'Correctivo']); // [cite: 431, 432]
            $table->date('fecha_servicio'); // [cite: 433]
            $table->integer('kilometraje_servicio');
            $table->text('descripcion_trabajo');
            $table->decimal('costo_servicio', 15, 2); // [cite: 435]
            $table->string('taller_proveedor')->nullable();
            $table->date('proxima_cita_fecha')->nullable(); // [cite: 431]
            $table->integer('proxima_cita_km')->nullable(); // [cite: 431]
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('vehiculo_mantenimientos');
        Schema::dropIfExists('vehiculo_combustible');
        Schema::dropIfExists('vehiculos');
    }
};