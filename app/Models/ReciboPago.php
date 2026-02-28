<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ReciboPago extends Model
{
    protected $table = 'recibos_pago';

    protected $fillable = [
        'numero_recibo', 'factura_venta_id', 'bank_account_id', 'pos_sesion_id',
        'fecha_pago', 'monto_pagado', 'metodo_pago', 'referencia', 'notas', 'pdf_path'
    ];

    public function factura()
    {
        return $this->belongsTo(FacturaVenta::class, 'factura_venta_id');
    }

    public function cuentaBancaria()
    {
        return $this->belongsTo(BankAccount::class, 'bank_account_id');
    }
}