<?php

namespace App\Http\Controllers\PWA;

use App\Http\Controllers\Controller;
use App\Models\FacturaVenta;
use App\Models\FacturaVentaDetalle;
use App\Models\Item;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SincronizacionController extends Controller
{
    /**
     * Recibe un lote de facturas creadas en modo offline
     */
    public function sincronizarFacturas(Request $request)
    {
        $facturasOffline = $request->input('facturas'); // Array de facturas desde IndexedDB

        return DB::transaction(function () use ($facturasOffline) {
            $procesadas = [];

            foreach ($facturasOffline as $data) {
                // Crear factura legal en el servidor
                $factura = FacturaVenta::create([
                    'numero_factura' => 'PWA-' . $data['id_local'], // ID temporal de la PWA
                    'contacto_id'    => $data['contacto_id'],
                    'vendedor_id'    => auth()->id(),
                    'fecha_emision'  => $data['fecha'],
                    'fecha_vencimiento' => $data['fecha'],
                    'payment_term_id'   => $data['payment_term_id'],
                    'subtotal'       => $data['subtotal'],
                    'itbms_total'    => $data['itbms_total'],
                    'total'          => $data['total'],
                    'saldo_pendiente'=> $data['total'],
                ]);

                foreach ($data['detalles'] as $detalle) {
                    FacturaVentaDetalle::create([
                        'factura_venta_id' => $factura->id,
                        'item_id'          => $detalle['item_id'],
                        'cantidad'         => $detalle['cantidad'],
                        'precio_unitario'  => $detalle['precio_unitario'],
                        'porcentaje_itbms' => 7.00,
                        'total_item'       => $detalle['total'],
                    ]);

                    // Descontar inventario al sincronizar
                    Item::where('id', $detalle['item_id'])->decrement('stock_actual', $detalle['cantidad']);
                }
                
                $procesadas[] = $data['id_local'];
            }

            return response()->json([
                'status' => 'success',
                'mensaje' => 'Sincronización completada',
                'ids_sincronizados' => $procesadas
            ]);
        });
    }
}