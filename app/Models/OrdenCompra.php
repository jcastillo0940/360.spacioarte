<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class OrdenCompra extends Model
{
    protected $table = 'ordenes_compra';
    
    protected $fillable = [
        'numero_orden',
        'contacto_id',
        'fecha_emision',
        'fecha_entrega',
        'total',
        'estado',
        'notas'
    ];

    protected $casts = [
        'fecha_emision' => 'date',
        'fecha_entrega' => 'date',
        'total' => 'decimal:2'
    ];

    public function proveedor(): BelongsTo
    {
        return $this->belongsTo(Contacto::class, 'contacto_id');
    }

    public function detalles(): HasMany
    {
        return $this->hasMany(OrdenCompraDetalle::class, 'orden_compra_id');
    }
    
    public function recepciones()
{
    return $this->hasMany(RecepcionOrden::class, 'orden_compra_id');
}
}
