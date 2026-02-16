<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class OrdenVenta extends Model
{
    protected $table = 'ordenes_venta';
    
    protected $fillable = [
        'numero_orden',
        'contacto_id',
        'sucursal_id',
        'vendedor_id',
        'fecha_emision',
        'fecha_entrega',
        'subtotal',
        'itbms_total',
        'total',
        'estado',
        'notas',
        'tracking_token',
        'estado_diseno'
    ];

    protected $casts = [
        'fecha_emision' => 'date',
        'fecha_entrega' => 'date',
        'subtotal' => 'decimal:2',
        'itbms_total' => 'decimal:2',
        'total' => 'decimal:2'
    ];

    protected static function booted()
    {
        static::creating(function ($orden) {
            $orden->tracking_token = bin2hex(random_bytes(20));
            $orden->estado_diseno = 'Pendiente';
        });
    }

    public function cliente(): BelongsTo
    {
        return $this->belongsTo(Contacto::class, 'contacto_id');
    }

    public function sucursal(): BelongsTo
    {
        return $this->belongsTo(Sucursal::class);
    }

    public function vendedor(): BelongsTo
    {
        return $this->belongsTo(Vendedor::class);
    }

    public function detalles(): HasMany
    {
        return $this->hasMany(OrdenVentaDetalle::class, 'orden_venta_id');
    }

    public function items(): HasMany
    {
        return $this->detalles();
    }

    public function ordenesProduccion(): HasMany
    {
        return $this->hasMany(OrdenProduccion::class, 'orden_venta_id');
    }

    public function produccion(): HasMany
    {
        return $this->ordenesProduccion();
    }
}