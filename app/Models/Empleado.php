<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Empleado extends Model
{
    protected $fillable = [
        'codigo_empleado', 'nombre', 'apellido', 'cedula', 'fecha_nacimiento',
        'email', 'telefono', 'direccion', 'puesto_id', 'fecha_ingreso',
        'tipo_contrato', 'salario_base', 'banco_nombre', 'banco_cuenta', 'activo'
    ];

    public function puesto()
    {
        return $this->belongsTo(Puesto::class);
    }

    // Accesor para nombre completo
    public function getNombreCompletoAttribute()
    {
        return "{$this->nombre} {$this->apellido}";
    }
}