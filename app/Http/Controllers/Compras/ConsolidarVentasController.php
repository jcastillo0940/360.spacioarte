<?php

namespace App\Http\Controllers\Compras;

use App\Http\Controllers\Controller;
use App\Models\Venta;
use App\Models\OrdenCompra;
use App\Models\OrdenCompraDetalle;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ConsolidarVentasController extends Controller
{
    /**
     * Procesa la consolidación de varias Órdenes de Venta en una sola Orden de Compra.
     * Bloquea órdenes facturadas y genera la compra en estado 'Confirmada'.
     */
    public function store(Request $request)
    {
        $request->validate([
            'venta_ids' => 'required|array|min:1',
            'venta_ids.*' => 'exists:ventas,id',
            'contacto_id' => 'required|exists:contactos,id', 
        ]);

        return DB::transaction(function () use ($request) {
            // 1. Obtener las ventas filtrando por estado (Bloqueo de Facturadas)
            $ventas = Venta::with('detalles')
                ->whereIn('id', $request->venta_ids)
                ->where('estado', '!=', 'Facturada')
                ->get();

            // Validación: Si después del filtro no quedan ventas, abortar.
            if ($ventas->isEmpty()) {
                return redirect()->back()->withErrors([
                    'error' => 'Ninguna de las órdenes seleccionadas es apta para consolidación (ya han sido facturadas o no existen).'
                ]);
            }
            
            // 2. Agrupar ítems y sumar cantidades de todas las ventas seleccionadas
            $consolidado = [];
            foreach ($ventas as $venta) {
                foreach ($venta->detalles as $detalle) {
                    $id = $detalle->item_id;
                    if (!isset($consolidado[$id])) {
                        $consolidado[$id] = [
                            'item_id' => $id,
                            'cantidad' => 0,
                            // Se utiliza el precio de venta original como base de costo para la compra
                            'costo_unitario' => $detalle->precio_unitario 
                        ];
                    }
                    $consolidado[$id]['cantidad'] += $detalle->cantidad;
                }
            }

            // 3. Generar número correlativo para la Orden de Compra
            $ultimo = OrdenCompra::latest('id')->first();
            $numero = 'OC-' . str_pad(($ultimo ? $ultimo->id + 1 : 1), 6, '0', STR_PAD_LEFT);

            // 4. Crear cabecera de la Orden de Compra
            // Estado configurado como 'Confirmada' para avanzar en el flujo logístico
            $ordenCompra = OrdenCompra::create([
                'numero_orden' => $numero,
                'contacto_id' => $request->contacto_id,
                'fecha_emision' => now()->format('Y-m-d'),
                'fecha_entrega' => now()->addDays(3)->format('Y-m-d'),
                'total' => 0, // Se actualizará al final del proceso
                'estado' => 'Confirmada',
            ]);

            $totalGeneral = 0;

            // 5. Insertar los detalles consolidados en la tabla 'ordenes_compra_detalle'
            foreach ($consolidado as $linea) {
                $subtotal = $linea['cantidad'] * $linea['costo_unitario'];
                $totalGeneral += $subtotal;

                OrdenCompraDetalle::create([
                    'orden_compra_id' => $ordenCompra->id,
                    'item_id' => $linea['item_id'],
                    'cantidad' => $linea['cantidad'],
                    'costo_unitario' => $linea['costo_unitario'],
                    'total' => $subtotal
                ]);
            }

            // 6. Actualizar el total definitivo en la cabecera
            $ordenCompra->update(['total' => $totalGeneral]);

            // Redirección al detalle de la orden generada
            return redirect()->route('compras.ordenes.show', $ordenCompra->id)
                ->with('success', "Orden {$numero} generada exitosamente en estado Confirmada.");
        });
    }
}