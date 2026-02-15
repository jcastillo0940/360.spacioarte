<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Vehiculo extends Model
{
    protected $fillable = [
        'placa', 'marca', 'modelo', 'anio', 'chasis', 'motor', 'color',
        'tipo_combustible', 'capacidad_carga', 'kilometraje_actual',
        'estado', 'vencimiento_seguro', 'vencimiento_revision', 'conductor_asignado_id'
    ];

    // Relación con el conductor asignado [cite: 427]
    public function conductor()
    {
        return $this->belongsTo(Empleado::class, 'conductor_asignado_id');
    }

    // Historial de combustible para reportes [cite: 440]
    public function cargasCombustible()
    {
        return $this->hasMany(VehiculoCombustible::class);
    }

    // Historial de servicios técnicos [cite: 433]
    public function mantenimientos()
    {
        return $this->hasMany(VehiculoMantenimiento::class);
    }

    /**
     * Calcula el rendimiento promedio (Km por Galón) [cite: 439]
     */
    public function getRendimientoPromedioAttribute()
    {
        $cargas = $this->cargasCombustible()->orderBy('kilometraje_registro', 'desc')->take(2)->get();
        if ($cargas->count() < 2) return 0;

        $distancia = $cargas[0]->kilometraje_registro - $cargas[1]->kilometraje_registro;
        return $distancia / $cargas[0]->cantidad_galones;
    }
}