<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PaymentTerm extends Model
{
    protected $table = 'payment_terms';
    
    protected $fillable = [
        'nombre',
        'dias_vencimiento'
    ];

    protected $casts = [
        'dias_vencimiento' => 'integer'
    ];
}