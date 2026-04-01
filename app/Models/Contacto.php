<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Contacto extends Model
{
    protected $table = 'contactos';
    
    protected $fillable = [
        'razon_social',
        'tipo_identificacion',
        'identificacion',
        'digito_verificador',
        'requiere_factura_electronica',
        'dv',
        'direccion',
        'telefono',
        'email',
        'es_cliente',
        'es_proveedor',
        'payment_term_id',
        'limite_credito'
    ];

    protected $casts = [
        'es_cliente' => 'boolean',
        'es_proveedor' => 'boolean',
        'requiere_factura_electronica' => 'boolean',
        'limite_credito' => 'decimal:2'
    ];

    // AGREGAR ESTA RELACIÓN
    public function payment_term(): BelongsTo
    {
        return $this->belongsTo(PaymentTerm::class);
    }

    public function facturas(): HasMany
    {
        return $this->hasMany(FacturaVenta::class, 'contacto_id');
    }
    
    public function sucursales(): HasMany
    {
        return $this->hasMany(Sucursal::class);
    }

    public function crmLeads(): HasMany
    {
        return $this->hasMany(CrmLead::class, 'contacto_id');
    }
}
