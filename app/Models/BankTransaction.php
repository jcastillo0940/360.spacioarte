<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BankTransaction extends Model
{
    protected $fillable = ['bank_account_id', 'tipo', 'monto', 'fecha', 'referencia', 'descripcion', 'categoria_contable', 'conciliado'];

    protected static function booted()
    {
        // Al crear una transacción, actualizamos el saldo de la cuenta automáticamente
        static::created(function ($transaction) {
            $account = $transaction->bankAccount;
            if ($transaction->tipo === 'Ingreso') {
                $account->increment('saldo_actual', $transaction->monto);
            } else {
                $account->decrement('saldo_actual', $transaction->monto);
            }
        });
    }

    public function bankAccount()
    {
        return $this->belongsTo(BankAccount::class);
    }
}