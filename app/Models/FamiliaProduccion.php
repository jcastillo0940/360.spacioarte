<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class FamiliaProduccion extends Model
{
    protected $table = 'familias_produccion';

    protected $fillable = [
        'codigo',
        'nombre',
        'descripcion',
        'tipo_consumo_material',
        'requiere_material_base',
        'requiere_soporte_impresion',
        'requiere_nesting',
        'requiere_receta',
        'segundos_estandar_unidad',
        'activo',
    ];

    protected $casts = [
        'requiere_material_base' => 'boolean',
        'requiere_soporte_impresion' => 'boolean',
        'requiere_nesting' => 'boolean',
        'requiere_receta' => 'boolean',
        'segundos_estandar_unidad' => 'decimal:2',
        'activo' => 'boolean',
    ];

    public function items(): HasMany
    {
        return $this->hasMany(Item::class, 'familia_produccion_id');
    }
}
