<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class CompraRecepcionDetalle extends Model
{
    use HasFactory;

    protected $table = 'compras_recepcion_detalles';

    protected $fillable = [
        'recepcion_id',
        'item_id',
        'item_unit_id',
        'cantidad_recibida_um_compra',
        'factor_conversion_usado',
        'cantidad_recepcionada_um_base',
        'costo_unitario_um_compra'
    ];

    public function recepcion()
    {
        return $this->belongsTo(CompraRecepcion::class, 'recepcion_id');
    }

    public function item()
    {
        return $this->belongsTo(Item::class);
    }

    public function unit()
    {
        return $this->belongsTo(ItemUnit::class, 'item_unit_id');
    }
}
