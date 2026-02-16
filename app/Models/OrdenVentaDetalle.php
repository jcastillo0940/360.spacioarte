<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OrdenVentaDetalle extends Model
{
    protected $table = 'orden_venta_detalles';

    protected $fillable = [
        'orden_venta_id',
        'item_id',
        'cantidad',
        'precio_unitario',
        'porcentaje_itbms',
        'porcentaje_descuento',
        'subtotal',
        'total',
        'proceso_id',
        'material_id',
        'pliegos_necesarios',
        'capacidad_por_pliego',
        'total_piezas_calculadas',
    ];

    public function item(): BelongsTo
    {
        return $this->belongsTo(Item::class, 'item_id');
    }

    public function orden(): BelongsTo
    {
        return $this->belongsTo(OrdenVenta::class, 'orden_venta_id');
    }
    public function maquina(): BelongsTo
    {
        return $this->belongsTo(Proceso::class, 'proceso_id');
    }

    public function materialSoporte(): BelongsTo
    {
        return $this->belongsTo(Item::class, 'material_id');
    }
}