<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FactoringDocumento extends Model
{
    protected $table = 'factoring_documentos';
    public $timestamps = false;

    protected $fillable = [
        'operacion_id',
        'factura_compra_id',
        'factura_venta_id',
        'nota_credito_id'
    ];

    public function operacion(): BelongsTo
    {
        return $this->belongsTo(OperacionFactoring::class, 'operacion_id');
    }

    public function facturaCompra(): BelongsTo
    {
        return $this->belongsTo(FacturaCompra::class, 'factura_compra_id');
    }

    public function facturaVenta(): BelongsTo
    {
        return $this->belongsTo(FacturaVenta::class, 'factura_venta_id');
    }

    public function notaCredito(): BelongsTo
    {
        return $this->belongsTo(NotaCredito::class, 'nota_credito_id');
    }
}