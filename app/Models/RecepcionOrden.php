<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class RecepcionOrden extends Model
{
    use HasFactory;

    protected $table = 'recepciones_ordenes';

    protected $fillable = [
        'numero_recepcion',
        'orden_compra_id',
        'user_id',
        'fecha_recepcion',
        'tipo',
        'observaciones',
        'estado'
    ];

    protected $casts = [
        'fecha_recepcion' => 'datetime'
    ];

    /**
     * Relación con OrdenCompra
     */
    public function ordenCompra()
    {
        return $this->belongsTo(OrdenCompra::class, 'orden_compra_id');
    }

    /**
     * Relación con Usuario (vendedor que recibió)
     */
    public function usuario()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /**
     * Relación con detalles de recepción
     */
    public function detalles()
    {
        return $this->hasMany(RecepcionOrdenDetalle::class, 'recepcion_orden_id');
    }

    /**
     * Accessor para el total recibido
     */
    public function getTotalRecibidoAttribute()
    {
        return $this->detalles->sum(function ($detalle) {
            return $detalle->cantidad_recibida * $detalle->costo_unitario;
        });
    }

    /**
     * Accessor para cantidad total de items recibidos
     */
    public function getCantidadTotalItemsAttribute()
    {
        return $this->detalles->sum('cantidad_recibida');
    }
}
