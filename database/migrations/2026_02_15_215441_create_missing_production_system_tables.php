<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Centros de Trabajo (Máquinas)
        Schema::create('procesos', function (Blueprint $table) {
            $table->id();
            $table->string('nombre');
            $table->string('tipo_maquina');
            $table->decimal('costo_operativo_promedio', 15, 4)->default(0);
            $table->integer('capacidad_diaria')->default(0);
            $table->boolean('activo')->default(true);
            $table->timestamps();
        });

        // 2. Órdenes de Producción (La unidad de trabajo)
        Schema::create('ordenes_produccion', function (Blueprint $table) {
            $table->id();
            $table->foreignId('orden_venta_id')->constrained('ordenes_venta');
            $table->foreignId('proceso_id')->constrained('procesos');
            $table->foreignId('item_id')->constrained('items'); // Materia prima base
            $table->decimal('cantidad', 15, 2);
            $table->enum('estado', ['Pendiente', 'En Pliego', 'Impreso', 'En Máquina', 'Terminado', 'Cancelado'])->default('Pendiente');
            $table->date('fecha_entrega_proyectada')->nullable();
            $table->text('notas_operario')->nullable();
            $table->timestamps();
        });

        // 3. Pliegos de Impresión (Nesting)
        Schema::create('pliegos_impresion', function (Blueprint $table) {
            $table->id();
            $table->foreignId('item_id')->constrained('items'); // El papel/vinilo usado
            $table->foreignId('operario_id')->constrained('users');
            $table->enum('estado', ['Pendiente', 'Impreso', 'Cancelado'])->default('Pendiente');
            $table->timestamps();
        });

        // 4. Pivot: Pliego <-> Órdenes
        Schema::create('pliego_orden_produccion', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pliego_id')->constrained('pliegos_impresion')->onDelete('cascade');
            $table->foreignId('orden_produccion_id')->constrained('ordenes_produccion')->onDelete('cascade');
            $table->decimal('cantidad_asignada', 15, 2);
            $table->timestamps();
        });

        // 5. Control de Tiempos Reales
        Schema::create('produccion_tiempos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('orden_produccion_id')->constrained('ordenes_produccion');
            $table->foreignId('maquina_id')->constrained('procesos');
            $table->foreignId('operario_id')->constrained('users');
            $table->timestamp('hora_inicio');
            $table->timestamp('hora_fin')->nullable();
            $table->integer('tiempo_total_minutos')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('produccion_tiempos');
        Schema::dropIfExists('pliego_orden_produccion');
        Schema::dropIfExists('pliegos_impresion');
        Schema::dropIfExists('ordenes_produccion');
        Schema::dropIfExists('procesos');
    }
};