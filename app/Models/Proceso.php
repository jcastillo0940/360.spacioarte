<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Proceso extends Model
{
    use HasFactory;

    protected $table = 'procesos';

    protected $fillable = [
        'nombre',
        'tipo_maquina',
        'categoria_tecnologia',
        'ancho_maximo_cm',
        'largo_maximo_cm',
        'tiempo_setup_minutos',
        'tiempo_estimado_por_unidad',
        'permite_nesting',
        'margen_seguridad_cm',
        'costo_operativo_promedio',
        'capacidad_diaria',
        'activo',
    ];

    protected $casts = [
        'ancho_maximo_cm' => 'decimal:2',
        'largo_maximo_cm' => 'decimal:2',
        'tiempo_setup_minutos' => 'decimal:2',
        'tiempo_estimado_por_unidad' => 'decimal:2',
        'permite_nesting' => 'boolean',
        'margen_seguridad_cm' => 'decimal:2',
        'costo_operativo_promedio' => 'decimal:4',
        'activo' => 'boolean',
    ];

    public function ordenesProduccion()
    {
        return $this->hasMany(OrdenProduccion::class, 'proceso_id');
    }
}
