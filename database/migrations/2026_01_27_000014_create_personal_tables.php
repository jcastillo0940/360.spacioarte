<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Catálogo de Departamentos
        Schema::create('departamentos', function (Blueprint $table) {
            $table->id();
            $table->string('nombre')->unique();
            $table->timestamps();
        });

        // Catálogo de Puestos
        Schema::create('puestos', function (Blueprint $table) {
            $table->id();
            $table->string('nombre');
            $table->foreignId('departamento_id')->constrained('departamentos');
            $table->timestamps();
        });

        // Ficha de Empleado
        Schema::create('empleados', function (Blueprint $table) {
            $table->id();
            $table->string('codigo_empleado')->unique();
            $table->string('nombre');
            $table->string('apellido');
            $table->string('cedula')->unique();
            $table->date('fecha_nacimiento');
            $table->string('email')->unique();
            $table->string('telefono')->nullable();
            $table->string('direccion')->nullable();
            
            // Datos laborales
            $table->foreignId('puesto_id')->constrained('puestos');
            $table->date('fecha_ingreso');
            $table->enum('tipo_contrato', ['Indefinido', 'Temporal', 'Proyecto']);
            $table->decimal('salario_base', 15, 2);
            
            // Datos bancarios para ACH
            $table->string('banco_nombre')->nullable();
            $table->string('banco_cuenta')->nullable();
            
            $table->boolean('activo')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('empleados');
        Schema::dropIfExists('puestos');
        Schema::dropIfExists('departamentos');
    }
};