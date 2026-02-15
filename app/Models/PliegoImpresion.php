<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PliegoImpresion extends Model
{
    protected $table = 'pliegos_impresion';

    protected $fillable = [
        'item_id', // El sustrato (ej. Papel A3)
        'operario_id',
        'estado'
    ];

    public function materiaPrima()
    {
        return $this->belongsTo(Item::class, 'item_id');
    }

    public function items()
    {
        return $this->belongsToMany(OrdenProduccion::class, 'pliego_orden_produccion', 'pliego_id', 'orden_produccion_id')
                    ->withPivot('cantidad_asignada');
    }
}