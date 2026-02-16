<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ProduccionTiempo extends Model
{
    protected $table = 'produccion_tiempos';

    protected $fillable = [
        'orden_produccion_id',
        'orden_venta_id',
        'fase',
        'maquina_id',
        'operario_id',
        'hora_inicio',
        'hora_fin',
        'tiempo_total_minutos'
    ];

    protected $casts = [
        'hora_inicio' => 'datetime',
        'hora_fin' => 'datetime',
    ];

    public function ordenVenta()
    {
        return $this->belongsTo(OrdenVenta::class);
    }
}