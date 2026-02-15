<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Item extends Model
{
    // Tabla confirmada por tu DESCRIBE
    protected $table = 'items';

    protected $fillable = [
        'codigo',
        'nombre',
        'descripcion',
        'tipo',
        'precio_venta',
        'costo_promedio',
        'stock_actual',
        'stock_minimo',
        'stock_maximo',
        'tax_id',
        'categoria',
        'unidad_medida',
        'activo'
    ];

    // Casteamos los valores numéricos para que PHP los trate como números y no strings
    protected $casts = [
        'precio_venta' => 'decimal:2',
        'costo_promedio' => 'decimal:2',
        'stock_actual' => 'decimal:2',
        'stock_minimo' => 'decimal:2',
        'stock_maximo' => 'decimal:2',
        'activo' => 'boolean',
    ];

    /**
     * Relación con el impuesto (Tax)
     * Basado en el tax_id que aparece en tu tabla
     */
    public function tax(): BelongsTo
    {
        return $this->belongsTo(Tax::class, 'tax_id');
    }

    /**
     * Scope para filtrar productos con stock bajo (Usado en el Dashboard)
     */
    public function scopeStockBajo($query)
    {
        return $query->where('tipo', 'Inventariable')
                     ->whereRaw('stock_actual <= stock_minimo');
    }
}