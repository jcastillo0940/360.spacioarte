<?php

namespace App\Enums;

enum OrdenEstado: string
{
    case BORRADOR = 'Borrador';
    case CONFIRMADA = 'Confirmada';
    case FACTURADA = 'Facturada';
    case PENDIENTE = 'Pendiente';
    case DISENO = 'Diseño';
    case NESTING = 'Pre-Prensa';
    case PRODUCCION = 'Producción';
    case TERMINADO = 'Terminado';
    case ENTREGADO = 'Entregado';
    case CANCELADO = 'Cancelada';

    public function label(): string
    {
        return match($this) {
            self::PENDIENTE => 'Pendiente / Pago Validado',
            self::DISENO => 'En Diseño / Vectorización',
            self::NESTING => 'Nesting / Pre-Prensa',
            self::PRODUCCION => 'En Maquinaria',
            self::TERMINADO => 'Terminado / Listo',
            self::ENTREGADO => 'Entregado',
        };
    }
}
