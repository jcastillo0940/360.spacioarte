<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Sucursal extends Model
{
    protected $table = 'sucursales';
    
    protected $fillable = [
        'contacto_id',
        'codigo',
        'nombre',
        'direccion',
        'telefono',
        'encargado',
        'email',
        'latitud',
        'longitud',
        'activo',
        'notas'
    ];

    protected $casts = [
        'activo' => 'boolean',
        'latitud' => 'decimal:8',
        'longitud' => 'decimal:8'
    ];

    public function contacto(): BelongsTo
    {
        return $this->belongsTo(Contacto::class);
    }
}