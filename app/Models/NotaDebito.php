<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class NotaDebito extends Model
{
    protected $table = 'notas_debito';

    protected $appends = [
        'numero',
        'factura_referencia',
        'es_electronica_emitida',
    ];

    protected $fillable = [
        'numero_nota',
        'factura_venta_id',
        'factura_manual_ref',
        'fecha_factura_original',
        'contacto_id',
        'sucursal_id',
        'fecha',
        'tipo_nota',
        'motivo',
        'subtotal',
        'itbms_total',
        'total',
        'estado',
        'fe_provider',
        'fe_status',
        'fe_legal_status',
        'fe_document_id',
        'fe_cufe',
        'fe_issue_date',
        'fe_last_sync_at',
        'fe_public_url',
        'fe_container_xml_url',
        'fe_request_payload',
        'fe_response_payload',
        'fe_error_message',
    ];

    protected $casts = [
        'fecha' => 'date',
        'fecha_factura_original' => 'date',
        'subtotal' => 'decimal:2',
        'itbms_total' => 'decimal:2',
        'total' => 'decimal:2',
        'fe_issue_date' => 'datetime',
        'fe_last_sync_at' => 'datetime',
        'fe_request_payload' => 'array',
        'fe_response_payload' => 'array',
    ];

    protected $attributes = [
        'estado' => 'Activa',
        'tipo_nota' => 'ajuste',
    ];

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
        return $this->hasMany(NotaDebitoDetalle::class, 'nota_debito_id');
    }

    public function getTipoNotaDescripcionAttribute(): string
    {
        return [
            'recargo' => 'Recargo',
            'interes' => 'Interes por mora',
            'ajuste' => 'Ajuste de precio',
        ][$this->tipo_nota] ?? $this->tipo_nota;
    }

    public function getEsManualAttribute(): bool
    {
        return !empty($this->factura_manual_ref);
    }

    public function getNumeroAttribute(): ?string
    {
        return $this->numero_nota;
    }

    public function getFacturaReferenciaAttribute(): ?string
    {
        return $this->factura?->numero_factura ?: $this->factura_manual_ref;
    }

    public function getEsElectronicaEmitidaAttribute(): bool
    {
        $status = strtoupper((string) $this->fe_status);
        $legalStatus = strtoupper((string) $this->fe_legal_status);

        return !blank($this->fe_document_id)
            || !blank($this->fe_cufe)
            || in_array($status, ['SENT', 'PROCESSED', 'FINISHED', 'DGI_REQUEST'], true)
            || str_contains($legalStatus, 'AUTHORIZED');
    }

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
