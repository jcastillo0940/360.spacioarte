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
        'subtotal', 'itbms_total', 'descuento_tipo', 'descuento_valor', 'descuento_total', 'total', 'saldo_pendiente', 'estado', 'cotizacion_id',
        'fe_provider', 'fe_status', 'fe_legal_status', 'fe_document_id', 'fe_cufe', 'fe_issue_date', 'fe_last_sync_at',
        'fe_public_url', 'fe_container_xml_url', 'fe_request_payload', 'fe_response_payload', 'fe_error_message'
    ];

    protected $casts = [
        'fecha_emision' => 'date',
        'fecha_vencimiento' => 'date',
        'fe_issue_date' => 'datetime',
        'fe_last_sync_at' => 'datetime',
        'fe_request_payload' => 'array',
        'fe_response_payload' => 'array',
        'subtotal' => 'decimal:2',
        'itbms_total' => 'decimal:2',
        'descuento_total' => 'decimal:2',
        'total' => 'decimal:2',
        'saldo_pendiente' => 'decimal:2',
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

    public function cotizacionOriginal(): BelongsTo
    {
        return $this->belongsTo(Cotizacion::class, 'cotizacion_id');
    }
    public function notasCredito(): HasMany
    {
        return $this->hasMany(NotaCredito::class, 'factura_venta_id');
    }

    public function notasDebito(): HasMany
    {
        return $this->hasMany(NotaDebito::class, 'factura_venta_id');
    }

    public function shareLinks(): HasMany
    {
        return $this->hasMany(InvoiceShareLink::class, 'factura_venta_id');
    }
}
