<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PosMetodoPago extends Model
{
    use HasFactory;

    protected $table = 'pos_metodo_pagos';

    protected $fillable = [
        'nombre',
        'tipo',
        'bank_account_id',
        'activo',
        'requiere_referencia'
    ];

    protected $casts = [
        'activo' => 'boolean',
        'requiere_referencia' => 'boolean'
    ];

    public function cuentaBancaria()
    {
        return $this->belongsTo(BankAccount::class, 'bank_account_id');
    }
}
