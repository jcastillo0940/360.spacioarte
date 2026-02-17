<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

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
        'item_base_id',   // Requerido para la relación Materia Prima -> Producto Terminado
        'ancho_cm',
        'largo_cm',
        'es_rollo',
        'margen_seguridad_cm',
        'es_para_nesting',
        'es_insumo',
        'requires_recipe',
        'tipo_impresion',
        'ancho_imprimible',
        'largo_imprimible',
        'permite_rotacion',
        'separacion_piezas',
        'sangrado',
    ];

    // Casteamos los valores numéricos para que PHP los trate como números y no strings
    protected $casts = [
        'precio_venta' => 'decimal:2',
        'costo_promedio' => 'decimal:2',
        'stock_actual' => 'decimal:2',
        'stock_minimo' => 'decimal:2',
        'stock_maximo' => 'decimal:2',
        'ancho_cm' => 'decimal:2',
        'largo_cm' => 'decimal:2',
        'margen_seguridad_cm' => 'decimal:2',
        'es_rollo' => 'boolean',
        'es_para_nesting' => 'boolean',
        'es_insumo' => 'boolean',
        'requires_recipe' => 'boolean',
        'permite_rotacion' => 'boolean',
        'ancho_imprimible' => 'decimal:2',
        'largo_imprimible' => 'decimal:2',
        'separacion_piezas' => 'decimal:2',
        'sangrado' => 'decimal:2',
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
     * Máquinas/Procesos compatibles con este producto
     */
    public function procesosCompatibles(): BelongsToMany
    {
        return $this->belongsToMany(Proceso::class, 'item_proceso', 'item_id', 'proceso_id');
    }

    /**
     * Papeles compatibles con este producto
     */
    public function papelesCompatibles(): BelongsToMany
    {
        return $this->belongsToMany(Item::class, 'item_compatible_papers', 'product_id', 'paper_id');
    }

    /**
     * Scope para filtrar productos con stock bajo (Usado en el Dashboard)
     */
    public function scopeStockBajo($query)
    {
        return $query->where('tipo', 'Inventariable')
                     ->whereRaw('stock_actual <= stock_minimo');
    }
    /**
     * Relación con las recetas donde este item es el producto final.
     */
    public function ingredientes(): HasMany
    {
        return $this->hasMany(Receta::class, 'producto_id');
    }

    /**
     * Insumos directos (Items) que componen este producto.
     */
    public function insumos(): BelongsToMany
    {
        return $this->belongsToMany(Item::class, 'recetas', 'producto_id', 'insumo_id')
                    ->withPivot('cantidad', 'unidad')
                    ->withTimestamps();
    }

    /**
     * Recetas donde este item es un insumo.
     */
    public function recetasDondeEsInsumo(): HasMany
    {
        return $this->hasMany(Receta::class, 'insumo_id');
    }
}