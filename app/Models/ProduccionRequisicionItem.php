<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ProduccionRequisicionItem extends Model
{
    protected $table = 'produccion_requisicion_items';
    protected $fillable = ['requisicion_id', 'item_id', 'cantidad_solicitada'];

    public function producto() {
        return $this->belongsTo(Item::class, 'item_id');
    }
}