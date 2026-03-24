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
        'item_id',
        'materia_prima_id',
        'usa_material_completo',
        'tipo_calculo_material',
        'cantidad_material_calculada',
        'largo_material_calculado_cm',
        'unidad_consumo_material',
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

    public function producto(): BelongsTo
    {
        return $this->belongsTo(Item::class, 'item_id');
    }

    public function venta(): BelongsTo
    {
        return $this->belongsTo(OrdenVenta::class, 'orden_venta_id');
    }

    public function maquina(): BelongsTo
    {
        return $this->belongsTo(Proceso::class, 'proceso_id');
    }

    // Compatibilidad con código existente.
    public function materiaPrima(): BelongsTo
    {
        return $this->belongsTo(Item::class, 'item_id');
    }

    public function pliegos(): BelongsToMany
    {
        return $this->belongsToMany(PliegoImpresion::class, 'pliego_orden_produccion', 'orden_produccion_id', 'pliego_id');
    }

    public function tiempos()
    {
        return $this->hasMany(ProduccionTiempo::class);
    }
}
