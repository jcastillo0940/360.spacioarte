<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class ItemUnit extends Model
{
    use HasFactory;

    protected $fillable = [
        'item_id',
        'nombre',
        'factor_conversion',
        'costo_compra',
        'precio_venta',
        'incluye_impuestos',
        'es_unidad_compra',
        'activo'
    ];

    public function item()
    {
        return $this->belongsTo(Item::class);
    }
}
