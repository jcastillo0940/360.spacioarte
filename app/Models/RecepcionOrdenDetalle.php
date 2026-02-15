<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class RecepcionOrdenDetalle extends Model
{
    use HasFactory;

    protected $table = 'recepciones_ordenes_detalles';

    protected $fillable = [
        'recepcion_orden_id',
        'item_id',
        'cantidad_ordenada',
        'cantidad_recibida',
        'costo_unitario'
    ];

    /**
     * Relación con RecepcionOrden
     */
    public function recepcion()
    {
        return $this->belongsTo(RecepcionOrden::class, 'recepcion_orden_id');
    }

    /**
     * Relación con Item
     */
    public function item()
    {
        return $this->belongsTo(Item::class);
    }

    /**
     * Accessor para el subtotal de la línea
     */
    public function getSubtotalAttribute()
    {
        return $this->cantidad_recibida * $this->costo_unitario;
    }

    /**
     * Accessor para el porcentaje recibido
     */
    public function getPorcentajeRecibidoAttribute()
    {
        if ($this->cantidad_ordenada <= 0) {
            return 0;
        }
        return round(($this->cantidad_recibida / $this->cantidad_ordenada) * 100, 2);
    }
}
