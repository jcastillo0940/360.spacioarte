<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PosCaja extends Model
{
    protected $table = 'pos_cajas';
    protected $fillable = ['nombre', 'sucursal_id', 'activa'];

    public function sucursal(): BelongsTo
    {
        return $this->belongsTo(Sucursal::class);
    }

    public function sesiones(): HasMany
    {
        return $this->hasMany(PosSesion::class, 'caja_id');
    }

    public function sessionActiva()
    {
        return $this->sesiones()->where('estado', 'Abierta')->first();
    }
}
