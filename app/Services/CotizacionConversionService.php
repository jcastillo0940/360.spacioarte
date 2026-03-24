<?php

namespace App\Services;

use App\Enums\OrdenEstado;
use App\Models\Cotizacion;
use App\Models\FacturaVenta;
use App\Models\OrdenVenta;
use App\Models\PaymentTerm;
use App\Models\Vendedor;
use Exception;
use Illuminate\Support\Facades\DB;

class CotizacionConversionService
{
    public function convertirAOrdenVenta(Cotizacion $cotizacion, array $extraData = []): OrdenVenta
    {
        if (in_array($cotizacion->estado, ['Convertido', 'Cancelado'], true)) {
            throw new Exception("La cotizacion esta en un estado no valido para conversion: {$cotizacion->estado}");
        }

        $sucursalId = $extraData['sucursal_id'] ?? null;
        if ($sucursalId === null) {
            throw new Exception('Debe indicar la sucursal para convertir la cotizacion en orden de venta.');
        }

        return DB::transaction(function () use ($cotizacion, $extraData, $sucursalId) {
            $ordenVenta = OrdenVenta::create([
                'numero_orden' => $extraData['numero_orden'] ?? $this->generarNumeroOrden(),
                'cotizacion_id' => $cotizacion->id,
                'contacto_id' => $cotizacion->contacto_id,
                'sucursal_id' => $sucursalId,
                'vendedor_id' => $this->resolverVendedorId($cotizacion),
                'user_id' => auth()->id(),
                'fecha_emision' => $extraData['fecha_emision'] ?? now()->toDateString(),
                'fecha_entrega' => $extraData['fecha_entrega'] ?? ($cotizacion->fecha_vencimiento?->toDateString() ?? now()->addDays(7)->toDateString()),
                'subtotal' => $cotizacion->subtotal,
                'itbms_total' => $cotizacion->itbms_total,
                'total' => $cotizacion->total,
                'estado' => OrdenEstado::BORRADOR->value,
                'notas' => $cotizacion->notas_internas,
            ]);

            foreach ($cotizacion->detalles as $detalle) {
                $porcentajeItbms = $this->calcularPorcentajeItbms($detalle);

                $ordenVenta->detalles()->create([
                    'item_id' => $detalle->item_id,
                    'cantidad' => $detalle->cantidad,
                    'precio_unitario' => $detalle->precio_unitario,
                    'porcentaje_itbms' => $porcentajeItbms,
                    'porcentaje_descuento' => 0,
                    'subtotal' => $detalle->subtotal,
                    'total' => $detalle->total,
                ]);
            }

            $cotizacion->update(['estado' => 'Convertido']);

            return $ordenVenta;
        });
    }

    public function convertirAFactura(Cotizacion $cotizacion, array $extraData = []): FacturaVenta
    {
        if (in_array($cotizacion->estado, ['Convertido', 'Cancelado'], true)) {
            throw new Exception("La cotizacion esta en un estado no valido para conversion: {$cotizacion->estado}");
        }

        $yaFacturado = FacturaVenta::where('cotizacion_id', $cotizacion->id)->exists();
        if ($yaFacturado) {
            throw new Exception('Esta cotizacion ya fue convertida a factura.');
        }

        return DB::transaction(function () use ($cotizacion, $extraData) {
            $paymentTermId = $extraData['payment_term_id']
                ?? $cotizacion->cliente?->payment_term_id
                ?? PaymentTerm::query()->value('id');

            if (!$paymentTermId) {
                throw new Exception('No existe un termino de pago configurado para generar la factura.');
            }

            $facturaVenta = FacturaVenta::create([
                'numero_factura' => $extraData['numero_factura'] ?? $this->generarNumeroFactura(),
                'cotizacion_id' => $cotizacion->id,
                'contacto_id' => $cotizacion->contacto_id,
                'vendedor_id' => $this->resolverVendedorId($cotizacion),
                'fecha_emision' => $extraData['fecha_emision'] ?? now()->toDateString(),
                'fecha_vencimiento' => $extraData['fecha_vencimiento']
                    ?? ($cotizacion->fecha_vencimiento?->toDateString() ?? now()->addDays(30)->toDateString()),
                'payment_term_id' => $paymentTermId,
                'subtotal' => $cotizacion->subtotal,
                'itbms_total' => $cotizacion->itbms_total,
                'total' => $cotizacion->total,
                'saldo_pendiente' => $cotizacion->total,
                'estado' => 'Abierta',
            ]);

            foreach ($cotizacion->detalles as $detalle) {
                $facturaVenta->detalles()->create([
                    'item_id' => $detalle->item_id,
                    'cantidad' => $detalle->cantidad,
                    'precio_unitario' => $detalle->precio_unitario,
                    'porcentaje_itbms' => $this->calcularPorcentajeItbms($detalle),
                    'total_item' => $detalle->total,
                ]);
            }

            $cotizacion->update(['estado' => 'Convertido']);

            return $facturaVenta;
        });
    }

    private function calcularPorcentajeItbms($detalle): float
    {
        if ((float) $detalle->subtotal <= 0) {
            return 0;
        }

        return round(((float) $detalle->itbms_monto / (float) $detalle->subtotal) * 100, 2);
    }

    private function resolverVendedorId(Cotizacion $cotizacion): ?int
    {
        if (!$cotizacion->user_id) {
            return null;
        }

        return Vendedor::where('user_id', $cotizacion->user_id)->value('id');
    }

    private function generarNumeroOrden(): string
    {
        $ultimaOrden = OrdenVenta::latest('id')->first();
        return 'OV-' . str_pad(($ultimaOrden ? $ultimaOrden->id + 1 : 1), 6, '0', STR_PAD_LEFT);
    }

    private function generarNumeroFactura(): string
    {
        $ultimaFactura = FacturaVenta::latest('id')->first();
        return 'FAC-' . str_pad(($ultimaFactura ? $ultimaFactura->id + 1 : 1), 6, '0', STR_PAD_LEFT);
    }
}
