<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class InventarioVehiculo extends Model
{
    protected $table = 'inventario_vehiculo';
    protected $guarded = [];

    public function item()
    {
        return $this->belongsTo(Item::class);
    }
    
    public function vehiculo()
    {
        return $this->belongsTo(Vehiculo::class);
    }
}