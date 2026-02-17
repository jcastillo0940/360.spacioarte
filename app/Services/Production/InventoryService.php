<?php

namespace App\Services\Production;

use App\Models\Item;
use Illuminate\Support\Facades\DB;
use Exception;

class InventoryService
{
    /**
     * Valida si existe suficiente stock de insumos para fabricar una cantidad dada de un producto.
     * 
     * @param Item $producto
     * @param float $cantidadSolicitada
     * @return array ['posible' => bool, 'faltantes' => array]
     */
    public function validarStockReceta(Item $producto, float $cantidadSolicitada): array
    {
        $insumos = $producto->insumos;
        $faltantes = [];

        // Si no tiene receta, validamos el stock del producto mismo (si es inventariable)
        if ($insumos->isEmpty()) {
            if ($producto->tipo === 'Inventariable' && $producto->stock_actual < $cantidadSolicitada) {
                $faltantes[] = [
                    'item' => $producto->nombre,
                    'requerido' => $cantidadSolicitada,
                    'disponible' => $producto->stock_actual
                ];
            }
            return [
                'posible' => empty($faltantes),
                'faltantes' => $faltantes
            ];
        }

        // Si tiene receta, validamos cada insumo
        foreach ($insumos as $insumo) {
            $cantidadRequerida = $insumo->pivot->cantidad * $cantidadSolicitada;
            
            if ($insumo->stock_actual < $cantidadRequerida) {
                $faltantes[] = [
                    'item' => $insumo->nombre,
                    'requerido' => $cantidadRequerida,
                    'disponible' => $insumo->stock_actual,
                    'unidad' => $insumo->pivot->unidad
                ];
            }
        }

        return [
            'posible' => empty($faltantes),
            'faltantes' => $faltantes
        ];
    }

    /**
     * Descuenta los insumos del inventario basado en la receta.
     * 
     * @param Item $producto
     * @param float $cantidadSolicitada
     * @throws Exception Si no hay stock suficiente (debe validarse antes o se lanzará error aquí)
     */
    public function consumirReceta(Item $producto, float $cantidadSolicitada): void
    {
        // Validamos nuevamente dentro de la transacción (o confiamos en el caller)
        // Por seguridad, hacemos lock for update si fuera crítico, pero por ahora confiamos en la lógica.

        $insumos = $producto->insumos;

        if ($insumos->isEmpty()) {
            if ($producto->tipo === 'Inventariable') {
                if ($producto->stock_actual < $cantidadSolicitada) {
                    throw new Exception("Stock insuficiente de {$producto->nombre}");
                }
                $producto->decrement('stock_actual', $cantidadSolicitada);
            }
            return;
        }

        foreach ($insumos as $insumo) {
            $cantidadRequerida = $insumo->pivot->cantidad * $cantidadSolicitada;
            
            if ($insumo->stock_actual < $cantidadRequerida) {
                throw new Exception("Stock insuficiente de insumo: {$insumo->nombre}. Requerido: {$cantidadRequerida}, Disponible: {$insumo->stock_actual}");
            }

            $insumo->decrement('stock_actual', $cantidadRequerida);
        }
    }
}
