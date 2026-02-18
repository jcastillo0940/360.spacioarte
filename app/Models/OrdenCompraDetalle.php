<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OrdenCompraDetalle extends Model
{
    protected $table = 'ordenes_compra_detalle';
    
    protected $fillable = [
        'orden_compra_id',
        'item_id',
        'item_unit_id',
        'factor_conversion_usado',
        'cantidad',
        'costo_unitario',
        'total'
    ];

    public function unit(): BelongsTo
    {
        return $this->belongsTo(ItemUnit::class, 'item_unit_id');
    }

    protected $casts = [
        'cantidad' => 'decimal:2',
        'costo_unitario' => 'decimal:2',
        'total' => 'decimal:2'
    ];

    public function orden(): BelongsTo
    {
        return $this->belongsTo(OrdenCompra::class, 'orden_compra_id');
    }

    public function item(): BelongsTo
    {
        return $this->belongsTo(Item::class);
    }
}