<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OrdenVentaDetalle extends Model
{
    // Forzamos el nombre exacto que tienes en PHPMyAdmin
    protected $table = 'orden_venta_detalles';

    protected $fillable = [
        'orden_venta_id',
        'item_id',
        'cantidad',
        'precio_unitario',
        'porcentaje_itbms',     // Nombre exacto según tu DESCRIBE
        'porcentaje_descuento', // Nombre exacto según tu DESCRIBE
        'subtotal',
        'total'
    ];

    public function item(): BelongsTo
    {
        return $this->belongsTo(Item::class, 'item_id');
    }

    public function orden(): BelongsTo
    {
        return $this->belongsTo(OrdenVenta::class, 'orden_venta_id');
    }
}