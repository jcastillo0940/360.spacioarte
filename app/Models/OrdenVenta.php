<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class OrdenVenta extends Model
{
    protected $table = 'ordenes_venta';
    
    protected $fillable = [
        'numero_orden',
        'contacto_id',
        'sucursal_id',
        'vendedor_id',
        'fecha_emision',
        'fecha_entrega',
        'subtotal',
        'itbms_total',
        'total',
        'estado',
        'notas',
        'tracking_token',   // Requerido para el Portal del Cliente
        'estado_diseno'     // Requerido para el flujo de aprobación
    ];

    protected $casts = [
        'fecha_emision' => 'date',
        'fecha_entrega' => 'date',
        'subtotal' => 'decimal:2',
        'itbms_total' => 'decimal:2',
        'total' => 'decimal:2'
    ];

    /**
     * Lógica de creación automática de seguridad y estado
     */
    protected static function booted()
    {
        static::creating(function ($orden) {
            // Genera un token único de 40 caracteres para el portal público
            $orden->tracking_token = bin2hex(random_bytes(20));
            $orden->estado_diseno = 'Pendiente';
        });
    }

    // --- RELACIONES DE VENTAS ---

    public function cliente(): BelongsTo
    {
        return $this->belongsTo(Contacto::class, 'contacto_id');
    }

    public function sucursal(): BelongsTo
    {
        return $this->belongsTo(Sucursal::class);
    }

    public function vendedor(): BelongsTo
    {
        return $this->belongsTo(Vendedor::class);
    }

   // Dentro de app/Models/OrdenVenta.php

public function detalles(): HasMany
{
    // Laravel ahora sabrá buscar en 'orden_venta_detalles' gracias al modelo anterior
    return $this->hasMany(OrdenVentaDetalle::class, 'orden_venta_id');
}

    /**
     * Alias para 'detalles' si el controlador usa 'items'
     */
    public function items(): HasMany
    {
        return $this->detalles();
    }

    // --- RELACIONES DE COMUNICACIÓN Y PRODUCCIÓN ---

    /**
     * Chat interactivo con el cliente
     */
    public function mensajes(): HasMany
    {
        return $this->hasMany(OrdenMensaje::class, 'orden_venta_id')->orderBy('created_at', 'asc');
    }

    /**
     * Conexión con el sistema de manufactura
     */
    public function ordenesProduccion(): HasMany
    {
        return $this->hasMany(OrdenProduccion::class, 'orden_venta_id');
    }

    /**
     * ALIAS CRUCIAL: Resuelve el Error 500 del controlador
     */
    public function produccion(): HasMany
    {
        return $this->ordenesProduccion();
    }
}