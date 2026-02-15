<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class OrdenProduccion extends Model
{
    protected $table = 'ordenes_produccion';

    protected $fillable = [
        'orden_venta_id',
        'proceso_id',
        'item_id', // Materia prima base (ej. Taza Blanca)
        'cantidad',
        'estado',
        'fecha_entrega_proyectada',
        'notas_operario'
    ];

    public function venta()
    {
        return $this->belongsTo(OrdenVenta::class, 'orden_venta_id');
    }

    public function maquina()
    {
        return $this->belongsTo(Proceso::class, 'proceso_id');
    }

    public function materiaPrima()
    {
        return $this->belongsTo(Item::class, 'item_id');
    }

    // Un trabajo puede pertenecer a un pliego de impresión (Nesting)
    public function pliegos()
    {
        return $this->belongsToMany(PliegoImpresion::class, 'pliego_orden_produccion', 'orden_produccion_id', 'pliego_id');
    }
}