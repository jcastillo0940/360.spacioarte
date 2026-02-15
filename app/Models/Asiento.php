<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Asiento extends Model
{
    protected $table = 'asientos';
    
    protected $fillable = [
        'fecha', 
        'referencia', 
        'concepto', 
        'total_debito', 
        'total_credito'
    ];

    public function detalles(): HasMany
    {
        return $this->hasMany(AsientoDetalle::class, 'asiento_id');
    }
}