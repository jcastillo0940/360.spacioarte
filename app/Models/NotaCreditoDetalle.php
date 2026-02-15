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
        'subtotal',
        'itbms',
        'total',
        'devolver_stock'
    ];

    protected $casts = [
        'cantidad' => 'decimal:2',
        'precio_unitario' => 'decimal:2',
        'subtotal' => 'decimal:2',
        'itbms' => 'decimal:2',
        'total' => 'decimal:2',
        'devolver_stock' => 'boolean'
    ];

    public function notaCredito(): BelongsTo
    {
        return $this->belongsTo(NotaCredito::class, 'nota_credito_id');
    }

    public function item(): BelongsTo
    {
        return $this->belongsTo(Item::class, 'item_id');
    }
}