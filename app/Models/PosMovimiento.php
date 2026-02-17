<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PosMovimiento extends Model
{
    protected $table = 'pos_movimientos';
    protected $fillable = [
        'pos_sesion_id', 'tipo', 'monto', 'metodo_pago', 
        'concepto', 'referencia', 'user_id'
    ];

    protected $casts = [
        'monto' => 'decimal:2',
    ];

    public function sesion(): BelongsTo
    {
        return $this->belongsTo(PosSesion::class, 'pos_sesion_id');
    }

    public function usuario(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
