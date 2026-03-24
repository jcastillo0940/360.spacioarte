<?php

namespace App\Console\Commands;

use App\Models\CompraRecepcion;
use App\Models\InventoryMovement;
use App\Models\NotaCredito;
use App\Models\PliegoImpresion;
use App\Models\RecepcionOrden;
use App\Models\FacturaVenta;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class BackfillInventoryKardex extends Command
{
    protected $signature = 'inventory:backfill-kardex
                            {--dry-run : Simula el proceso sin escribir registros}
                            {--reset : Elimina movimientos existentes antes de reconstruir}
                            {--from= : Fecha inicial YYYY-MM-DD}
                            {--to= : Fecha final YYYY-MM-DD}';

    protected $description = 'Reconstruye el kardex historico persistente desde documentos fuente del sistema';

    public function handle(): int
    {
        $dryRun = (bool) $this->option('dry-run');
        $reset = (bool) $this->option('reset');
        $from = $this->option('from');
        $to = $this->option('to');

        if ($dryRun) {
            $this->warn('Modo simulacion activo: no se guardaran movimientos.');
        }

        if ($reset && $dryRun) {
            $this->warn('La opcion --reset se ignorara en --dry-run.');
        }

        $stats = [
            'recepciones_oc' => 0,
            'recepciones_factura' => 0,
            'ventas' => 0,
            'notas_credito' => 0,
            'pliegos' => 0,
            'omitidos' => 0,
        ];

        $this->info('Iniciando reconstruccion historica del kardex...');

        DB::beginTransaction();

        try {
            if ($reset && !$dryRun) {
                InventoryMovement::query()->delete();
                $this->warn('Se eliminaron movimientos de inventario existentes antes del backfill.');
            }

            $this->processRecepcionesOrden($dryRun, $from, $to, $stats);
            $this->processRecepcionesFactura($dryRun, $from, $to, $stats);
            $this->processVentas($dryRun, $from, $to, $stats);
            $this->processNotasCredito($dryRun, $from, $to, $stats);
            $this->processPliegos($dryRun, $from, $to, $stats);

            if ($dryRun) {
                DB::rollBack();
            } else {
                DB::commit();
            }
        } catch (\Throwable $e) {
            DB::rollBack();
            $this->error('Error durante el backfill: ' . $e->getMessage());
            return self::FAILURE;
        }

        $this->newLine();
        $this->table(
            ['Fuente', 'Movimientos'],
            [
                ['Recepciones OC', $stats['recepciones_oc']],
                ['Recepciones Factura', $stats['recepciones_factura']],
                ['Ventas', $stats['ventas']],
                ['Notas Credito', $stats['notas_credito']],
                ['Consumos de Pliego', $stats['pliegos']],
                ['Omitidos/Duplicados', $stats['omitidos']],
            ]
        );

        $total = collect($stats)->except('omitidos')->sum();
        $this->info("Proceso completado. Movimientos preparados/registrados: {$total}");

        if (!$dryRun) {
            $this->comment('Siguiente paso recomendado: validar el reporte de valorizacion y revisar 3-5 items criticos contra documentos reales.');
        }

        return self::SUCCESS;
    }

    private function processRecepcionesOrden(bool $dryRun, ?string $from, ?string $to, array &$stats): void
    {
        $query = RecepcionOrden::with('detalles.item');
        $this->applyDateFilter($query, 'fecha_recepcion', $from, $to);

        foreach ($query->get() as $recepcion) {
            foreach ($recepcion->detalles as $detalle) {
                $factor = (float) ($detalle->factor_conversion_usado ?? 1);
                $cantidadBase = (float) $detalle->cantidad_recibida * ($factor ?: 1);
                $costoUnitarioBase = (float) $detalle->costo_unitario / ($factor ?: 1);

                if ($this->storeMovement([
                    'item_id' => $detalle->item_id,
                    'user_id' => $recepcion->user_id,
                    'fecha' => $recepcion->fecha_recepcion,
                    'naturaleza' => 'Entrada',
                    'origen' => 'Recepcion OC',
                    'origen_id' => $recepcion->id,
                    'referencia' => $recepcion->numero_recepcion,
                    'cantidad' => $cantidadBase,
                    'costo_unitario' => $costoUnitarioBase,
                    'valor_movimiento' => $cantidadBase * $costoUnitarioBase,
                    'stock_anterior' => 0,
                    'stock_posterior' => 0,
                    'costo_promedio_anterior' => 0,
                    'costo_promedio_posterior' => 0,
                    'observacion' => 'Backfill historico desde recepcion de orden de compra',
                    'meta' => [
                        'source' => 'backfill',
                        'cantidad_um_compra' => (float) $detalle->cantidad_recibida,
                        'factor_conversion' => $factor,
                    ],
                ], $dryRun)) {
                    $stats['recepciones_oc']++;
                } else {
                    $stats['omitidos']++;
                }
            }
        }
    }

    private function processRecepcionesFactura(bool $dryRun, ?string $from, ?string $to, array &$stats): void
    {
        $query = CompraRecepcion::with('detalles.item');
        $this->applyDateFilter($query, 'fecha_recepcion', $from, $to);

        foreach ($query->get() as $recepcion) {
            foreach ($recepcion->detalles as $detalle) {
                $cantidadBase = (float) $detalle->cantidad_recepcionada_um_base;
                $factor = (float) ($detalle->factor_conversion_usado ?? 1);
                $costoUnitarioBase = (float) $detalle->costo_unitario_um_compra / ($factor ?: 1);

                if ($this->storeMovement([
                    'item_id' => $detalle->item_id,
                    'fecha' => $recepcion->fecha_recepcion,
                    'naturaleza' => 'Entrada',
                    'origen' => 'Recepcion Factura',
                    'origen_id' => $recepcion->id,
                    'referencia' => $recepcion->numero_recepcion,
                    'cantidad' => $cantidadBase,
                    'costo_unitario' => $costoUnitarioBase,
                    'valor_movimiento' => $cantidadBase * $costoUnitarioBase,
                    'stock_anterior' => 0,
                    'stock_posterior' => 0,
                    'costo_promedio_anterior' => 0,
                    'costo_promedio_posterior' => 0,
                    'observacion' => 'Backfill historico desde recepcion basada en factura',
                    'meta' => [
                        'source' => 'backfill',
                        'factura_compra_id' => $recepcion->factura_compra_id,
                        'cantidad_um_compra' => (float) $detalle->cantidad_recibida_um_compra,
                        'factor_conversion' => $factor,
                    ],
                ], $dryRun)) {
                    $stats['recepciones_factura']++;
                } else {
                    $stats['omitidos']++;
                }
            }
        }
    }

    private function processVentas(bool $dryRun, ?string $from, ?string $to, array &$stats): void
    {
        $query = FacturaVenta::with(['detalles.item'])
            ->where('estado', '!=', 'Anulada');
        $this->applyDateFilter($query, 'fecha_emision', $from, $to);

        foreach ($query->get() as $factura) {
            foreach ($factura->detalles as $detalle) {
                $costo = (float) ($detalle->item->costo_promedio ?? 0);

                if ($this->storeMovement([
                    'item_id' => $detalle->item_id,
                    'fecha' => $factura->fecha_emision,
                    'naturaleza' => 'Salida',
                    'origen' => 'Factura Venta',
                    'origen_id' => $factura->id,
                    'referencia' => $factura->numero_factura,
                    'cantidad' => (float) $detalle->cantidad,
                    'costo_unitario' => $costo,
                    'valor_movimiento' => (float) $detalle->cantidad * $costo,
                    'stock_anterior' => 0,
                    'stock_posterior' => 0,
                    'costo_promedio_anterior' => 0,
                    'costo_promedio_posterior' => 0,
                    'observacion' => 'Backfill historico desde factura de venta',
                    'meta' => [
                        'source' => 'backfill',
                        'total_item' => (float) $detalle->total_item,
                    ],
                ], $dryRun)) {
                    $stats['ventas']++;
                } else {
                    $stats['omitidos']++;
                }
            }
        }
    }

    private function processNotasCredito(bool $dryRun, ?string $from, ?string $to, array &$stats): void
    {
        $query = NotaCredito::with('detalles.item')
            ->where('estado', 'Activa');
        $this->applyDateFilter($query, 'fecha', $from, $to);

        foreach ($query->get() as $nota) {
            foreach ($nota->detalles as $detalle) {
                if (!$detalle->devolver_stock) {
                    continue;
                }

                $costo = (float) ($detalle->item->costo_promedio ?? 0);

                if ($this->storeMovement([
                    'item_id' => $detalle->item_id,
                    'fecha' => $nota->fecha,
                    'naturaleza' => 'Entrada',
                    'origen' => 'Nota Credito',
                    'origen_id' => $nota->id,
                    'referencia' => $nota->numero_nota,
                    'cantidad' => (float) $detalle->cantidad,
                    'costo_unitario' => $costo,
                    'valor_movimiento' => (float) $detalle->cantidad * $costo,
                    'stock_anterior' => 0,
                    'stock_posterior' => 0,
                    'costo_promedio_anterior' => 0,
                    'costo_promedio_posterior' => 0,
                    'observacion' => 'Backfill historico desde nota de credito con devolucion',
                    'meta' => [
                        'source' => 'backfill',
                        'es_merma' => (bool) $nota->es_merma,
                    ],
                ], $dryRun)) {
                    $stats['notas_credito']++;
                } else {
                    $stats['omitidos']++;
                }
            }
        }
    }

    private function processPliegos(bool $dryRun, ?string $from, ?string $to, array &$stats): void
    {
        $query = PliegoImpresion::query()
            ->whereNotNull('material_utilizado_id')
            ->whereNotNull('cantidad_material');
        $this->applyDateFilter($query, 'updated_at', $from, $to);

        foreach ($query->get() as $pliego) {
            $itemId = $pliego->material_utilizado_id ?: $pliego->item_id;
            $cantidad = (float) $pliego->cantidad_material;
            $costo = (float) optional($pliego->materiaPrima)->costo_promedio;

            if (!$itemId || $cantidad <= 0) {
                continue;
            }

            if ($this->storeMovement([
                'item_id' => $itemId,
                'fecha' => $pliego->updated_at,
                'naturaleza' => 'Salida',
                'origen' => 'Consumo Pliego',
                'origen_id' => $pliego->id,
                'referencia' => 'PLG-' . $pliego->id,
                'cantidad' => $cantidad,
                'costo_unitario' => $costo,
                'valor_movimiento' => $cantidad * $costo,
                'stock_anterior' => 0,
                'stock_posterior' => 0,
                'costo_promedio_anterior' => 0,
                'costo_promedio_posterior' => 0,
                'observacion' => 'Backfill historico desde consumo de material en pliego',
                'meta' => [
                    'source' => 'backfill',
                    'estado_pliego' => $pliego->estado,
                ],
            ], $dryRun)) {
                $stats['pliegos']++;
            } else {
                $stats['omitidos']++;
            }
        }
    }

    private function applyDateFilter($query, string $column, ?string $from, ?string $to): void
    {
        if ($from) {
            $query->whereDate($column, '>=', $from);
        }

        if ($to) {
            $query->whereDate($column, '<=', $to);
        }
    }

    private function storeMovement(array $payload, bool $dryRun): bool
    {
        $exists = InventoryMovement::query()
            ->where('item_id', $payload['item_id'])
            ->where('naturaleza', $payload['naturaleza'])
            ->where('origen', $payload['origen'])
            ->where('origen_id', $payload['origen_id'])
            ->where('referencia', $payload['referencia'])
            ->exists();

        if ($exists) {
            return false;
        }

        if (!$dryRun) {
            InventoryMovement::create($payload);
        }

        return true;
    }
}
