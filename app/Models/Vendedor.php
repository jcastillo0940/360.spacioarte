<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Vendedor extends Model
{
    use HasFactory;

    protected $table = 'vendedores';

    protected $fillable = [
        'nombre_completo',
        'identificacion',
        'telefono',
        'email',
        'zona_venta',
        'porcentaje_comision',
        'meta_mensual',
        'activo',
        'user_id'
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Scope para filtrar solo vendedores activos
     */
    public function scopeActivos($query)
    {
        return $query->where('activo', true);
    }
}