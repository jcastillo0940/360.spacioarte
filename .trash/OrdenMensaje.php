<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OrdenMensaje extends Model
{
    protected $table = 'orden_mensajes';

    protected $fillable = [
        'orden_venta_id',
        'user_id',
        'emisor',
        'mensaje_texto',
        'archivo_url',
        'requiere_aprobacion'
    ];

    public function ordenVenta(): BelongsTo
    {
        return $this->belongsTo(OrdenVenta::class, 'orden_venta_id');
    }

    public function usuario(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}