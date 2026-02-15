<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Ruta extends Model
{
    protected $guarded = [];

    public function vendedor()
    {
        return $this->belongsTo(User::class, 'vendedor_id');
    }

    public function vehiculo()
    {
        return $this->belongsTo(Vehiculo::class, 'vehiculo_id');
    }

    public function clientes()
    {
        return $this->belongsToMany(Contacto::class, 'ruta_clientes', 'ruta_id', 'contacto_id')
                    ->withPivot('dia_visita', 'orden')
                    ->orderBy('ruta_clientes.orden');
    }
}