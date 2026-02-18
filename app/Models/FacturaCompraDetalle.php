<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FacturaCompraDetalle extends Model
{
    protected $table = 'facturas_compra_detalle';
    
    protected $fillable = [
        'factura_compra_id',
        'item_id',
        'item_unit_id',
        'factor_conversion_usado',
        'cantidad',
        'costo_unitario',
        'subtotal',
        'tasa_itbms',
        'monto_itbms',
        'total'
    ];

    public function unit(): BelongsTo
    {
        return $this->belongsTo(ItemUnit::class, 'item_unit_id');
    }

    protected $casts = [
        'cantidad' => 'decimal:2',
        'costo_unitario' => 'decimal:2',
        'subtotal' => 'decimal:2',
        'tasa_itbms' => 'decimal:2',
        'monto_itbms' => 'decimal:2',
        'total' => 'decimal:2'
    ];

    public function factura(): BelongsTo
    {
        return $this->belongsTo(FacturaCompra::class, 'factura_compra_id');
    }

    public function item(): BelongsTo
    {
        return $this->belongsTo(Item::class);
    }
}