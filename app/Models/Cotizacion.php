<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Cotizacion extends Model
{
    use HasFactory;

    protected $table = 'cotizaciones';

    protected $fillable = [
        'numero_cotizacion',
        'contacto_id',
        'user_id',
        'estado',
        'fecha_emision',
        'fecha_vencimiento',
        'subtotal',
        'itbms_total',
        'total',
        'notas_internas',
        'terminos_condiciones'
    ];

    protected $casts = [
        'fecha_emision' => 'date',
        'fecha_vencimiento' => 'date',
        'subtotal' => 'decimal:2',
        'itbms_total' => 'decimal:2',
        'total' => 'decimal:2',
    ];

    public function cliente(): BelongsTo
    {
        return $this->belongsTo(Contacto::class, 'contacto_id');
    }

    public function vendedor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function detalles(): HasMany
    {
        return $this->hasMany(CotizacionDetalle::class, 'cotizacion_id');
    }

    public function ordenesVenta(): HasMany
    {
        return $this->hasMany(OrdenVenta::class, 'cotizacion_id');
    }

    public function facturasVenta(): HasMany
    {
        return $this->hasMany(FacturaVenta::class, 'cotizacion_id');
    }
}
