<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ProduccionRequisicion extends Model
{
    protected $table = 'produccion_requisiciones';
    protected $fillable = ['user_id', 'jefe_bodega_id', 'estado', 'notas_solicitante', 'notas_bodega'];

    public function items() {
        return $this->hasMany(ProduccionRequisicionItem::class, 'requisicion_id');
    }

    public function solicitante() {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function autorizador() {
        return $this->belongsTo(User::class, 'jefe_bodega_id');
    }

    public function ordenCompra() {
        return $this->hasOne(OrdenCompra::class, 'requisicion_id');
    }
}