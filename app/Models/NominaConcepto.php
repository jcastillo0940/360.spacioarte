<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class NominaConcepto extends Model
{
    protected $table = 'nomina_conceptos';

    protected $fillable = [
        'nombre',
        'tipo',
        'origen',
        'porcentaje_empleado',
        'porcentaje_patronal',
        'monto_fijo',
        'descripcion',
    ];

    protected $casts = [
        'porcentaje_empleado' => 'decimal:4',
        'porcentaje_patronal' => 'decimal:4',
        'monto_fijo' => 'decimal:2',
    ];
}