<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DisenoHistorial extends Model
{
    protected $table = 'diseno_historial';

    protected $fillable = [
        'orden_venta_id',
        'imagen',
        'comentarios_cliente',
        'comentarios_staff',
        'estado',
        'intento'
    ];

    public function ordenVenta(): BelongsTo
    {
        return $this->belongsTo(OrdenVenta::class, 'orden_venta_id');
    }
}
