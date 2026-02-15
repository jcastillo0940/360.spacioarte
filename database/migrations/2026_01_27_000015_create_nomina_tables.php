<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Conceptos configurables (CSS, Seguro Educativo, ISR, etc.)
        Schema::create('nomina_conceptos', function (Blueprint $table) {
            $table->id();
            $table->string('nombre'); // Ej: Seguro Social Relación de Dependencia
            $table->enum('tipo', ['Ingreso', 'Deduccion']);
            $table->enum('origen', ['Ley', 'Empresa', 'Prestamo']);
            $table->decimal('porcentaje_empleado', 5, 4)->default(0); // Ej: 0.0975
            $table->decimal('porcentaje_patronal', 5, 4)->default(0); // Ej: 0.1225
            $table->boolean('aplica_decimo')->default(true);
            $table->boolean('activo')->default(true);
            $table->timestamps();
        });

        // Registro de Nómina (Cabecera por periodo)
        Schema::create('nominas', function (Blueprint $table) {
            $table->id();
            $table->string('periodo_nombre'); // Ej: Primera Quincena Enero 2026
            $table->date('fecha_inicio');
            $table->date('fecha_fin');
            $table->enum('estado', ['Borrador', 'Procesada', 'Pagada', 'Anulada'])->default('Borrador');
            $table->decimal('total_ingresos', 15, 2)->default(0);
            $table->decimal('total_deducciones', 15, 2)->default(0);
            $table->decimal('total_neto', 15, 2)->default(0);
            $table->timestamps();
        });

        // Detalle por Empleado
        Schema::create('nomina_detalles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('nomina_id')->constrained('nominas')->onDelete('cascade');
            $table->foreignId('empleado_id')->constrained('empleados');
            $table->decimal('salario_bruto', 15, 2);
            $table->decimal('total_deducciones', 15, 2);
            $table->decimal('neto_pagar', 15, 2);
            $table->decimal('decimo_tercer_mes_proporcional', 15, 2)->default(0);
            $table->decimal('vacaciones_proporcionales', 15, 2)->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('nomina_detalles');
        Schema::dropIfExists('nominas');
        Schema::dropIfExists('nomina_conceptos');
    }
};