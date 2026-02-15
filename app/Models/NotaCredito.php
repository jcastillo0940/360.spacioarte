<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\{BelongsTo, HasMany};

class NotaCredito extends Model
{
    protected $table = 'notas_credito';

    protected $fillable = [
        'numero_nota',
        'factura_venta_id',      // Nullable - para NC de facturas del sistema
        'factura_manual_ref',    // Para NC de facturas manuales/físicas
        'fecha_factura_original',
        'contacto_id',           // Cliente directo (requerido si no hay factura_venta_id)
        'sucursal_id',
        'fecha',
        'tipo_nota',
        'motivo',
        'subtotal',
        'itbms_total',
        'total',
        'estado',
        'es_merma',
    ];

    protected $casts = [
        'fecha' => 'date',
        'fecha_factura_original' => 'date',
        'subtotal' => 'decimal:2',
        'itbms_total' => 'decimal:2',
        'total' => 'decimal:2',
        'es_merma' => 'boolean',
    ];

    protected $attributes = [
        'estado' => 'Activa',
        'tipo_nota' => 'devolucion',
        'es_merma' => false,
    ];

    // Relaciones
    public function factura(): BelongsTo
    {
        return $this->belongsTo(FacturaVenta::class, 'factura_venta_id');
    }

    public function cliente(): BelongsTo
    {
        return $this->belongsTo(Contacto::class, 'contacto_id');
    }

    public function sucursal(): BelongsTo
    {
        return $this->belongsTo(Sucursal::class, 'sucursal_id');
    }

    public function detalles(): HasMany
    {
        return $this->hasMany(NotaCreditoDetalle::class, 'nota_credito_id');
    }
    public function factoringOperaciones(): HasMany
    {
        return $this->hasMany(OperacionFactoring::class, 'nota_credito_id');
    }

    // Accessors
    public function getTipoNotaDescripcionAttribute()
    {
        $tipos = [
            'devolucion' => 'Devolución de Producto',
            'merma' => 'Merma/Producto Dañado',
            'descuento' => 'Descuento/Ajuste de Precio'
        ];
        return $tipos[$this->tipo_nota] ?? $this->tipo_nota;
    }

    public function getEsManualAttribute()
    {
        return !empty($this->factura_manual_ref);
    }

    // Scopes
    public function scopeTipo($query, $tipo)
    {
        return $query->where('tipo_nota', $tipo);
    }

    public function scopeActivas($query)
    {
        return $query->where('estado', 'Activa');
    }

    public function scopeManuales($query)
    {
        return $query->whereNotNull('factura_manual_ref');
    }

    public function scopeSistema($query)
    {
        return $query->whereNotNull('factura_venta_id');
    }
}