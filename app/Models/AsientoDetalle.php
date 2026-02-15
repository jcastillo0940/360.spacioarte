<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AsientoDetalle extends Model
{
    protected $table = 'asiento_detalles';

    protected $fillable = [
        'asiento_id', 
        'account_id', 
        'debito', 
        'credito'
    ];

    public function asiento(): BelongsTo
    {
        return $this->belongsTo(Asiento::class);
    }

    public function cuenta(): BelongsTo
    {
        return $this->belongsTo(Account::class, 'account_id');
    }
}