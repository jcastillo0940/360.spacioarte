<?php

namespace App\Http\Controllers\Compras;

use App\Http\Controllers\Controller;
use App\Models\OrdenCompra;
use App\Models\RecepcionOrden;
use App\Models\RecepcionOrdenDetalle;
use App\Models\Item;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class RecepcionOrdenController extends Controller
{
    /**
     * Lista de órdenes pendientes de recepción (para vendedores)
     */
    public function index()
    {
        $ordenes = OrdenCompra::with(['proveedor', 'detalles.item', 'detalles.unit'])
            ->whereIn('estado', ['Enviada', 'Confirmada', 'Recibida Parcial'])
            ->orderBy('fecha_entrega', 'asc')
            ->get()
            ->map(function ($orden) {
                // Calcular progreso de recepción
                $totalOrdenado = $orden->detalles->sum('cantidad');
                $totalRecibido = RecepcionOrdenDetalle::whereHas('recepcion', function ($q) use ($orden) {
                    $q->where('orden_compra_id', $orden->id);
                })->sum('cantidad_recibida');
                
                // CONVERTIR TODOS LOS VALORES A NÚMEROS
                $orden->total = floatval($orden->total);
                $orden->total_ordenado = floatval($totalOrdenado);
                $orden->total_recibido = floatval($totalRecibido);
                $orden->porcentaje_recibido = $totalOrdenado > 0 ? round(($totalRecibido / $totalOrdenado) * 100, 2) : 0;
                
                return $orden;
            });

        if (request()->is('api/*')) {
            return response()->json($ordenes);
        }

        return Inertia::render('Compras/Recepciones/Index', [
            'ordenes' => $ordenes
        ]);
    }

    /**
     * Mostrar vista de recepción para una orden específica
     */
    public function recibir($ordenId)
    {
        $orden = OrdenCompra::with(['proveedor', 'detalles.item.tax', 'detalles.unit'])->findOrFail($ordenId);

        // CONVERTIR A NÚMERO
        $orden->total = floatval($orden->total);

        // Validar que la orden esté en estado recibible
        if (!in_array($orden->estado, ['Enviada', 'Confirmada', 'Recibida Parcial'])) {
            return redirect()->route('compras.recepciones.index')
                ->with('error', 'Esta orden no está disponible para recepción.');
        }

        // Obtener recepciones previas
        $recepcionesPrevias = RecepcionOrden::with(['detalles.item', 'usuario'])
            ->where('orden_compra_id', $ordenId)
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($recepcion) {
                // CONVERTIR A NÚMEROS
                $recepcion->total_recibido = floatval($recepcion->total_recibido);
                $recepcion->cantidad_total_items = floatval($recepcion->cantidad_total_items);
                return $recepcion;
            });

        // Calcular cantidades ya recibidas por item
        $cantidadesRecibidas = [];
        foreach ($recepcionesPrevias as $recepcion) {
            foreach ($recepcion->detalles as $detalle) {
                if (!isset($cantidadesRecibidas[$detalle->item_id])) {
                    $cantidadesRecibidas[$detalle->item_id] = 0;
                }
                $cantidadesRecibidas[$detalle->item_id] += floatval($detalle->cantidad_recibida);
            }
        }

        // Agregar info a los detalles de la orden
        $orden->detalles->map(function ($detalle) use ($cantidadesRecibidas) {
            // CONVERTIR A NÚMEROS
            $detalle->cantidad = floatval($detalle->cantidad);
            $detalle->costo_unitario = floatval($detalle->costo_unitario);
            $detalle->total = floatval($detalle->total ?? 0);
            
            $detalle->cantidad_recibida = floatval($cantidadesRecibidas[$detalle->item_id] ?? 0);
            $detalle->cantidad_pendiente = $detalle->cantidad - $detalle->cantidad_recibida;
            return $detalle;
        });

        if (request()->is('api/*')) {
            return response()->json([
                'orden' => $orden,
                'recepciones_previas' => $recepcionesPrevias
            ]);
        }

        return Inertia::render('Compras/Recepciones/Recibir', [
            'orden' => $orden,
            'recepcionesPrevias' => $recepcionesPrevias
        ]);
    }

    /**
     * Guardar recepción parcial o completa
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'orden_compra_id' => 'required|exists:ordenes_compra,id',
            'tipo_recepcion' => 'required|in:parcial,completa',
            'observaciones' => 'nullable|string|max:500',
            'items' => 'required|array|min:1',
            'items.*.item_id' => 'required|exists:items,id',
            'items.*.cantidad_recibida' => 'required|numeric|min:0.01',
        ]);

        return DB::transaction(function () use ($validated) {
            $orden = OrdenCompra::with('detalles')->lockForUpdate()->findOrFail($validated['orden_compra_id']);

            // Validar que la orden esté en estado correcto
            if (!in_array($orden->estado, ['Enviada', 'Confirmada', 'Recibida Parcial'])) {
                return back()->withErrors(['error' => 'Esta orden no puede ser recibida en su estado actual.']);
            }

            // Calcular cantidades ya recibidas
            $cantidadesRecibidas = [];
            $recepcionesPrevias = RecepcionOrden::where('orden_compra_id', $orden->id)->get();
            foreach ($recepcionesPrevias as $recepcion) {
                foreach ($recepcion->detalles as $detalle) {
                    if (!isset($cantidadesRecibidas[$detalle->item_id])) {
                        $cantidadesRecibidas[$detalle->item_id] = 0;
                    }
                    $cantidadesRecibidas[$detalle->item_id] += floatval($detalle->cantidad_recibida);
                }
            }

            // Validar que no se exceda la cantidad ordenada
            foreach ($validated['items'] as $itemRecibido) {
                $detalleOrden = $orden->detalles->firstWhere('item_id', $itemRecibido['item_id']);
                if (!$detalleOrden) {
                    return back()->withErrors(['error' => 'Item no encontrado en la orden.']);
                }

                $totalRecibidoPrevio = $cantidadesRecibidas[$itemRecibido['item_id']] ?? 0;
                $totalARecibir = $totalRecibidoPrevio + floatval($itemRecibido['cantidad_recibida']);

                if ($totalARecibir > floatval($detalleOrden->cantidad)) {
                    $item = Item::find($itemRecibido['item_id']);
                    return back()->withErrors([
                        'error' => "La cantidad a recibir del producto '{$item->nombre}' excede lo ordenado. Ordenado: {$detalleOrden->cantidad}, Ya recibido: {$totalRecibidoPrevio}, Intentando recibir: {$itemRecibido['cantidad_recibida']}"
                    ]);
                }
            }

            // Generar número de recepción
            $ultimaRecepcion = RecepcionOrden::latest('id')->first();
            $numeroRecepcion = 'REC-' . str_pad(($ultimaRecepcion ? $ultimaRecepcion->id + 1 : 1), 6, '0', STR_PAD_LEFT);

            // Crear registro de recepción
            $recepcion = RecepcionOrden::create([
                'numero_recepcion' => $numeroRecepcion,
                'orden_compra_id' => $validated['orden_compra_id'],
                'user_id' => Auth::id(),
                'fecha_recepcion' => now(),
                'tipo' => $validated['tipo_recepcion'],
                'observaciones' => $validated['observaciones'],
                'estado' => 'Completada'
            ]);

            // Crear detalles de recepción y actualizar inventario
            foreach ($validated['items'] as $itemData) {
                if (floatval($itemData['cantidad_recibida']) <= 0) {
                    continue;
                }

                $detalleOrden = $orden->detalles->firstWhere('item_id', $itemData['item_id']);
                $factor = $detalleOrden->factor_conversion_usado ?? 1.00;
                $cantRecibidaBase = floatval($itemData['cantidad_recibida']) * $factor;
                
                // Crear detalle de recepción
                RecepcionOrdenDetalle::create([
                    'recepcion_orden_id' => $recepcion->id,
                    'item_id' => $itemData['item_id'],
                    'item_unit_id' => $detalleOrden->item_unit_id,
                    'factor_conversion_usado' => $factor,
                    'cantidad_ordenada' => floatval($detalleOrden->cantidad),
                    'cantidad_recibida' => floatval($itemData['cantidad_recibida']),
                    'costo_unitario' => floatval($detalleOrden->costo_unitario)
                ]);

                // Actualizar inventario SOLO para items inventariables
                $item = Item::lockForUpdate()->find($itemData['item_id']);
                if ($item && ($item->tipo === 'Inventariable' || $item->tipo === 'Consumible' || $item->tipo === 'Materia Prima')) {
                    $valorActual = floatval($item->stock_actual) * floatval($item->costo_promedio);
                    
                    // El costo unitario en la OC es por la UNIDAD DE COMPRA (box, pack, etc.)
                    // Lo que entra al inventario es en UNIDAD BASE.
                    // El costo unitario base = costo_unitario OC / factor
                    $costoUnitarioBase = floatval($detalleOrden->costo_unitario) / ($factor ?: 1);
                    
                    $valorNuevo = $cantRecibidaBase * $costoUnitarioBase;
                    $nuevoValorTotal = $valorActual + $valorNuevo;
                    $nuevoStockTotal = floatval($item->stock_actual) + $cantRecibidaBase;
                    
                    $nuevoCostoPromedio = ($nuevoStockTotal > 0) ? ($nuevoValorTotal / $nuevoStockTotal) : floatval($item->costo_promedio);
                    
                    $item->update([
                        'stock_actual' => $nuevoStockTotal,
                        'costo_promedio' => round($nuevoCostoPromedio, 2)
                    ]);
                }
            }

            // Actualizar estado de la orden según si está completa o parcial
            $totalOrdenado = $orden->detalles->sum(function($d) {
                return floatval($d->cantidad);
            });
            $totalRecibidoAhora = 0;
            
            // Recalcular total recibido incluyendo esta recepción
            $todasLasRecepciones = RecepcionOrden::where('orden_compra_id', $orden->id)->get();
            foreach ($todasLasRecepciones as $rec) {
                $totalRecibidoAhora += $rec->detalles->sum(function($d) {
                    return floatval($d->cantidad_recibida);
                });
            }

            if ($totalRecibidoAhora >= $totalOrdenado) {
                $orden->update(['estado' => 'Recibida Total']);
            } else {
                $orden->update(['estado' => 'Recibida Parcial']);
            }

            return redirect()->route('compras.recepciones.index')
                ->with('success', "Recepción {$numeroRecepcion} guardada correctamente. Inventario actualizado.");
        });
    }

    /**
     * Historial de recepciones
     */
    public function historial()
    {
        $recepciones = RecepcionOrden::with(['ordenCompra.proveedor', 'detalles.item', 'usuario'])
            ->orderBy('created_at', 'desc')
            ->paginate(20)
            ->through(function ($recepcion) {
                // CONVERTIR A NÚMEROS
                $recepcion->total_recibido = floatval($recepcion->total_recibido);
                $recepcion->cantidad_total_items = floatval($recepcion->cantidad_total_items);
                return $recepcion;
            });

        if (request()->is('api/*')) {
            return response()->json($recepciones);
        }

        return Inertia::render('Compras/Recepciones/Historial', [
            'recepciones' => $recepciones
        ]);
    }

    /**
     * Detalle de una recepción específica
     */
    public function show($id)
    {
        $recepcion = RecepcionOrden::with(['ordenCompra.proveedor', 'detalles.item', 'usuario'])
            ->findOrFail($id);

        // CONVERTIR A NÚMEROS
        $recepcion->total_recibido = floatval($recepcion->total_recibido);
        $recepcion->cantidad_total_items = floatval($recepcion->cantidad_total_items);

        if (request()->is('api/*')) {
            return response()->json($recepcion);
        }

        return Inertia::render('Compras/Recepciones/Show', [
            'recepcion' => $recepcion
        ]);
    }

    /**
     * Buscar producto por código (para escaneo)
     */
    public function buscarPorCodigo(Request $request)
    {
        $validated = $request->validate([
            'codigo' => 'required|string',
            'orden_id' => 'required|exists:ordenes_compra,id'
        ]);

        $orden = OrdenCompra::with('detalles.item')->findOrFail($validated['orden_id']);

        // Buscar el item en los detalles de la orden
        $itemEncontrado = null;
        foreach ($orden->detalles as $detalle) {
            if ($detalle->item->codigo === $validated['codigo'] || 
                $detalle->item->codigo_barras === $validated['codigo']) {
                $itemEncontrado = $detalle;
                break;
            }
        }

        if (!$itemEncontrado) {
            return response()->json([
                'success' => false,
                'message' => 'Producto no encontrado en esta orden de compra'
            ], 404);
        }

        // Calcular cantidad ya recibida
        $cantidadRecibida = RecepcionOrdenDetalle::whereHas('recepcion', function ($q) use ($orden) {
            $q->where('orden_compra_id', $orden->id);
        })->where('item_id', $itemEncontrado->item_id)->sum('cantidad_recibida');

        return response()->json([
            'success' => true,
            'item' => $itemEncontrado->item,
            'detalle_orden' => [
                'cantidad_ordenada' => floatval($itemEncontrado->cantidad),
                'cantidad_recibida' => floatval($cantidadRecibida),
                'cantidad_pendiente' => floatval($itemEncontrado->cantidad) - floatval($cantidadRecibida),
                'costo_unitario' => floatval($itemEncontrado->costo_unitario),
                'unit_name' => $itemEncontrado->unit ? $itemEncontrado->unit->nombre : 'Und. Base'
            ]
        ]);
    }
}