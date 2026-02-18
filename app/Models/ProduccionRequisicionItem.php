<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ProduccionRequisicionItem extends Model
{
    protected $table = 'produccion_requisicion_items';
    protected $fillable = [
        'requisicion_id', 
        'item_id', 
        'item_unit_id',
        'factor_conversion_usado',
        'cantidad_solicitada',
        'cantidad_base_equivalente',
        'notas'
    ];

    public function producto() {
        return $this->belongsTo(Item::class, 'item_id');
    }

    public function unit() {
        return $this->belongsTo(ItemUnit::class, 'item_unit_id');
    }
}