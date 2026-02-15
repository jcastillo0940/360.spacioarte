<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class OperacionFactoring extends Model
{
    protected $table = 'operaciones_factoring';

    protected $fillable = [
        'numero_operacion',
        'tipo',
        'factura_compra_id', // Se mantiene por compatibilidad
        'factura_venta_id',  // Se mantiene por compatibilidad
        'nota_credito_id',   // Se mantiene por compatibilidad
        'fecha_operacion',
        'monto_factura',
        'porcentaje',
        'monto_descuento',
        'monto_neto',
        'bank_account_id',
        'entidad_financiera',
        'numero_operacion_externa',
        'notas',
        'estado'
    ];

    protected $casts = [
        'fecha_operacion' => 'date',
        'monto_factura' => 'decimal:2',
        'porcentaje' => 'decimal:2',
        'monto_descuento' => 'decimal:2',
        'monto_neto' => 'decimal:2',
    ];

    protected $attributes = [
        'estado' => 'Activa'
    ];

    /**
     * Relación para soportar múltiples documentos por operación
     */
    public function detalles(): HasMany
    {
        return $this->hasMany(FactoringDocumento::class, 'operacion_id');
    }

    // Relaciones Originales (No borradas)
    public function facturaCompra(): BelongsTo
    {
        return $this->belongsTo(FacturaCompra::class, 'factura_compra_id');
    }

    public function facturaVenta(): BelongsTo
    {
        return $this->belongsTo(FacturaVenta::class, 'factura_venta_id');
    }

    public function cuentaBancaria(): BelongsTo
    {
        return $this->belongsTo(BankAccount::class, 'bank_account_id');
    }
    
    public function notaCredito(): BelongsTo
    {
        return $this->belongsTo(NotaCredito::class, 'nota_credito_id');
    }

    // Accessors Originales
    public function getTipoDescripcionAttribute()
    {
        return $this->tipo === 'compra' 
            ? 'Descuento Pronto Pago (Proveedor)' 
            : 'Cargo por Factoring (Cliente)';
    }

    public function getContactoAttribute()
    {
        if ($this->tipo === 'compra' && $this->facturaCompra) {
            return $this->facturaCompra->proveedor;
        }
        if ($this->tipo === 'venta' && $this->facturaVenta) {
            return $this->facturaVenta->cliente;
        }
        return null;
    }

    // Scopes Originales
    public function scopeActivas($query)
    {
        return $query->where('estado', 'Activa');
    }

    public function scopeCompras($query)
    {
        return $query->where('tipo', 'compra');
    }

    public function scopeVentas($query)
    {
        return $query->where('tipo', 'venta');
    }
}