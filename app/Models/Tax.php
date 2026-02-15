<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Tax extends Model
{
    protected $fillable = ['nombre', 'tasa', 'codigo_dgi', 'es_exento', 'activo'];
}