<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class CompraRecepcion extends Model
{
    use HasFactory;

    protected $table = 'compras_recepciones';

    protected $fillable = [
        'numero_recepcion',
        'orden_compra_id',
        'factura_compra_id',
        'contacto_id',
        'fecha_recepcion',
        'notas',
        'estado'
    ];

    public function ordenCompra()
    {
        return $this->belongsTo(OrdenCompra::class, 'orden_compra_id');
    }

    public function facturaCompra()
    {
        return $this->belongsTo(FacturaCompra::class, 'factura_compra_id');
    }

    public function contacto()
    {
        return $this->belongsTo(Contacto::class);
    }

    public function detalles()
    {
        return $this->hasMany(CompraRecepcionDetalle::class, 'recepcion_id');
    }
}
