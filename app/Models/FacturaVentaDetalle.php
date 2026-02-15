<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FacturaVentaDetalle extends Model
{
    protected $table = 'factura_venta_detalles';

    protected $fillable = [
        'factura_venta_id', 'item_id', 'cantidad', 'precio_unitario', 
        'porcentaje_itbms', 'total_item'
    ];

    public function item()
    {
        return $this->belongsTo(Item::class);
    }
}