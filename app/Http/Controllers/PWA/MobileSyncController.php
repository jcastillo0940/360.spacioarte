<?php

namespace App\Http\Controllers\PWA;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Item;
use App\Models\Ruta;
use App\Models\OrdenVenta;
use App\Models\OrdenVentaDetalle;
use App\Models\InventarioVehiculo;
use App\Models\Visita; // Asegúrate de crear este modelo también
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;

class MobileSyncController extends Controller
{
    // DESCARGA DE DATOS (Servidor -> PWA)
    public function initialSync(Request $request)
    {
        $user = Auth::user();
        
        // 1. Obtener Ruta del usuario
        $ruta = Ruta::with(['clientes' => function($q) {
            $q->select('contactos.id', 'contactos.nombre_fiscal', 'contactos.direccion', 'contactos.telefono', 'contactos.latitud', 'contactos.longitud');
        }])->where('vendedor_id', $user->id)->first();

        // 2. Inventario del Vehículo (si aplica)
        $inventario = [];
        if ($ruta && $ruta->vehiculo_id) {
            $inventario = InventarioVehiculo::with('item:id,nombre,codigo,precio_venta,impuesto_id')
                ->where('vehiculo_id', $ruta->vehiculo_id)
                ->get()
                ->map(function($inv) {
                    return [
                        'item_id' => $inv->item_id,
                        'nombre' => $inv->item->nombre,
                        'codigo' => $inv->item->codigo,
                        'cantidad' => $inv->cantidad,
                        'precio' => $inv->item->precio_venta,
                        'tax_id' => $inv->item->impuesto_id
                    ];
                });
        }

        // 3. Catálogo Global (para Preventa)
        // Optimizacion: Solo traer campos necesarios
        $catalogo = Item::where('activo', true)
            ->select('id', 'nombre', 'codigo', 'precio_venta', 'impuesto_id')
            ->get();

        return response()->json([
            'status' => 'success',
            'timestamp' => now()->timestamp,
            'data' => [
                'ruta' => $ruta,
                'inventario_vehiculo' => $inventario,
                'catalogo' => $catalogo,
                'config' => [
                    'permite_autoventa' => $user->can('crear_autoventa'), // Asumiendo Spatie o Gate
                    'permite_cobro' => $user->can('crear_cobro'),
                ]
            ]
        ]);
    }

    // SUBIDA DE DATOS (PWA -> Servidor)
    public function syncUp(Request $request)
    {
        $payload = $request->validate([
            'ordenes' => 'array',
            'visitas' => 'array',
        ]);

        $resultados = [
            'ordenes' => [],
            'visitas' => []
        ];

        DB::beginTransaction();
        try {
            // 1. Procesar Visitas
            if (!empty($payload['visitas'])) {
                foreach ($payload['visitas'] as $visitaData) {
                    $visita = Visita::updateOrCreate(
                        ['uuid_local' => $visitaData['uuid']],
                        [
                            'user_id' => Auth::id(),
                            'contacto_id' => $visitaData['cliente_id'],
                            'latitud' => $visitaData['lat'],
                            'longitud' => $visitaData['lng'],
                            'observaciones' => $visitaData['notas'] ?? null,
                            'fecha_visita' => date('Y-m-d H:i:s', $visitaData['timestamp'] / 1000),
                            'sincronizado' => true
                        ]
                    );
                    $resultados['visitas'][] = ['uuid' => $visitaData['uuid'], 'status' => 'ok'];
                }
            }

            // 2. Procesar Órdenes de Venta
            if (!empty($payload['ordenes'])) {
                foreach ($payload['ordenes'] as $ordenData) {
                    // Verificar duplicidad por UUID
                    $existe = OrdenVenta::where('referencia_externa', $ordenData['uuid'])->exists();
                    if ($existe) {
                        $resultados['ordenes'][] = ['uuid' => $ordenData['uuid'], 'status' => 'exists'];
                        continue;
                    }

                    // Crear Orden (Reutilizando lógica o modelo existente)
                    $orden = OrdenVenta::create([
                        'sucursal_id' => Auth::user()->sucursal_id ?? 1,
                        'contacto_id' => $ordenData['cliente_id'],
                        'fecha_emision' => date('Y-m-d'),
                        'fecha_entrega' => date('Y-m-d'), // O la programada
                        'estado' => 'pendiente', // O 'facturado' si es autoventa
                        'referencia_externa' => $ordenData['uuid'], // Clave para idempotencia
                        'total' => $ordenData['total'],
                        'user_id' => Auth::id(),
                    ]);

                    foreach ($ordenData['items'] as $item) {
                        OrdenVentaDetalle::create([
                            'orden_venta_id' => $orden->id,
                            'item_id' => $item['id'],
                            'cantidad' => $item['cantidad'],
                            'precio_unitario' => $item['precio'],
                            'subtotal' => $item['cantidad'] * $item['precio'],
                            'impuesto_monto' => 0, // Calcular según lógica fiscal real
                            'total_linea' => $item['cantidad'] * $item['precio']
                        ]);

                        // Si es Autoventa, descontar inventario vehículo
                        if ($ordenData['tipo'] === 'autoventa') {
                            $inv = InventarioVehiculo::where('vehiculo_id', $ordenData['vehiculo_id'])
                                    ->where('item_id', $item['id'])
                                    ->first();
                            if ($inv) {
                                $inv->decrement('cantidad', $item['cantidad']);
                            }
                        }
                    }
                    $resultados['ordenes'][] = ['uuid' => $ordenData['uuid'], 'status' => 'created', 'server_id' => $orden->id];
                }
            }

            DB::commit();
            return response()->json(['status' => 'success', 'synced' => $resultados]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['status' => 'error', 'message' => $e->getMessage()], 500);
        }
    }
}