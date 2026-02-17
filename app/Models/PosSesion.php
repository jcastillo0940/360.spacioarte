<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PosSesion extends Model
{
    protected $table = 'pos_sesiones';
    protected $fillable = [
        'caja_id', 'user_id', 'monto_apertura', 'monto_cierre', 
        'monto_esperado_efectivo', 'diferencia', 
        'fecha_apertura', 'fecha_cierre', 'estado', 'observaciones'
    ];

    protected $casts = [
        'fecha_apertura' => 'datetime',
        'fecha_cierre' => 'datetime',
        'monto_apertura' => 'decimal:2',
        'monto_cierre' => 'decimal:2',
        'monto_esperado_efectivo' => 'decimal:2',
        'diferencia' => 'decimal:2',
    ];

    public function caja(): BelongsTo
    {
        return $this->belongsTo(PosCaja::class, 'caja_id');
    }

    public function cajero(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function movimientos(): HasMany
    {
        return $this->hasMany(PosMovimiento::class, 'pos_sesion_id');
    }

    public function facturas(): HasMany
    {
        return $this->hasMany(FacturaVenta::class, 'pos_sesion_id');
    }

    public function pagos(): HasMany
    {
        return $this->hasMany(ReciboPago::class, 'pos_sesion_id');
    }
}
