<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

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
        'activo',
        'proceso_id',    // Requerido para vincular el producto a una máquina
        'item_base_id'   // Requerido para la relación Materia Prima -> Producto Terminado
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
     * Relación con el proceso de manufactura (Máquina por defecto)
     */
    public function procesoDefault(): BelongsTo
    {
        return $this->belongsTo(Proceso::class, 'proceso_id');
    }

    /**
     * Relación con el producto base (Materia Prima)
     */
    public function productoBase(): BelongsTo
    {
        return $this->belongsTo(Item::class, 'item_base_id');
    }

    /**
     * Relación con productos que se fabrican a partir de este item
     */
    public function productosDerivados(): HasMany
    {
        return $this->hasMany(Item::class, 'item_base_id');
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