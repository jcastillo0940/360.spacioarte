<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class OrdenProduccion extends Model
{
    protected $table = 'ordenes_produccion';

    protected $fillable = [
        'orden_venta_id',
        'proceso_id',
        'item_id', // Materia prima base (ej. Taza Blanca)
        'materia_prima_id', // Papel/Soporte específico de la receta
        'pliegos',
        'capacidad_nesting',
        'cantidad',
        'estado',
        'fecha_entrega_proyectada',
        'notas_operario'
    ];

    public function materiaUsada(): BelongsTo
    {
        return $this->belongsTo(Item::class, 'materia_prima_id');
    }

    public function venta(): BelongsTo
    {
        return $this->belongsTo(OrdenVenta::class, 'orden_venta_id');
    }

    public function maquina(): BelongsTo
    {
        return $this->belongsTo(Proceso::class, 'proceso_id');
    }

    public function materiaPrima(): BelongsTo
    {
        return $this->belongsTo(Item::class, 'item_id');
    }

    // Un trabajo puede pertenecer a un pliego de impresión (Nesting)
    public function pliegos(): BelongsToMany
    {
        return $this->belongsToMany(PliegoImpresion::class, 'pliego_orden_produccion', 'orden_produccion_id', 'pliego_id');
    }
}