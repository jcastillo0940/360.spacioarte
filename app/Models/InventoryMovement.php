<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class InventoryMovement extends Model
{
    protected $table = 'inventory_movements';

    protected $fillable = [
        'item_id',
        'user_id',
        'fecha',
        'naturaleza',
        'origen',
        'origen_id',
        'referencia',
        'cantidad',
        'costo_unitario',
        'valor_movimiento',
        'stock_anterior',
        'stock_posterior',
        'costo_promedio_anterior',
        'costo_promedio_posterior',
        'observacion',
        'meta',
    ];

    protected $casts = [
        'fecha' => 'datetime',
        'cantidad' => 'decimal:4',
        'costo_unitario' => 'decimal:4',
        'valor_movimiento' => 'decimal:4',
        'stock_anterior' => 'decimal:4',
        'stock_posterior' => 'decimal:4',
        'costo_promedio_anterior' => 'decimal:4',
        'costo_promedio_posterior' => 'decimal:4',
        'meta' => 'array',
    ];

    public function item(): BelongsTo
    {
        return $this->belongsTo(Item::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
