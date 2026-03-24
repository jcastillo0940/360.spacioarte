<?php

namespace App\Services;

use App\Models\InventoryMovement;
use App\Models\Item;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Auth;

class InventoryMovementService
{
    public function record(
        Item $item,
        string $naturaleza,
        float $cantidad,
        float $costoUnitario,
        float $stockAnterior,
        float $stockPosterior,
        float $costoAnterior,
        float $costoPosterior,
        string $origen,
        $origenId = null,
        ?string $referencia = null,
        ?string $observacion = null,
        ?array $meta = null,
        $fecha = null
    ): InventoryMovement {
        return InventoryMovement::create([
            'item_id' => $item->id,
            'user_id' => Auth::id(),
            'fecha' => $fecha ? Carbon::parse($fecha) : now(),
            'naturaleza' => $naturaleza,
            'origen' => $origen,
            'origen_id' => $origenId,
            'referencia' => $referencia,
            'cantidad' => round($cantidad, 4),
            'costo_unitario' => round($costoUnitario, 4),
            'valor_movimiento' => round($cantidad * $costoUnitario, 4),
            'stock_anterior' => round($stockAnterior, 4),
            'stock_posterior' => round($stockPosterior, 4),
            'costo_promedio_anterior' => round($costoAnterior, 4),
            'costo_promedio_posterior' => round($costoPosterior, 4),
            'observacion' => $observacion,
            'meta' => $meta,
        ]);
    }
}
