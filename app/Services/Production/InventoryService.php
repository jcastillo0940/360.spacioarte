<?php

namespace App\Services\Production;

use App\Models\Item;
use App\Models\Receta;
use App\Services\InventoryMovementService;
use Illuminate\Support\Facades\DB;
use Exception;

class InventoryService
{
    public function __construct(protected InventoryMovementService $movementService)
    {
    }

    /**
     * Valida si existe suficiente stock de insumos para fabricar una cantidad dada de un producto.
     * 
     * @param Item $producto
     * @param float $cantidadSolicitada
     * @return array ['posible' => bool, 'faltantes' => array]
     */
    public function validarStockReceta(Item $producto, float $cantidadSolicitada): array
    {
        $ingredientes = $producto->ingredientes()->with('insumo')->get();
        $faltantes = [];

        // Si el producto no tiene BOM explicita, intentamos al menos validar el material base de transformacion.
        if ($ingredientes->isEmpty()) {
            if ($producto->requires_recipe && $producto->productoBase) {
                $base = $producto->productoBase;
                if ($base->stock_actual < $cantidadSolicitada) {
                    $faltantes[] = [
                        'item' => $base->nombre,
                        'requerido' => $cantidadSolicitada,
                        'disponible' => $base->stock_actual,
                        'unidad' => $base->unidad_medida ?: 'UND',
                    ];
                }
            }

            if ($producto->tipo === 'Inventariable' && $producto->stock_actual < $cantidadSolicitada) {
                $faltantes[] = [
                    'item' => $producto->nombre,
                    'requerido' => $cantidadSolicitada,
                    'disponible' => $producto->stock_actual,
                    'unidad' => $producto->unidad_medida ?: 'UND',
                ];
            }
            return [
                'posible' => empty($faltantes),
                'faltantes' => $faltantes
            ];
        }

        // Si tiene receta, validamos cada ingrediente
        foreach ($ingredientes as $receta) {
            if ($this->seConsumeEnNesting($receta)) {
                continue;
            }

            $insumo = $receta->insumo;
            $cantidadRequerida = $receta->cantidad * $cantidadSolicitada;
            
            if ($insumo->stock_actual < $cantidadRequerida) {
                $faltantes[] = [
                    'item' => $insumo->nombre,
                    'requerido' => $cantidadRequerida,
                    'disponible' => $insumo->stock_actual,
                    'unidad' => $receta->unidad
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

        $ingredientes = $producto->ingredientes()->with('insumo')->get();

        if ($ingredientes->isEmpty()) {
            if ($producto->requires_recipe && $producto->productoBase) {
                $this->consumirDirecto($producto->productoBase, $cantidadSolicitada, 'Transformacion Base', $producto);
            }

            if ($producto->tipo === 'Inventariable') {
                $this->consumirDirecto($producto, $cantidadSolicitada, 'Produccion Directa', $producto);
            }
            return;
        }

        foreach ($ingredientes as $receta) {
            if ($this->seConsumeEnNesting($receta)) {
                continue;
            }

            $insumo = $receta->insumo;
            $cantidadRequerida = $receta->cantidad * $cantidadSolicitada;
            
            if ($insumo->stock_actual < $cantidadRequerida) {
                throw new Exception("Stock insuficiente de insumo: {$insumo->nombre}. Requerido: {$cantidadRequerida}, Disponible: {$insumo->stock_actual}");
            }

            $stockAnterior = floatval($insumo->stock_actual);
            $costoAnterior = floatval($insumo->costo_promedio);
            $stockPosterior = $stockAnterior - $cantidadRequerida;
            $insumo->update(['stock_actual' => $stockPosterior]);
            $this->movementService->record(
                item: $insumo,
                naturaleza: 'Salida',
                cantidad: $cantidadRequerida,
                costoUnitario: $costoAnterior,
                stockAnterior: $stockAnterior,
                stockPosterior: $stockPosterior,
                costoAnterior: $costoAnterior,
                costoPosterior: $costoAnterior,
                origen: 'Consumo Receta',
                referencia: $producto->codigo,
                observacion: "Consumo por receta para {$producto->nombre}",
                meta: [
                    'producto_id' => $producto->id,
                    'producto_codigo' => $producto->codigo,
                    'cantidad_solicitada' => $cantidadSolicitada,
                    'unidad' => $receta->unidad,
                ]
            );
        }
    }

    private function seConsumeEnNesting(Receta $receta): bool
    {
        $insumo = $receta->insumo;

        return (bool) ($insumo?->es_para_nesting);
    }

    private function consumirDirecto(Item $item, float $cantidad, string $origen, Item $productoReferencia): void
    {
        if ($item->stock_actual < $cantidad) {
            throw new Exception("Stock insuficiente de {$item->nombre}");
        }

        $stockAnterior = floatval($item->stock_actual);
        $costoAnterior = floatval($item->costo_promedio);
        $stockPosterior = $stockAnterior - $cantidad;

        $item->update(['stock_actual' => $stockPosterior]);

        $this->movementService->record(
            item: $item,
            naturaleza: 'Salida',
            cantidad: $cantidad,
            costoUnitario: $costoAnterior,
            stockAnterior: $stockAnterior,
            stockPosterior: $stockPosterior,
            costoAnterior: $costoAnterior,
            costoPosterior: $costoAnterior,
            origen: $origen,
            referencia: $productoReferencia->codigo,
            observacion: "Consumo directo para {$productoReferencia->nombre}",
            meta: [
                'producto_id' => $productoReferencia->id,
                'producto_codigo' => $productoReferencia->codigo,
                'cantidad_solicitada' => $cantidad,
                'unidad' => $item->unidad_medida ?: 'UND',
            ]
        );
    }
}
