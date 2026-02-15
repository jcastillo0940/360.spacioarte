<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BankAccount extends Model
{
    protected $fillable = ['nombre_banco', 'numero_cuenta', 'tipo_cuenta', 'moneda', 'account_id', 'saldo_actual', 'activo'];

    public function transactions()
    {
        return $this->hasMany(BankTransaction::class);
    }

    public function accountContable()
    {
        return $this->belongsTo(Account::class, 'account_id');
    }
}