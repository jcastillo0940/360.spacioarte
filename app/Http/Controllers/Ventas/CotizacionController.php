<?php

namespace App\Http\Controllers\Ventas;

use App\Http\Controllers\Controller;
use App\Models\Cotizacion;
use App\Models\Vendedor;
use App\Services\CotizacionConversionService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class CotizacionController extends Controller
{
    public function __construct(private CotizacionConversionService $conversionService)
    {
    }

    public function index()
    {
        return Inertia::render('Ventas/Cotizaciones/Index');
    }

    public function create()
    {
        return Inertia::render('Ventas/Cotizaciones/Create', [
            'cotizacion' => null,
            'isEditing' => false,
        ]);
    }

    public function edit(Cotizacion $cotizacion)
    {
        $this->ensureEditable($cotizacion);
        $cotizacion->load(['detalles.item']);

        return Inertia::render('Ventas/Cotizaciones/Create', [
            'isEditing' => true,
            'cotizacion' => [
                'id' => $cotizacion->id,
                'numero_cotizacion' => $cotizacion->numero_cotizacion,
                'contacto_id' => $cotizacion->contacto_id,
                'vendedor_id' => $this->resolverVendedorIdDesdeCotizacion($cotizacion),
                'fecha_emision' => $cotizacion->fecha_emision?->toDateString(),
                'fecha_vencimiento' => $cotizacion->fecha_vencimiento?->toDateString(),
                'notas_internas' => $cotizacion->notas_internas,
                'terminos_condiciones' => $cotizacion->terminos_condiciones,
                'estado' => $cotizacion->estado,
                'descuento_tipo' => $cotizacion->descuento_tipo,
                'descuento_valor' => (float) $cotizacion->descuento_valor,
                'descuento_total' => (float) $cotizacion->descuento_total,
                'items' => $cotizacion->detalles->map(function ($detalle) {
                    $subtotal = (float) $detalle->subtotal;
                    $itbmsMonto = (float) $detalle->itbms_monto;

                    return [
                        'item_id' => $detalle->item_id,
                        'nombre' => $detalle->descripcion ?: $detalle->item?->nombre,
                        'cantidad' => (float) $detalle->cantidad,
                        'precio_unitario' => (float) $detalle->precio_unitario,
                        'tasa_itbms' => $subtotal > 0 ? round(($itbmsMonto / $subtotal) * 100, 2) : 0,
                    ];
                })->values(),
            ],
        ]);
    }

    public function store(Request $request)
    {
        $validated = $this->validateCotizacion($request);

        DB::transaction(function () use ($validated) {
            [$subtotal, $descuentoTotal, $itbms, $total] = $this->calcularTotales($validated);

            $userId = $this->resolverUserIdDesdeVendedor($validated['vendedor_id'] ?? null);

            $cotizacion = Cotizacion::create([
                'numero_cotizacion' => $this->generarNumeroCotizacion(),
                'contacto_id' => $validated['contacto_id'],
                'user_id' => $userId,
                'fecha_emision' => $validated['fecha_emision'],
                'fecha_vencimiento' => $validated['fecha_vencimiento'],
                'estado' => 'Emitido',
                'subtotal' => $subtotal,
                'itbms_total' => $itbms,
                'descuento_tipo' => $validated['descuento_tipo'] ?? null,
                'descuento_valor' => $validated['descuento_valor'] ?? 0,
                'descuento_total' => $descuentoTotal,
                'total' => $total,
                'notas_internas' => $validated['notas_internas'] ?? null,
                'terminos_condiciones' => $validated['terminos_condiciones'] ?? null,
            ]);

            $this->guardarDetalles($cotizacion, $validated['items'], $subtotal, $descuentoTotal);
        });

        return redirect()->route('cotizaciones.index')->with('success', 'Cotizacion creada correctamente.');
    }

    public function update(Request $request, Cotizacion $cotizacion)
    {
        $this->ensureEditable($cotizacion);
        $validated = $this->validateCotizacion($request);

        DB::transaction(function () use ($validated, $cotizacion) {
            [$subtotal, $descuentoTotal, $itbms, $total] = $this->calcularTotales($validated);

            $userId = $this->resolverUserIdDesdeVendedor($validated['vendedor_id'] ?? null);

            $cotizacion->update([
                'contacto_id' => $validated['contacto_id'],
                'user_id' => $userId,
                'fecha_emision' => $validated['fecha_emision'],
                'fecha_vencimiento' => $validated['fecha_vencimiento'],
                'subtotal' => $subtotal,
                'itbms_total' => $itbms,
                'descuento_tipo' => $validated['descuento_tipo'] ?? null,
                'descuento_valor' => $validated['descuento_valor'] ?? 0,
                'descuento_total' => $descuentoTotal,
                'total' => $total,
                'notas_internas' => $validated['notas_internas'] ?? null,
                'terminos_condiciones' => $validated['terminos_condiciones'] ?? null,
            ]);

            $cotizacion->detalles()->delete();
            $this->guardarDetalles($cotizacion, $validated['items'], $subtotal, $descuentoTotal);
        });

        return redirect()->route('cotizaciones.index')->with('success', 'Cotizacion actualizada correctamente.');
    }

    public function convertirAOrden(Request $request, Cotizacion $cotizacion)
    {
        $validated = $request->validate([
            'sucursal_id' => 'nullable|exists:sucursales,id',
            'fecha_entrega' => 'nullable|date',
        ]);

        $orden = $this->conversionService->convertirAOrdenVenta($cotizacion, $validated);

        return redirect()->route('ordenes.show', $orden->id)
            ->with('success', 'Cotizacion convertida a orden de venta.');
    }

    public function convertirAFactura(Request $request, Cotizacion $cotizacion)
    {
        $validated = $request->validate([
            'payment_term_id' => 'nullable|exists:payment_terms,id',
            'fecha_vencimiento' => 'nullable|date',
        ]);

        $factura = $this->conversionService->convertirAFactura($cotizacion, $validated);

        return redirect()->route('facturas.show', $factura->id)
            ->with('success', 'Cotizacion convertida a factura.');
    }

    public function getData(Request $request)
    {
        $cotizaciones = Cotizacion::with(['cliente', 'vendedor'])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($cotizaciones);
    }

    private function validateCotizacion(Request $request): array
    {
        return $request->validate([
            'contacto_id' => 'required|exists:contactos,id',
            'vendedor_id' => 'nullable|exists:vendedores,id',
            'fecha_emision' => 'required|date',
            'fecha_vencimiento' => 'required|date|after_or_equal:fecha_emision',
            'descuento_tipo' => 'nullable|in:porcentaje,monto_fijo',
            'descuento_valor' => 'nullable|numeric|min:0',
            'items' => 'required|array|min:1',
            'items.*.item_id' => 'required|exists:items,id',
            'items.*.nombre' => 'nullable|string',
            'items.*.cantidad' => 'required|numeric|min:0.01',
            'items.*.precio_unitario' => 'required|numeric|min:0',
            'items.*.tasa_itbms' => 'nullable|numeric|min:0|max:100',
            'notas_internas' => 'nullable|string',
            'terminos_condiciones' => 'nullable|string',
        ]);
    }

    private function calcularTotales(array $validated): array
    {
        $subtotal = collect($validated['items'])->sum(fn ($item) => $item['cantidad'] * $item['precio_unitario']);
        $descuentoTotal = $this->calcularDescuentoTotal(
            $subtotal,
            $validated['descuento_tipo'] ?? null,
            (float) ($validated['descuento_valor'] ?? 0)
        );

        $factorDescuento = $subtotal > 0 ? ($descuentoTotal / $subtotal) : 0;

        $itbms = collect($validated['items'])->sum(function ($item) use ($factorDescuento) {
            $itemSubtotal = $item['cantidad'] * $item['precio_unitario'];
            $subtotalConDescuento = max(0, $itemSubtotal - ($itemSubtotal * $factorDescuento));

            return $subtotalConDescuento * (($item['tasa_itbms'] ?? 0) / 100);
        });

        $total = max(0, $subtotal - $descuentoTotal) + $itbms;

        return [round($subtotal, 2), round($descuentoTotal, 2), round($itbms, 2), round($total, 2)];
    }

    private function guardarDetalles(Cotizacion $cotizacion, array $items, float $subtotal, float $descuentoTotal): void
    {
        $factorDescuento = $subtotal > 0 ? ($descuentoTotal / $subtotal) : 0;

        foreach ($items as $item) {
            $itemSubtotal = $item['cantidad'] * $item['precio_unitario'];
            $subtotalConDescuento = max(0, $itemSubtotal - ($itemSubtotal * $factorDescuento));
            $itemItbms = $subtotalConDescuento * (($item['tasa_itbms'] ?? 0) / 100);

            $cotizacion->detalles()->create([
                'item_id' => $item['item_id'],
                'descripcion' => $item['nombre'] ?? null,
                'cantidad' => $item['cantidad'],
                'precio_unitario' => $item['precio_unitario'],
                'subtotal' => $itemSubtotal,
                'itbms_monto' => $itemItbms,
                'total' => $subtotalConDescuento + $itemItbms,
            ]);
        }
    }

    private function resolverUserIdDesdeVendedor(?int $vendedorId): ?int
    {
        if ($vendedorId) {
            $userId = Vendedor::find($vendedorId)?->user_id;
            if ($userId) {
                return $userId;
            }
        }

        return auth()->id();
    }

    private function generarNumeroCotizacion(): string
    {
        $ultima = Cotizacion::latest('id')->first();
        return 'COT-' . str_pad(($ultima ? $ultima->id + 1 : 1), 6, '0', STR_PAD_LEFT);
    }

    private function ensureEditable(Cotizacion $cotizacion): void
    {
        if (in_array($cotizacion->estado, ['Convertido', 'Cancelado'], true)) {
            abort(409, 'Esta cotizacion ya no se puede editar.');
        }

        if ($cotizacion->ordenesVenta()->exists() || $cotizacion->facturasVenta()->exists()) {
            abort(409, 'Esta cotizacion ya fue convertida a una orden o factura y no puede modificarse.');
        }
    }

    private function resolverVendedorIdDesdeCotizacion(Cotizacion $cotizacion): ?int
    {
        if (!$cotizacion->user_id) {
            return null;
        }

        return Vendedor::where('user_id', $cotizacion->user_id)->value('id');
    }

    private function calcularDescuentoTotal(float $subtotal, ?string $tipo, float $valor): float
    {
        if ($subtotal <= 0 || !$tipo || $valor <= 0) {
            return 0;
        }

        if ($tipo === 'porcentaje') {
            return round($subtotal * ($valor / 100), 2);
        }

        return round(min($subtotal, $valor), 2);
    }
}
