<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class FacturaCompra extends Model
{
    protected $table = 'facturas_compra';
    
    protected $fillable = [
        'numero_factura_proveedor',
        'contacto_id',
        'orden_compra_id',
        'fecha_emision',
        'fecha_vencimiento',
        'subtotal',
        'itbms_total',
        'total',
        'saldo_pendiente',
        'estado'
    ];

    protected $casts = [
        'fecha_emision' => 'date',
        'fecha_vencimiento' => 'date',
        'subtotal' => 'decimal:2',
        'itbms_total' => 'decimal:2',
        'total' => 'decimal:2',
        'saldo_pendiente' => 'decimal:2'
    ];

    public function proveedor(): BelongsTo
    {
        return $this->belongsTo(Contacto::class, 'contacto_id');
    }

    public function ordenOriginal(): BelongsTo
    {
        return $this->belongsTo(OrdenCompra::class, 'orden_compra_id');
    }

    public function detalles(): HasMany
    {
        return $this->hasMany(FacturaCompraDetalle::class, 'factura_compra_id');
    }
}