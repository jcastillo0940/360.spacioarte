<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Receta extends Model
{
    protected $table = 'recetas';

    protected $fillable = [
        'producto_id',
        'insumo_id',
        'cantidad',
        'unidad'
    ];

    public function producto(): BelongsTo
    {
        return $this->belongsTo(Item::class, 'producto_id');
    }

    public function insumo(): BelongsTo
    {
        return $this->belongsTo(Item::class, 'insumo_id');
    }
}
