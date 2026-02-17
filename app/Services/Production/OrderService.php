<?php

namespace App\Services\Production;

use App\Models\OrdenVenta;
use App\Enums\OrdenEstado; // Asegúrate de que este Enum exista en el namespace correcto
use Illuminate\Support\Facades\DB;
use Exception;

class OrderService
{
    protected InventoryService $inventoryService;

    public function __construct(InventoryService $inventoryService)
    {
        $this->inventoryService = $inventoryService;
    }

    /**
     * Descuenta los insumos del inventario y cambia el estado.
     * 
     * @param OrdenVenta $orden
     * @param string $nuevoEstado 
     * @return void
     * @throws Exception
     */
    public function cambiarEstado(OrdenVenta $orden, string $nuevoEstado, bool $consumirStock = true): void
    {
        // Normalizamos el estado si viene como Enum
        if ($nuevoEstado instanceof OrdenEstado) {
            $nuevoEstado = $nuevoEstado->value;
        }

        // Si el estado no cambia, no hacemos nada
        if ($orden->estado === $nuevoEstado) {
            return;
        }

        DB::beginTransaction();
        try {
            // Lógica específica al pasar a PRODUCCIÓN
            if ($nuevoEstado === OrdenEstado::PRODUCCION->value && $consumirStock) {
                // 1. Validar Stock para TODOS los items de la orden
                foreach ($orden->detalles as $detalle) {
                    $item = $detalle->item;
                    $cantidad = $detalle->cantidad;

                    $validacion = $this->inventoryService->validarStockReceta($item, $cantidad);
                    if (!$validacion['posible']) {
                        $faltante = $validacion['faltantes'][0]; // Tomamos el primero para el mensaje
                        throw new Exception("Stock insuficiente para '{$item->nombre}': Faltan {$faltante['requerido']} {$faltante['unidad']} de '{$faltante['item']}'");
                    }
                }

                // 2. Descontar Inventario
                foreach ($orden->detalles as $detalle) {
                    $this->inventoryService->consumirReceta($detalle->item, $detalle->cantidad);
                }
            }

            // Actualizar estado de la orden
            $orden->update(['estado' => $nuevoEstado]);

            // Sincronizar estados de órdenes de producción (opcional, según reglas de negocio)
            // Si la orden general pasa a producción, sus tareas hijas también deberían reflejarlo
            if ($nuevoEstado === OrdenEstado::PRODUCCION->value) {
                // Solo actualizamos las que no estén ya terminadas o en producción
                $orden->ordenesProduccion()
                      ->whereNotIn('estado', [OrdenEstado::PRODUCCION->value, OrdenEstado::TERMINADO->value])
                      ->update(['estado' => OrdenEstado::PRODUCCION->value]);
            }

            DB::commit();

            // Broadcastear el cambio de estado (Sincronización Tiempo Real)
            event(new \App\Events\OrderStateChanged($orden, $nuevoEstado));

        } catch (Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * Avanza el estado de una Orden de Producción individual (Tarea).
     * Si pasa a Producción, descuenta los materiales correspondientes a esa tarea.
     */
    public function avanzarOrdenProduccion(\App\Models\OrdenProduccion $ordenProduccion, string $nuevoEstado): void
    {
        if ($nuevoEstado instanceof OrdenEstado) {
            $nuevoEstado = $nuevoEstado->value;
        }

        if ($ordenProduccion->estado === $nuevoEstado) {
            return;
        }

        DB::beginTransaction();
        try {
            // Consumo de Materiales
            if ($nuevoEstado === OrdenEstado::PRODUCCION->value) {
                // Asumimos que item_id apunta al producto/material a fabricar/usar
                $item = $ordenProduccion->materiaPrima; // Relación definida en el modelo
                
                if ($item) {
                     $validacion = $this->inventoryService->validarStockReceta($item, $ordenProduccion->cantidad);
                     if (!$validacion['posible']) {
                        $faltante = $validacion['faltantes'][0];
                        throw new Exception("Stock insuficiente para Tarea #{$ordenProduccion->id}: Faltan {$faltante['requerido']} {$faltante['unidad']} de '{$faltante['item']}'");
                     }
                     $this->inventoryService->consumirReceta($item, $ordenProduccion->cantidad);
                }
            }

            $ordenProduccion->update(['estado' => $nuevoEstado]);

            // Sincronizar Padre si corresponde
            // Si todas las tareas del padre están en Producción o Terminado, movemos el padre a Producción
            // PERO sin re-consumir stock (pasamos false)
            $venta = $ordenProduccion->venta;
            if ($venta && $venta->estado !== OrdenEstado::PRODUCCION->value && $venta->estado !== OrdenEstado::TERMINADO->value) {
                $totalTareas = $venta->ordenesProduccion()->count();
                $tareasEnProceso = $venta->ordenesProduccion()
                                         ->whereIn('estado', [OrdenEstado::PRODUCCION->value, OrdenEstado::TERMINADO->value])
                                         ->count();
                
                if ($tareasEnProceso > 0) { // Al menos una tarea inició, la orden está "En Producción" (Parcial o Total)
                    $this->cambiarEstado($venta, OrdenEstado::PRODUCCION->value, false);
                }
            }

            DB::commit();
        } catch (Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }
}
