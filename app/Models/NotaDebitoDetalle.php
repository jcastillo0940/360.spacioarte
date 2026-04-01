<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class NotaDebitoDetalle extends Model
{
    protected $table = 'nota_debito_detalles';

    protected $fillable = [
        'nota_debito_id',
        'item_id',
        'codigo_item',
        'descripcion_item',
        'cantidad',
        'precio_unitario',
        'subtotal_item',
        'porcentaje_itbms',
        'itbms_item',
        'total_item',
    ];

    protected $casts = [
        'cantidad' => 'decimal:2',
        'precio_unitario' => 'decimal:2',
        'subtotal_item' => 'decimal:2',
        'porcentaje_itbms' => 'decimal:2',
        'itbms_item' => 'decimal:2',
        'total_item' => 'decimal:2',
    ];

    public function notaDebito(): BelongsTo
    {
        return $this->belongsTo(NotaDebito::class, 'nota_debito_id');
    }

    public function item(): BelongsTo
    {
        return $this->belongsTo(Item::class, 'item_id');
    }

    public function getTotalAttribute(): string
    {
        return (string) ($this->attributes['total_item'] ?? '0.00');
    }

    public function getDescripcionAttribute(): ?string
    {
        return $this->descripcion_item ?: $this->item?->nombre;
    }
}
