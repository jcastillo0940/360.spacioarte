<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Egreso extends Model
{
    protected $fillable = [
        'numero_egreso', 
        'factura_compra_id', 
        'bank_account_id', 
        'fecha_pago', 
        'monto_pagado', 
        'metodo_pago', 
        'referencia', 
        'notas'
    ];

    public function facturaCompra()
    {
        return $this->belongsTo(FacturaCompra::class);
    }

    public function cuentaBancaria()
    {
        return $this->belongsTo(BankAccount::class, 'bank_account_id');
    }
}