<?php

namespace App\Http\Controllers\Ventas;

use App\Http\Controllers\Controller;
use App\Models\OrdenVenta;
use App\Models\Contacto;
use App\Models\Item;
use App\Models\Vendedor;
use App\Models\OrdenProduccion;
use App\Models\DisenoHistorial;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

use App\Services\Production\OrderService;
use App\Enums\OrdenEstado;

class OrdenVentaController extends Controller
{
    protected OrderService $orderService;

    public function __construct(OrderService $orderService)
    {
        $this->orderService = $orderService;
    }

    public function index()
    {
        if (request()->is('api/*')) {
            return response()->json(
                OrdenVenta::with(['cliente', 'vendedor', 'sucursal'])
                    ->orderBy('id', 'desc')
                    ->get()
            );
        }
        
        return inertia('Ventas/Ordenes/Index');
    }

    // ... (index, getDatos, store, show remain mostly same but keep an eye on hardcoded strings if any)
    // store uses 'estado' => 'Borrador'. Update to OrdenEstado::BORRADOR->value if possible, 
    // but the store method code wasn't requested to change deeply. 
    // However, for consistency, I should update store too if I can.
    // Let's focus on update and reimprimir derived from the prompt on previous Code Interaction.

    // ... methods below ...

    // ... methods below ...
    public function getDatos()
    {
        try {
            $clientes = Contacto::where('es_cliente', true)->get();
            
            $productos = Item::with(['tax', 'procesosCompatibles', 'papelesCompatibles'])
                ->where('activo', true)
                ->where('es_insumo', false)
                ->get();

            $vendedores = Vendedor::where('activo', true)->get();

            // Identificar si el usuario actual es un vendedor
            $vendedorAsignado = Vendedor::where('user_id', auth()->id())->first();
            
            $config = \App\Models\TenantConfig::getSettings();
            
            return response()->json([
                'clientes' => $clientes,
                'productos' => $productos,
                'vendedores' => $vendedores,
                'payment_terms' => \App\Models\PaymentTerm::all(),
                'vendedor_asignado_id' => $vendedorAsignado ? $vendedorAsignado->id : null,
                'min_anticipo_porcentaje' => $config->anticipo_minimo_porcentaje ?? 50
            ]);
        } catch (\Exception $e) {
            Log::error('Error en getDatos OrdenVenta: ' . $e->getMessage());
            return response()->json([
                'error' => $e->getMessage(),
                'clientes' => [],
                'productos' => [],
                'vendedores' => []
            ], 500);
        }
    }

    public function show($id)
    {
        try {
            if (request()->is('api/*')) {
                // CORRECCIÓN: Se eliminó 'mensajes.usuario' para que no busque la tabla inexistente.
                // Todo el chat se manejará vía Pusher.
                $orden = OrdenVenta::with([
                    'cliente', 
                    'vendedor', 
                    'sucursal', 
                    'detalles.item.procesoDefault', 
                    'produccion.maquina',
                    'tiempos'
                ])->findOrFail($id);

                return response()->json($orden);
            }
            
            return inertia('Ventas/Ordenes/Show', ['ordenId' => $id]);
        } catch (\Exception $e) {
            Log::error("Error mostrando orden #{$id}: " . $e->getMessage());
            return response()->json(['error' => 'Error interno: ' . $e->getMessage()], 500);
        }
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'contacto_id' => 'required|exists:contactos,id',
            'sucursal_id' => 'nullable|exists:sucursales,id',
            'vendedor_id' => 'nullable|exists:vendedores,id',
            'fecha_emision' => 'required|date',
            'fecha_entrega' => 'required|date|after_or_equal:fecha_emision',
            'cliente_envia_muestra' => 'nullable|boolean',
            'cliente_envia_archivo' => 'nullable|boolean',
            'detalle_diseno' => 'nullable|string',
            'metodo_pago_referencia' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.item_id' => 'required|exists:items,id',
            'items.*.cantidad' => 'required|numeric|min:0.01',
            'items.*.precio_unitario' => 'required|numeric|min:0',
            'items.*.tasa_itbms' => 'required|numeric|min:0|max:100',
            'items.*.proceso_id' => 'nullable|exists:procesos,id',
            'items.*.material_id' => 'nullable|exists:items,id',
            'items.*.pliegos_necesarios' => 'nullable|numeric',
            'items.*.capacidad_por_pliego' => 'nullable|integer',
            'items.*.total_piezas_calculadas' => 'nullable|integer',
        ]);

        // Validación adicional: ID de transacción obligatorio si no es efectivo
        if ($request->metodo_pago_inicial && $request->metodo_pago_inicial !== 'Efectivo') {
            if (empty($request->metodo_pago_referencia)) {
                return response()->json([
                    'error' => 'El número de comprobante/transacción es obligatorio para pagos con ' . $request->metodo_pago_inicial
                ], 422);
            }
        }

        DB::beginTransaction();
        try {
            $subtotal = 0;
            $itbms_total = 0;
            
            foreach ($validated['items'] as $item) {
                $lineaSubtotal = $item['cantidad'] * $item['precio_unitario'];
                $subtotal += $lineaSubtotal;
                $itbms_total += $lineaSubtotal * ($item['tasa_itbms'] / 100);
            }
            
            $total = $subtotal + $itbms_total;

            $ultimaOrden = OrdenVenta::latest('id')->first();
            $numeroOrden = 'OV-' . str_pad(($ultimaOrden ? $ultimaOrden->id + 1 : 1), 6, '0', STR_PAD_LEFT);

            $pathReferencia = null;
            if ($request->hasFile('imagen_referencia')) {
                $pathReferencia = $request->file('imagen_referencia')->store('referencias', 'public');
            }

            // Lógica de vendedor automático
            $vendedorId = $validated['vendedor_id'];
            if (!$vendedorId) {
                $vendedorAsignado = Vendedor::where('user_id', auth()->id())->first();
                $vendedorId = $vendedorAsignado ? $vendedorAsignado->id : null;
            }

            $orden = OrdenVenta::create([
                'numero_orden' => $numeroOrden,
                'contacto_id' => $validated['contacto_id'],
                'sucursal_id' => $validated['sucursal_id'],
                'vendedor_id' => $vendedorId,
                'user_id' => auth()->id(),
                'fecha_emision' => $validated['fecha_emision'],
                'fecha_entrega' => $validated['fecha_entrega'],
                'subtotal' => $subtotal,
                'itbms_total' => $itbms_total,
                'total' => $total,
                'monto_abonado' => $request->input('monto_abonado', 0),
                'metodo_pago_inicial' => $request->input('metodo_pago_inicial'),
                'metodo_pago_referencia' => $request->input('metodo_pago_referencia'),
                'cliente_envia_muestra' => $request->boolean('cliente_envia_muestra'),
                'cliente_envia_archivo' => $request->boolean('cliente_envia_archivo'),
                'detalle_diseno' => $request->input('detalle_diseno'),
                'estado' => 'Borrador',
                'imagen_referencia' => $pathReferencia
            ]);

            // Crear Factura Automática
            $ultimaFactura = \App\Models\FacturaVenta::latest('id')->first();
            $numeroFactura = 'FAC-' . str_pad(($ultimaFactura ? $ultimaFactura->id + 1 : 1), 6, '0', STR_PAD_LEFT);
            
            $factura = \App\Models\FacturaVenta::create([
                'numero_factura' => $numeroFactura,
                'contacto_id' => $orden->contacto_id,
                'vendedor_id' => $orden->vendedor_id,
                'orden_venta_id' => $orden->id,
                'fecha_emision' => $orden->fecha_emision,
                'fecha_vencimiento' => $orden->fecha_entrega,
                'subtotal' => $orden->subtotal,
                'itbms_total' => $orden->itbms_total,
                'total' => $orden->total,
                'saldo_pendiente' => $orden->total - $orden->monto_abonado,
                'payment_term_id' => $orden->cliente->payment_term_id ?? 1, // Default to first if none
                'estado' => $orden->monto_abonado >= $orden->total ? 'Pagada' : 'Abierta'
            ]);

            foreach ($validated['items'] as $item) {
                $lineaSubtotal = $item['cantidad'] * $item['precio_unitario'];
                $lineaTotal = $lineaSubtotal + ($lineaSubtotal * ($item['tasa_itbms'] / 100));
                
                $orden->detalles()->create([
                    'item_id' => $item['item_id'],
                    'cantidad' => $item['cantidad'],
                    'precio_unitario' => $item['precio_unitario'],
                    'subtotal' => $lineaSubtotal,
                    'porcentaje_itbms' => $item['tasa_itbms'], 
                    'total' => $lineaTotal,
                    'proceso_id' => $item['proceso_id'] ?? null,
                    'material_id' => $item['material_id'] ?? null,
                    'pliegos_necesarios' => $item['pliegos_necesarios'] ?? null,
                    'capacidad_por_pliego' => $item['capacidad_por_pliego'] ?? null,
                    'total_piezas_calculadas' => $item['total_piezas_calculadas'] ?? null,
                ]);

                $factura->detalles()->create([
                    'item_id' => $item['item_id'],
                    'cantidad' => $item['cantidad'],
                    'precio_unitario' => $item['precio_unitario'],
                    'porcentaje_itbms' => $item['tasa_itbms'],
                    'total_item' => $lineaTotal
                ]);
            }

            DB::commit();
            return redirect()->route('ordenes.index')->with('success', 'Orden creada correctamente');
            
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error creando orden: ' . $e->getMessage());
            return redirect()->back()->with('error', 'Error al crear la orden: ' . $e->getMessage());
        }
    }

    public function update(Request $request, OrdenVenta $orden)
    {
        if (!in_array($orden->estado, [OrdenEstado::BORRADOR->value, OrdenEstado::CONFIRMADA->value])) {
            return redirect()->back()->with('error', 'No se puede editar esta orden.');
        }

        $validated = $request->validate([
            'contacto_id' => 'required|exists:contactos,id',
            'sucursal_id' => 'nullable|exists:sucursales,id',
            'vendedor_id' => 'nullable|exists:vendedores,id',
            'fecha_emision' => 'required|date',
            'fecha_entrega' => 'nullable|date|after_or_equal:fecha_emision',
            'estado' => 'required|in:' . implode(',', [OrdenEstado::BORRADOR->value, OrdenEstado::CONFIRMADA->value, OrdenEstado::FACTURADA->value, OrdenEstado::CANCELADO->value]),
            'items' => 'required|array|min:1',
            'items.*.item_id' => 'required|exists:items,id',
            'items.*.cantidad' => 'required|numeric|min:0.01',
            'items.*.precio_unitario' => 'required|numeric|min:0',
            'items.*.tasa_itbms' => 'nullable|numeric|min:0|max:100',
            'items.*.proceso_id' => 'nullable|exists:procesos,id',
            'items.*.material_id' => 'nullable|exists:items,id',
            'items.*.pliegos_necesarios' => 'nullable|numeric',
            'items.*.capacidad_por_pliego' => 'nullable|integer',
            'items.*.total_piezas_calculadas' => 'nullable|integer',
        ]);

        DB::beginTransaction();
        try {
            $subtotal = 0;
            $itbms_total = 0;
            
            foreach ($validated['items'] as $item) {
                // Si viene en el request, usamos esa tasa, si no, intentamos traerla del producto (o 0 si no existe)
                $tasa_itbms = $item['tasa_itbms'] ?? 0;
                if (!isset($item['tasa_itbms'])) {
                    $producto = Item::with('tax')->find($item['item_id']);
                    $tasa_itbms = $producto->tax ? $producto->tax->porcentaje : 0;
                }
                
                $lineaSubtotal = $item['cantidad'] * $item['precio_unitario'];
                $subtotal += $lineaSubtotal;
                $itbms_total += $lineaSubtotal * ($tasa_itbms / 100);
            }
            
            $total = $subtotal + $itbms_total;

            $orden->update([
                'contacto_id' => $validated['contacto_id'],
                'sucursal_id' => $validated['sucursal_id'] ?? $orden->sucursal_id,
                'vendedor_id' => $validated['vendedor_id'],
                'fecha_emision' => $validated['fecha_emision'],
                'fecha_entrega' => $validated['fecha_entrega'],
                'estado' => $validated['estado'],
                'subtotal' => $subtotal,
                'itbms_total' => $itbms_total,
                'total' => $total,
            ]);

            $orden->detalles()->delete();

            foreach ($validated['items'] as $item) {
                $tasa_itbms = $item['tasa_itbms'] ?? 0;
                if (!isset($item['tasa_itbms'])) {
                    $producto = Item::with('tax')->find($item['item_id']);
                    $tasa_itbms = $producto->tax ? $producto->tax->porcentaje : 0;
                }
                
                $lineaSubtotal = $item['cantidad'] * $item['precio_unitario'];
                
                $orden->detalles()->create([
                    'item_id' => $item['item_id'],
                    'cantidad' => $item['cantidad'],
                    'precio_unitario' => $item['precio_unitario'],
                    'subtotal' => $lineaSubtotal,
                    'porcentaje_itbms' => $tasa_itbms,
                    'total' => $lineaSubtotal + ($lineaSubtotal * ($tasa_itbms / 100)),
                    'proceso_id' => $item['proceso_id'] ?? null,
                    'material_id' => $item['material_id'] ?? null,
                    'pliegos_necesarios' => $item['pliegos_necesarios'] ?? null,
                    'capacidad_por_pliego' => $item['capacidad_por_pliego'] ?? null,
                    'total_piezas_calculadas' => $item['total_piezas_calculadas'] ?? null,
                ]);
            }

            DB::commit();
            return response()->json(['message' => 'Orden actualizada']);
            
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error actualizando orden: ' . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function reimprimir(OrdenVenta $orden)
    {
        DB::beginTransaction();
        try {
            // Regresar estado a Producción usando Service (sin consumo stock)
            $this->orderService->cambiarEstado($orden, OrdenEstado::PRODUCCION->value, false);

            // Eliminar órdenes de producción previas que no estén terminadas 
            // O simplemente crear nuevas. El usuario usualmente quiere nuevas tareas.
            foreach ($orden->detalles as $detalle) {
                if ($detalle->item->requires_recipe) {
                    // Check if proccess_id is set
                    if ($detalle->proceso_id) {
                        OrdenProduccion::create([
                            'orden_venta_id' => $orden->id,
                            'proceso_id'     => $detalle->proceso_id,
                            'item_id'        => $detalle->material_id ?? $detalle->item_id,
                            'materia_prima_id' => $detalle->material_id,
                            'cantidad'       => $detalle->cantidad,
                            'pliegos'        => $detalle->pliegos_necesarios,
                            'capacidad_nesting' => $detalle->capacidad_por_pliego,
                            'estado'         => OrdenEstado::PENDIENTE->value,
                            'fecha_entrega_proyectada' => $orden->fecha_entrega,
                            'notas_operario' => 'RE-IMPRESIÓN solicitada desde ventas.'
                        ]);
                    }
                }
            }

            DB::commit();
            return response()->json(['message' => 'Orden enviada a re-impresión']);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function updateEstado(Request $request, OrdenVenta $orden)
    {
        $allStates = array_column(OrdenEstado::cases(), 'value');
        $validated = $request->validate(['estado' => 'required|in:' . implode(',', $allStates)]);
        
        try {
            // Usar el servicio para aplicar lógica de negocio (inventario, eventos, etc)
            $this->orderService->cambiarEstado($orden, $validated['estado']);

            // Si cambia a Confirmada, generar órdenes de producción (Mantener compatibilidad)
            if ($validated['estado'] === OrdenEstado::CONFIRMADA->value) {
                if ($orden->ordenesProduccion()->count() === 0) {
                    foreach ($orden->detalles as $detalle) {
                        // Verificamos si requiere producción según el tipo de item o proceso
                        if ($detalle->item->requires_recipe || $detalle->proceso_id) {
                            OrdenProduccion::create([
                                'orden_venta_id' => $orden->id,
                                'proceso_id'     => $detalle->proceso_id,
                                'item_id'        => $detalle->material_id ?? $detalle->item_id,
                                'materia_prima_id' => $detalle->material_id,
                                'cantidad'       => $detalle->cantidad,
                                'pliegos'        => $detalle->pliegos_necesarios,
                                'capacidad_nesting' => $detalle->capacidad_por_pliego,
                                'estado'         => OrdenEstado::PENDIENTE->value,
                                'fecha_entrega_proyectada' => $orden->fecha_entrega
                            ]);
                        }
                    }
                }
            }

            return redirect()->route('ordenes.show', $orden->id)->with('success', 'Estado de la orden actualizado correctamente.');
        } catch (\Exception $e) {
            return redirect()->route('ordenes.show', $orden->id)->with('error', 'Error al actualizar proceso: ' . $e->getMessage());
        }
    }

    public function getHistorial($id)
    {
        $orden = OrdenVenta::with('disenoHistorial')->findOrFail($id);
        return response()->json($orden->disenoHistorial);
    }
}