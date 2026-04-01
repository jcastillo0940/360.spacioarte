<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class NotaCreditoDetalle extends Model
{
    protected $table = 'nota_credito_detalles';

    protected $fillable = [
        'nota_credito_id',
        'item_id',
        'cantidad',
        'precio_unitario',
        'total_item',
        'devuelto_stock',
    ];

    protected $casts = [
        'cantidad' => 'decimal:2',
        'precio_unitario' => 'decimal:2',
        'total_item' => 'decimal:2',
        'devuelto_stock' => 'boolean',
    ];

    public function notaCredito(): BelongsTo
    {
        return $this->belongsTo(NotaCredito::class, 'nota_credito_id');
    }

    public function item(): BelongsTo
    {
        return $this->belongsTo(Item::class, 'item_id');
    }

    public function getTotalAttribute(): string
    {
        return (string) ($this->attributes['total_item'] ?? '0.00');
    }

    public function getDevolverStockAttribute(): bool
    {
        return (bool) ($this->attributes['devuelto_stock'] ?? false);
    }
}
