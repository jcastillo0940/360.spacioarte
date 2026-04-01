<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BankAccount extends Model
{
    protected $fillable = ['nombre_banco', 'numero_cuenta', 'tipo_cuenta', 'moneda', 'account_id', 'saldo_actual', 'activo'];

    protected $casts = [
        'saldo_actual' => 'decimal:2',
        'activo' => 'boolean',
    ];

    public function transactions()
    {
        return $this->hasMany(BankTransaction::class);
    }

    public function accountContable()
    {
        return $this->belongsTo(Account::class, 'account_id');
    }
}
