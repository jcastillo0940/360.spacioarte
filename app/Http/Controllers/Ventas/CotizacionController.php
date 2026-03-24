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
        return Inertia::render('Ventas/Cotizaciones/Create');
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'contacto_id' => 'required|exists:contactos,id',
            'vendedor_id' => 'nullable|exists:vendedores,id',
            'fecha_emision' => 'required|date',
            'fecha_vencimiento' => 'required|date|after_or_equal:fecha_emision',
            'items' => 'required|array|min:1',
            'items.*.item_id' => 'required|exists:items,id',
            'items.*.nombre' => 'nullable|string',
            'items.*.cantidad' => 'required|numeric|min:0.01',
            'items.*.precio_unitario' => 'required|numeric|min:0',
            'items.*.tasa_itbms' => 'nullable|numeric|min:0|max:100',
            'notas_internas' => 'nullable|string',
            'terminos_condiciones' => 'nullable|string',
        ]);

        DB::transaction(function () use ($validated) {
            $subtotal = collect($validated['items'])->sum(fn ($i) => $i['cantidad'] * $i['precio_unitario']);
            $itbms = collect($validated['items'])->sum(
                fn ($i) => ($i['cantidad'] * $i['precio_unitario']) * (($i['tasa_itbms'] ?? 0) / 100)
            );

            $userId = null;
            if (!empty($validated['vendedor_id'])) {
                $userId = Vendedor::find($validated['vendedor_id'])?->user_id;
            }
            if (!$userId) {
                $userId = auth()->id();
            }

            $cotizacion = Cotizacion::create([
                'numero_cotizacion' => $this->generarNumeroCotizacion(),
                'contacto_id' => $validated['contacto_id'],
                'user_id' => $userId,
                'fecha_emision' => $validated['fecha_emision'],
                'fecha_vencimiento' => $validated['fecha_vencimiento'],
                'estado' => 'Emitido',
                'subtotal' => $subtotal,
                'itbms_total' => $itbms,
                'total' => $subtotal + $itbms,
                'notas_internas' => $validated['notas_internas'] ?? null,
                'terminos_condiciones' => $validated['terminos_condiciones'] ?? null,
            ]);

            foreach ($validated['items'] as $item) {
                $itemSubtotal = $item['cantidad'] * $item['precio_unitario'];
                $itemItbms = $itemSubtotal * (($item['tasa_itbms'] ?? 0) / 100);

                $cotizacion->detalles()->create([
                    'item_id' => $item['item_id'],
                    'descripcion' => $item['nombre'] ?? null,
                    'cantidad' => $item['cantidad'],
                    'precio_unitario' => $item['precio_unitario'],
                    'subtotal' => $itemSubtotal,
                    'itbms_monto' => $itemItbms,
                    'total' => $itemSubtotal + $itemItbms,
                ]);
            }
        });

        return redirect()->route('cotizaciones.index')->with('success', 'Cotizacion creada correctamente.');
    }

    public function convertirAOrden(Request $request, Cotizacion $cotizacion)
    {
        $validated = $request->validate([
            'sucursal_id' => 'required|exists:sucursales,id',
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

    private function generarNumeroCotizacion(): string
    {
        $ultima = Cotizacion::latest('id')->first();
        return 'COT-' . str_pad(($ultima ? $ultima->id + 1 : 1), 6, '0', STR_PAD_LEFT);
    }
}
