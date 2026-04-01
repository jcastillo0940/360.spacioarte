<?php

namespace App\Http\Controllers\Ventas;

use App\Http\Controllers\Controller;
use App\Models\FacturaVenta;
use App\Models\Item;
use App\Models\NotaDebito;
use App\Models\NotaDebitoDetalle;
use App\Models\TenantConfig;
use App\Services\AccountingService;
use App\Services\ElectronicInvoicing\AlanubePanamaService;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class NotaDebitoController extends Controller
{
    public function index()
    {
        $notas = NotaDebito::with(['factura.cliente', 'cliente', 'detalles.item'])
            ->latest('fecha')
            ->paginate(20);

        if (request()->is('api/*') || request()->wantsJson()) {
            return response()->json($notas);
        }

        return Inertia::render('Ventas/NotasDebito/Index', [
            'notas' => $notas,
        ]);
    }

    public function show($id)
    {
        $nota = NotaDebito::with(['factura.cliente', 'cliente', 'detalles.item'])
            ->findOrFail($id);

        if (request()->is('api/*') || request()->wantsJson()) {
            return response()->json($nota);
        }

        return Inertia::render('Ventas/NotasDebito/Show', [
            'nota' => $nota,
            'notaId' => $nota->id,
        ]);
    }

    public function emitirElectronica(NotaDebito $nota, AlanubePanamaService $alanube)
    {
        try {
            if ($this->notaYaFueEmitida($nota)) {
                return redirect()->route('ventas.nd.show', $nota)->withErrors([
                    'error' => 'La nota de debito ya fue emitida electronicamente.',
                ]);
            }

            $alanube->emitirNotaDebito($nota);

            return redirect()->route('ventas.nd.show', $nota)->with('success', 'Nota de debito electronica enviada a Alanube correctamente.');
        } catch (\Throwable $e) {
            return redirect()->route('ventas.nd.show', $nota)->withErrors([
                'error' => 'No se pudo emitir la nota de debito electronica: ' . $e->getMessage(),
            ]);
        }
    }

    public function sincronizarElectronica(NotaDebito $nota, AlanubePanamaService $alanube)
    {
        try {
            $alanube->sincronizarNotaDebito($nota);

            if (request()->is('api/*') || request()->wantsJson()) {
                return response()->json([
                    'message' => 'Estado de nota de debito electronica actualizado.',
                    'data' => $nota->fresh(),
                ]);
            }

            return redirect()->route('ventas.nd.show', $nota)->with('success', 'Estado de nota de debito electronica actualizado.');
        } catch (\Throwable $e) {
            if (request()->is('api/*') || request()->wantsJson()) {
                return response()->json([
                    'message' => 'No se pudo consultar el estado electronico: ' . $e->getMessage(),
                    'data' => $nota->fresh(),
                ], 422);
            }

            return redirect()->route('ventas.nd.show', $nota)->withErrors([
                'error' => 'No se pudo consultar el estado electronico: ' . $e->getMessage(),
            ]);
        }
    }

    public function createManual()
    {
        return Inertia::render('Ventas/NotasDebito/CreateManual');
    }

    public function store(Request $request)
    {
        try {
            Log::info('Inicio de creacion de ND', [
                'data' => $request->all(),
                'user_id' => auth()->id(),
            ]);

            $validated = $request->validate([
                'es_manual' => 'boolean',
                'factura_manual_ref' => 'required_if:es_manual,true|nullable|string|max:100',
                'fecha_factura_original' => 'required_if:es_manual,true|nullable|date',
                'contacto_id' => 'required_if:es_manual,true|nullable|exists:contactos,id',
                'sucursal_id' => 'nullable|exists:sucursales,id',
                'factura_venta_id' => 'required_if:es_manual,false|nullable|exists:facturas_venta,id',
                'tipo_nota' => 'required|in:recargo,interes,ajuste',
                'motivo' => 'required|string|max:500',
                'items' => 'required|array|min:1',
                'items.*.item_id' => 'required|exists:items,id',
                'items.*.cantidad' => 'required|numeric|min:0.01',
                'items.*.precio_unitario' => 'required|numeric|min:0',
            ]);

            return DB::transaction(function () use ($validated) {
                $config = TenantConfig::first();

                if (!$config) {
                    throw new \RuntimeException('No se encontro la configuracion del tenant. Contacte al administrador.');
                }

                $factura = null;
                $contactoId = null;

                if ($validated['es_manual'] ?? false) {
                    $contactoId = $validated['contacto_id'];
                } else {
                    $factura = FacturaVenta::with(['detalles.item.tax'])->lockForUpdate()->findOrFail($validated['factura_venta_id']);
                    $contactoId = $factura->contacto_id;

                    if (in_array($factura->estado, ['Anulada', 'Cancelada'], true)) {
                        throw ValidationException::withMessages([
                            'factura_venta_id' => 'No se puede generar una nota de debito para una factura anulada o cancelada.',
                        ]);
                    }
                }

                $validated['items'] = collect($validated['items'])
                    ->filter(fn ($item) => round((float) ($item['cantidad'] ?? 0), 2) > 0)
                    ->values()
                    ->all();

                if (empty($validated['items'])) {
                    throw ValidationException::withMessages([
                        'items' => 'Debes incluir al menos una linea con cantidad mayor a cero.',
                    ]);
                }

                $this->validateItemsAgainstFactura($validated['items'], $factura);

                $nota = NotaDebito::create([
                    'numero_nota' => $this->generateNDNumber($config),
                    'factura_venta_id' => $factura?->id,
                    'factura_manual_ref' => $factura?->numero_factura ?: ($validated['factura_manual_ref'] ?? null),
                    'fecha_factura_original' => $factura?->fecha_emision ?: ($validated['fecha_factura_original'] ?? null),
                    'contacto_id' => $contactoId,
                    'sucursal_id' => $validated['sucursal_id'] ?? $factura?->sucursal_id,
                    'fecha' => now(),
                    'tipo_nota' => $validated['tipo_nota'],
                    'motivo' => $validated['motivo'],
                    'subtotal' => 0,
                    'itbms_total' => 0,
                    'total' => 0,
                    'estado' => 'Activa',
                ]);

                $subtotal = 0.0;
                $itbms = 0.0;

                foreach ($validated['items'] as $detail) {
                    $item = Item::with('tax')->findOrFail($detail['item_id']);
                    $precioUnitario = round((float) $detail['precio_unitario'], 2);
                    $cantidad = round((float) $detail['cantidad'], 2);
                    $lineaBase = round($cantidad * $precioUnitario, 2);

                    $taxRate = 0.0;
                    if ($factura) {
                        $lineaOriginal = $factura->detalles->firstWhere('item_id', $item->id);
                        $taxRate = (float) ($lineaOriginal->porcentaje_itbms ?? $item->tax->tasa ?? 0);
                    } else {
                        $taxRate = (float) ($item->tax->tasa ?? 0);
                    }

                    $itbmsLinea = round($lineaBase * ($taxRate / 100), 2);

                    NotaDebitoDetalle::create([
                        'nota_debito_id' => $nota->id,
                        'item_id' => $item->id,
                        'codigo_item' => $item->codigo,
                        'descripcion_item' => $item->nombre,
                        'cantidad' => $cantidad,
                        'precio_unitario' => $precioUnitario,
                        'subtotal_item' => $lineaBase,
                        'porcentaje_itbms' => round($taxRate, 2),
                        'itbms_item' => $itbmsLinea,
                        'total_item' => round($lineaBase + $itbmsLinea, 2),
                    ]);

                    $subtotal += $lineaBase;
                    $itbms += $itbmsLinea;
                }

                $total = round($subtotal + $itbms, 2);

                $nota->update([
                    'subtotal' => round($subtotal, 2),
                    'itbms_total' => round($itbms, 2),
                    'total' => $total,
                ]);

                if ($total <= 0) {
                    throw ValidationException::withMessages([
                        'items' => 'La nota de debito debe tener un total mayor a cero.',
                    ]);
                }

                $this->generarAsientosContables($nota, $config);

                if ($factura) {
                    $nuevoSaldo = round((float) $factura->saldo_pendiente + $total, 2);
                    $factura->update([
                        'saldo_pendiente' => $nuevoSaldo,
                        'estado' => 'Abierta',
                    ]);
                }

                $mensaje = "Nota de Debito {$nota->numero_nota} creada exitosamente.";

                if (request()->wantsJson()) {
                    return response()->json([
                        'message' => $mensaje,
                        'data' => $nota->load('detalles.item', 'factura', 'cliente'),
                    ], 201);
                }

                return redirect()->route('ventas.nd.index')->with('success', $mensaje);
            });
        } catch (ValidationException $e) {
            Log::warning('Error de validacion en ND', ['errors' => $e->errors()]);
            if (request()->wantsJson()) {
                return response()->json(['message' => 'Error de validacion', 'errors' => $e->errors()], 422);
            }
            throw $e;
        } catch (\Throwable $e) {
            Log::error('Error al crear ND', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            if (request()->wantsJson()) {
                return response()->json(['message' => 'Error: ' . $e->getMessage()], 500);
            }

            return redirect()->back()->withErrors(['error' => 'Error: ' . $e->getMessage()])->withInput();
        }
    }

    private function generarAsientosContables(NotaDebito $nota, TenantConfig $config): void
    {
        $ctaCxcId = $this->resolveAccountId($config->cta_cxc_id ?? null, null, 'cuentas por cobrar');
        $ctaIngresoId = $nota->tipo_nota === 'ajuste'
            ? $this->resolveAccountId($config->cta_ventas_id ?? null, $config->cta_ingresos_financieros_id ?? null, 'ventas/ingresos')
            : $this->resolveAccountId($config->cta_ingresos_financieros_id ?? null, $config->cta_ventas_id ?? null, 'ingresos financieros/ventas');
        $ctaItbmsId = $this->resolveAccountId($config->cta_itbms_id ?? null, null, 'ITBMS');

        AccountingService::registrarAsiento(
            $nota->fecha,
            $nota->numero_nota,
            $this->generarDescripcionAsiento($nota),
            [
                [
                    'account_id' => $ctaCxcId,
                    'debito' => $nota->total,
                    'credito' => 0,
                ],
                [
                    'account_id' => $ctaIngresoId,
                    'debito' => 0,
                    'credito' => $nota->subtotal,
                ],
                [
                    'account_id' => $ctaItbmsId,
                    'debito' => 0,
                    'credito' => $nota->itbms_total,
                ],
            ]
        );
    }

    private function generarDescripcionAsiento(NotaDebito $nota): string
    {
        $tipo = strtoupper($nota->tipo_nota);
        $ref = $nota->factura ? "Fac: {$nota->factura->numero_factura}" : "Ref: {$nota->factura_manual_ref}";

        return "ND {$tipo} - {$ref} - {$nota->motivo}";
    }

    private function resolveAccountId($primaryId, $fallbackId, string $label): int
    {
        foreach ([$primaryId, $fallbackId] as $candidate) {
            if ($candidate && DB::table('accounts')->where('id', $candidate)->exists()) {
                return (int) $candidate;
            }
        }

        throw new \RuntimeException("No hay una cuenta contable valida configurada para {$label}.");
    }

    private function generateNDNumber(TenantConfig $config): string
    {
        $last = NotaDebito::orderByDesc('id')->first();
        $nextNum = $last ? ($last->id + 1) : 1;
        $serie = $config->nd_serie ?? 'ND';

        return $serie . '-' . str_pad((string) $nextNum, 8, '0', STR_PAD_LEFT);
    }

    private function notaYaFueEmitida(NotaDebito $nota): bool
    {
        return $nota->es_electronica_emitida;
    }

    public function generarPDF($id)
    {
        $nota = NotaDebito::with(['cliente', 'detalles.item', 'factura'])->findOrFail($id);
        $pdf = Pdf::loadView('pdf.nota-debito', compact('nota'));

        return $pdf->setPaper('a4', 'portrait')->stream("ND-{$nota->numero_nota}.pdf");
    }

    public function getDatosFactura($facturaId)
    {
        try {
            $factura = FacturaVenta::with(['detalles.item.tax', 'cliente'])->findOrFail($facturaId);

            return response()->json([
                'success' => true,
                'factura' => $factura,
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    public function anular($id)
    {
        return DB::transaction(function () use ($id) {
            $nota = NotaDebito::with('factura')->findOrFail($id);

            if ($nota->estado === 'Anulada') {
                throw new \RuntimeException('La nota de debito ya esta anulada.');
            }

            if ($this->notaYaFueEmitida($nota)) {
                throw new \RuntimeException('No se puede anular localmente una nota de debito que ya fue emitida electronicamente.');
            }

            if ($nota->factura) {
                $nuevoSaldo = max(round((float) $nota->factura->saldo_pendiente - (float) $nota->total, 2), 0);
                $nota->factura->update([
                    'saldo_pendiente' => $nuevoSaldo,
                    'estado' => $nuevoSaldo <= 0.01 ? 'Pagada' : 'Abierta',
                ]);
            }

            $nota->update(['estado' => 'Anulada']);

            $config = TenantConfig::first();
            AccountingService::registrarAsiento(
                now(),
                "ANUL-{$nota->numero_nota}",
                "Anulacion de {$nota->numero_nota}",
                [
                    [
                        'account_id' => $this->resolveAccountId($config->cta_ingresos_financieros_id ?? null, $config->cta_ventas_id ?? null, 'ingresos financieros/ventas'),
                        'debito' => $nota->subtotal,
                        'credito' => 0,
                    ],
                    [
                        'account_id' => $this->resolveAccountId($config->cta_itbms_id ?? null, null, 'ITBMS'),
                        'debito' => $nota->itbms_total,
                        'credito' => 0,
                    ],
                    [
                        'account_id' => $this->resolveAccountId($config->cta_cxc_id ?? null, null, 'cuentas por cobrar'),
                        'debito' => 0,
                        'credito' => $nota->total,
                    ],
                ]
            );

            return response()->json([
                'message' => 'Anulada con exito',
                'data' => $nota->fresh(),
            ]);
        });
    }

    private function validateItemsAgainstFactura(array $items, ?FacturaVenta $factura): void
    {
        if (!$factura) {
            return;
        }

        $detallesFactura = $factura->detalles->keyBy('item_id');

        foreach ($items as $index => $detail) {
            $itemId = (int) $detail['item_id'];
            $cantidad = round((float) $detail['cantidad'], 2);
            $precioUnitario = round((float) $detail['precio_unitario'], 2);
            $lineaFactura = $detallesFactura->get($itemId);

            if (!$lineaFactura) {
                throw ValidationException::withMessages([
                    "items.{$index}.item_id" => 'El item no existe dentro de la factura original.',
                ]);
            }

            if ($cantidad > round((float) $lineaFactura->cantidad, 2)) {
                throw ValidationException::withMessages([
                    "items.{$index}.cantidad" => 'La cantidad de la nota de debito no puede superar la cantidad de la factura original para ese item.',
                ]);
            }

            if ($precioUnitario < 0) {
                throw ValidationException::withMessages([
                    "items.{$index}.precio_unitario" => 'El precio unitario no puede ser negativo.',
                ]);
            }
        }
    }
}
