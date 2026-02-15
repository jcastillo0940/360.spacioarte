<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class OrdenVentaDetalle extends Model
{
    protected $table = 'orden_venta_detalles';

    protected $fillable = [
        'orden_venta_id', 'item_id', 'cantidad', 'precio_unitario', 
        'porcentaje_itbms', 'porcentaje_descuento', 'subtotal', 'total'
    ];

    public function item()
    {
        return $this->belongsTo(Item::class);
    }
}