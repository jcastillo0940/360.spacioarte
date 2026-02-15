<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Proceso extends Model
{
    use HasFactory;

    protected $table = 'procesos';

    protected $fillable = [
        'nombre', 
        'tipo_maquina', 
        'costo_operativo_promedio', 
        'capacidad_diaria', 
        'activo'
    ];

    // Relación con las órdenes que están en cola para esta máquina
    public function ordenesProduccion()
    {
        return $this->hasMany(OrdenProduccion::class, 'proceso_id');
    }
}