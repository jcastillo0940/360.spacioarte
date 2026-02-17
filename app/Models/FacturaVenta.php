<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class FacturaVenta extends Model
{
    protected $table = 'facturas_venta';

    protected $fillable = [
        'numero_factura', 'contacto_id', 'vendedor_id', 'orden_venta_id', 'pos_sesion_id',
        'fecha_emision', 'fecha_vencimiento', 'payment_term_id',
        'subtotal', 'itbms_total', 'total', 'saldo_pendiente', 'estado'
    ];

    public function cliente(): BelongsTo
    {
        return $this->belongsTo(Contacto::class, 'contacto_id');
    }

    public function vendedor(): BelongsTo
    {
        return $this->belongsTo(Vendedor::class, 'vendedor_id');
    }

    public function detalles(): HasMany
    {
        return $this->hasMany(FacturaVentaDetalle::class, 'factura_venta_id');
    }

    public function ordenOriginal(): BelongsTo
    {
        return $this->belongsTo(OrdenVenta::class, 'orden_venta_id');
    }
    public function notasCredito(): HasMany
    {
        return $this->hasMany(NotaCredito::class, 'factura_venta_id');
    }
}