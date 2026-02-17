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
        'user_id',
        'referencia_externa',
        'fecha_emision',
        'fecha_entrega',
        'subtotal',
        'itbms_total',
        'total',
        'estado',
        'notas',
        'observaciones',
        'tracking_token',
        'estado_diseno',
        'imagen_referencia',
        'imagen_diseno',
        'diseno_intentos',
        'diseno_notas',
        'diseno_cobro_aprobado',
        'diseno_cobro_aprobado_at',
        'diseno_minutos_acumulados',
        'diseno_monto_calculado',
        'monto_abonado',
        'metodo_pago_inicial',
        'metodo_pago_referencia',
        'cliente_envia_muestra',
        'cliente_envia_archivo',
        'detalle_diseno',
        'brief_cliente',
        'archivo_brief_path'
    ];

    public function disenoHistorial(): HasMany
    {
        return $this->hasMany(DisenoHistorial::class, 'orden_venta_id');
    }

    public function latestDiseno(): \Illuminate\Database\Eloquent\Relations\HasOne
    {
        return $this->hasOne(DisenoHistorial::class, 'orden_venta_id')->latestOfMany();
    }

    public function tiempos(): HasMany
    {
        return $this->hasMany(ProduccionTiempo::class, 'orden_venta_id');
    }

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