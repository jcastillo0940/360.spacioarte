<?php

namespace App\Http\Controllers\Ventas;

use App\Http\Controllers\Controller;
use App\Models\NotaCredito;
use App\Models\NotaCreditoDetalle;
use App\Models\FacturaVenta;
use App\Models\Item;
use App\Models\Contacto;
use App\Models\TenantConfig;
use App\Services\AccountingService;
use App\Services\ElectronicInvoicing\AlanubePanamaService;
use App\Services\InventoryMovementService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Barryvdh\DomPDF\Facade\Pdf;

class NotaCreditoController extends Controller
{
    /**
     * Lista todas las notas de crÃƒÂ©dito
     */
    public function index()
    {
        $notas = NotaCredito::with(['factura.cliente', 'cliente', 'detalles.item'])
            ->latest('fecha')
            ->paginate(20);

        if (request()->is('api/*') || request()->wantsJson()) {
            return response()->json($notas);
        }

        return Inertia::render('Ventas/NotasCredito/Index', [
            'notas' => $notas
        ]);
    }

    /**
     * Muestra el detalle de una nota de crÃƒÂ©dito
     */
    public function show($id)
    {
        $nota = NotaCredito::with(['factura.cliente', 'cliente', 'detalles.item'])
            ->findOrFail($id);

        if (request()->is('api/*') || request()->wantsJson()) {
            return response()->json($nota);
        }

        return Inertia::render('Ventas/NotasCredito/Show', [
            'nota' => $nota
        ]);
    }

    public function emitirElectronica(NotaCredito $nota, AlanubePanamaService $alanube)
    {
        if ($this->noteAlreadyIssued($nota)) {
            return redirect()->route('ventas.nc.show', $nota)->withErrors([
                'error' => 'La nota de credito ya fue emitida electronicamente y no puede reenviarse.',
            ]);
        }

        try {
            $alanube->emitirNotaCredito($nota);

            return redirect()->route('ventas.nc.show', $nota)->with('success', 'Nota de credito electronica enviada a Alanube correctamente.');
        } catch (\Throwable $e) {
            return redirect()->route('ventas.nc.show', $nota)->withErrors([
                'error' => 'No se pudo emitir la nota de credito electronica: ' . $e->getMessage(),
            ]);
        }
    }

    public function sincronizarElectronica(NotaCredito $nota, AlanubePanamaService $alanube)
    {
        try {
            $alanube->sincronizarNotaCredito($nota);

            if (request()->wantsJson()) {
                return response()->json([
                    'message' => 'Estado de nota de credito electronica actualizado.',
                    'data' => $nota->fresh(['factura.cliente', 'cliente', 'detalles.item']),
                ]);
            }

            return redirect()->route('ventas.nc.show', $nota)->with('success', 'Estado de nota de credito electronica actualizado.');
        } catch (\Throwable $e) {
            if (request()->wantsJson()) {
                return response()->json([
                    'message' => 'No se pudo consultar el estado electronico: ' . $e->getMessage(),
                ], 422);
            }

            return redirect()->route('ventas.nc.show', $nota)->withErrors([
                'error' => 'No se pudo consultar el estado electronico: ' . $e->getMessage(),
            ]);
        }
    }

    /**
     * Renderiza formulario para crear NC Manual (sin factura en sistema)
     */
    public function createManual()
    {
        return Inertia::render('Ventas/NotasCredito/CreateManual');
    }

    /**
     * Registra una Nota de CrÃƒÂ©dito (Manual o desde Factura)
     */
    public function store(Request $request)
    {
        try {
            Log::info('Inicio de creaciÃƒÂ³n de NC', [
                'data' => $request->all(),
                'user_id' => auth()->id()
            ]);

            $validated = $request->validate([
                // Tipo de NC
                'es_manual' => 'boolean',
                
                // Para NC Manual
                'factura_manual_ref' => 'required_if:es_manual,true|nullable|string|max:100',
                'fecha_factura_original' => 'required_if:es_manual,true|nullable|date',
                'contacto_id' => 'required_if:es_manual,true|nullable|exists:contactos,id',
                'sucursal_id' => 'nullable|exists:sucursales,id',
                
                // Para NC de Sistema
                'factura_venta_id' => 'required_if:es_manual,false|nullable|exists:facturas_venta,id',
                
                // Campos comunes
                'tipo_nota' => 'required|in:devolucion,merma,descuento',
                'motivo' => 'required|string|max:500',
                'es_merma' => 'boolean',
                
                // Items
                'items' => 'required|array|min:1',
                'items.*.item_id' => 'required|exists:items,id',
                'items.*.cantidad' => 'required|numeric|min:0.01',
                'items.*.precio_unitario' => 'nullable|numeric|min:0',
                'items.*.devolver_stock' => 'required|boolean',
            ], [
                'factura_manual_ref.required_if' => 'El nÃƒÂºmero de factura manual es obligatorio',
                'fecha_factura_original.required_if' => 'La fecha de la factura original es obligatoria',
                'contacto_id.required_if' => 'Debe seleccionar un cliente',
                'contacto_id.exists' => 'El cliente seleccionado no existe',
                'sucursal_id.exists' => 'La sucursal seleccionada no existe',
                'tipo_nota.required' => 'Debe seleccionar el tipo de nota de crÃƒÂ©dito',
                'motivo.required' => 'El motivo es obligatorio',
                'items.required' => 'Debe agregar al menos un producto',
                'items.min' => 'Debe agregar al menos un producto',
            ]);

            return DB::transaction(function () use ($validated, $request) {
                $config = TenantConfig::first();
                
                if (!$config) {
                    throw new \Exception("No se encontrÃƒÂ³ la configuraciÃƒÂ³n del tenant. Contacte al administrador.");
                }

                $factura = null;
                $contactoId = null;

                // Determinar cliente y validar
                if ($validated['es_manual'] ?? false) {
                    $contactoId = $validated['contacto_id'];
                    Log::info('NC Manual - Cliente seleccionado', [
                        'contacto_id' => $contactoId,
                        'sucursal_id' => $validated['sucursal_id'] ?? null
                    ]);
                } else {
                    $factura = FacturaVenta::lockForUpdate()->findOrFail($validated['factura_venta_id']);
                    $contactoId = $factura->contacto_id;
                    
                    if ($factura->saldo_pendiente <= 0) {
                        throw ValidationException::withMessages([
                            'factura_venta_id' => 'La factura no tiene saldo pendiente para aplicar nota de crÃƒÂ©dito.'
                        ]);
                    }

                    Log::info('NC de Sistema - Factura encontrada', [
                        'factura_id' => $factura->id,
                        'saldo_pendiente' => $factura->saldo_pendiente
                    ]);
                }

                // 1. Crear cabecera de la Nota de CrÃƒÂ©dito
                $nota = NotaCredito::create([
                    'numero_nota' => $this->generateNCNumber($config),
                    'factura_venta_id' => $factura->id ?? null,
                    'factura_manual_ref' => $validated['factura_manual_ref'] ?? null,
                    'fecha_factura_original' => $validated['fecha_factura_original'] ?? null,
                    'contacto_id' => $contactoId,
                    'sucursal_id' => $validated['sucursal_id'] ?? null,
                    'fecha' => now(),
                    'tipo_nota' => $validated['tipo_nota'],
                    'motivo' => $validated['motivo'],
                    'es_merma' => $validated['es_merma'] ?? ($validated['tipo_nota'] === 'merma'),
                    'subtotal' => 0,
                    'itbms_total' => 0,
                    'total' => 0,
                    'estado' => 'Activa',
                ]);

                Log::info('NC creada - Cabecera', [
                    'nota_id' => $nota->id,
                    'numero_nota' => $nota->numero_nota,
                    'sucursal_id' => $nota->sucursal_id
                ]);

                $subtotalNC = 0;
                $itbmsNC = 0;

                // 2. Procesar ÃƒÂ­tems
                foreach ($validated['items'] as $detail) {
                    $item = Item::lockForUpdate()->findOrFail($detail['item_id']);

                    // ValidaciÃƒÂ³n: Si viene de factura, verificar que no se devuelva mÃƒÂ¡s de lo facturado
                    if ($factura) {
                        $lineaOriginal = $factura->detalles()->where('item_id', $item->id)->first();
                        
                        if (!$lineaOriginal) {
                            throw ValidationException::withMessages([
                                'items' => "El ÃƒÂ­tem '{$item->nombre}' no existe en la factura original."
                            ]);
                        }

                        $cantidadYaDevuelta = NotaCreditoDetalle::whereHas('notaCredito', function($q) use ($factura) {
                            $q->where('factura_venta_id', $factura->id)->where('estado', 'Activa');
                        })->where('item_id', $item->id)->sum('cantidad');

                        if (($cantidadYaDevuelta + $detail['cantidad']) > ($lineaOriginal->cantidad + 0.0001)) {
                            throw ValidationException::withMessages([
                                'items' => "La cantidad de '{$item->nombre}' excede lo facturado."
                            ]);
                        }
                    }

                    $precioUnitario = isset($detail['precio_unitario'])
                        ? (float) $detail['precio_unitario']
                        : (float) ($lineaOriginal->precio_unitario ?? $item->precio_venta ?? 0);
                    $totalLinea = (float) $detail['cantidad'] * $precioUnitario;
                    $tasaITBMS = $factura && isset($lineaOriginal)
                        ? (float) ($lineaOriginal->porcentaje_itbms ?? 0)
                        : (float) ($item->tax->tasa ?? 0);
                    $itbmsLinea = $totalLinea * ($tasaITBMS / 100);

                    // Crear detalle de NC
                    NotaCreditoDetalle::create([
                        'nota_credito_id' => $nota->id,
                        'item_id' => $item->id,
                        'cantidad' => $detail['cantidad'],
                        'precio_unitario' => $precioUnitario,
                        'total_item' => $totalLinea + $itbmsLinea,
                        'devuelto_stock' => $detail['devolver_stock'],
                    ]);

                    // 3. CONTROL DE INVENTARIO
                    if ($item->tipo === 'Inventariable' && $detail['devolver_stock'] && !$nota->es_merma) {
                        $stockAnterior = floatval($item->stock_actual);
                        $costoAnterior = floatval($item->costo_promedio);
                        $stockPosterior = $stockAnterior + floatval($detail['cantidad']);
                        $item->update(['stock_actual' => $stockPosterior]);

                        app(InventoryMovementService::class)->record(
                            item: $item,
                            naturaleza: 'Entrada',
                            cantidad: floatval($detail['cantidad']),
                            costoUnitario: $costoAnterior,
                            stockAnterior: $stockAnterior,
                            stockPosterior: $stockPosterior,
                            costoAnterior: $costoAnterior,
                            costoPosterior: $costoAnterior,
                            origen: 'Nota Credito',
                            origenId: $nota->id,
                            referencia: $nota->numero_nota,
                            observacion: 'Devolucion de cliente con reintegro a inventario'
                        );
                        
                        Log::info('Stock devuelto', [
                            'item' => $item->nombre,
                            'cantidad' => $detail['cantidad'],
                            'stock_nuevo' => $item->fresh()->stock_actual
                        ]);
                    } elseif ($nota->es_merma) {
                        Log::info("NC {$nota->numero_nota}: Merma registrada", [
                            'item' => $item->nombre,
                            'cantidad' => $detail['cantidad']
                        ]);
                    }

                    $subtotalNC += $totalLinea;
                    $itbmsNC += $itbmsLinea;
                }

                $totalNC = $subtotalNC + $itbmsNC;

                // Validar total vs saldo si es factura de sistema
                if ($factura && $totalNC > ($factura->saldo_pendiente + 0.01)) {
                    throw ValidationException::withMessages([
                        'items' => 'El total de la NC excede el saldo pendiente de la factura.'
                    ]);
                }

                $nota->update([
                    'subtotal' => $subtotalNC,
                    'itbms_total' => $itbmsNC,
                    'total' => $totalNC
                ]);

                // 4. Asientos Contables
                try {
                    $this->generarAsientosContables($nota, $config);
                } catch (\Exception $e) {
                    Log::error('Error al generar asientos contables', [
                        'nota_id' => $nota->id,
                        'error' => $e->getMessage()
                    ]);
                    // Se lanza excepciÃƒÂ³n para asegurar integridad del proceso
                    throw new \Exception("Error contable: " . $e->getMessage());
                }

                // 5. Actualizar Saldo de Factura
                if ($factura) {
                    $factura->decrement('saldo_pendiente', $totalNC);
                    if ($factura->fresh()->saldo_pendiente <= 0) {
                        $factura->update(['estado' => 'Pagada']);
                    }
                    Log::info('Factura actualizada', [
                        'factura_id' => $factura->id,
                        'saldo_nuevo' => $factura->fresh()->saldo_pendiente
                    ]);
                }

                $mensaje = "Nota de CrÃƒÂ©dito {$nota->numero_nota} creada exitosamente.";

                if (request()->wantsJson()) {
                    return response()->json([
                        'message' => $mensaje,
                        'data' => $nota->load('detalles.item', 'factura', 'cliente')
                    ], 201);
                }

                return redirect()->route('ventas.nc.index')->with('success', $mensaje);
            });
            
        } catch (ValidationException $e) {
            Log::warning('Error de validaciÃƒÂ³n en NC', ['errors' => $e->errors()]);
            if (request()->wantsJson()) {
                return response()->json(['message' => 'Error de validaciÃƒÂ³n', 'errors' => $e->errors()], 422);
            }
            throw $e;
        } catch (\Exception $e) {
            Log::error('Error al crear NC', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            if (request()->wantsJson()) {
                return response()->json(['message' => 'Error: ' . $e->getMessage()], 500);
            }
            return redirect()->back()->withErrors(['error' => 'Error: ' . $e->getMessage()])->withInput();
        }
    }

    /**
     * Genera asientos contables segÃƒÂºn tipo de NC
     */
    private function generarAsientosContables($nota, $config)
    {
        $ctaDevolucionesId = $this->resolveAccountId($config->cta_devoluciones_id ?? null, $config->cta_ventas_id ?? null, 'devoluciones/ventas');
        $ctaItbmsId = $this->resolveAccountId($config->cta_itbms_id ?? null, null, 'ITBMS');
        $ctaCxcId = $this->resolveAccountId($config->cta_cxc_id ?? null, null, 'cuentas por cobrar');
        $lineas = [];
        $descripcion = $this->generarDescripcionAsiento($nota);

        // DÃƒÂ©bitos
        $lineas[] = [
            'account_id' => $ctaDevolucionesId,
            'debito' => $nota->subtotal,
            'credito' => 0
        ];

        $lineas[] = [
            'account_id' => $ctaItbmsId,
            'debito' => $nota->itbms_total,
            'credito' => 0
        ];

        // CrÃƒÂ©dito (CXC)
        $lineas[] = [
            'account_id' => $ctaCxcId,
            'debito' => 0,
            'credito' => $nota->total
        ];

        // Si es Merma, ajuste de inventario vs gasto
        if ($nota->es_merma) {
            $costoMerma = 0;
            foreach ($nota->detalles as $detalle) {
                if ($detalle->item) {
                    $costoMerma += ($detalle->item->costo_promedio ?? 0) * $detalle->cantidad;
                }
            }

            if ($costoMerma > 0) {
                $ctaGastoMermaId = $this->resolveAccountId($config->cta_gasto_merma_id ?? null, $config->cta_ventas_id ?? null, 'gasto de merma/ventas');
                $ctaInventarioId = $this->resolveAccountId($config->cta_inventario_id ?? null, null, 'inventario');
                $lineas[] = [
                    'account_id' => $ctaGastoMermaId,
                    'debito' => $costoMerma,
                    'credito' => 0
                ];
                $lineas[] = [
                    'account_id' => $ctaInventarioId,
                    'debito' => 0,
                    'credito' => $costoMerma
                ];
            }
        }

        AccountingService::registrarAsiento(
            $nota->fecha,
            $nota->numero_nota,
            $descripcion,
            $lineas
        );
    }

    private function generarDescripcionAsiento($nota)
    {
        $tipo = strtoupper($nota->tipo_nota);
        $ref = $nota->factura ? "Fac: {$nota->factura->numero_factura}" : "Ref: {$nota->factura_manual_ref}";
        return "NC {$tipo} - {$ref} - {$nota->motivo}";
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

    private function generateNCNumber($config)
    {
        $last = NotaCredito::orderBy('id', 'desc')->first();
        $nextNum = $last ? ($last->id + 1) : 1;
        $serie = $config->nc_serie ?? 'NC';
        return $serie . '-' . str_pad($nextNum, 8, '0', STR_PAD_LEFT);
    }

    public function generarPDF($id)
    {
        $nota = NotaCredito::with(['cliente', 'detalles.item', 'factura'])->findOrFail($id);
        $pdf = Pdf::loadView('pdf.nota-credito', compact('nota'));
        return $pdf->setPaper('a4', 'portrait')->stream("NC-{$nota->numero_nota}.pdf");
    }

    public function getDatosFactura($facturaId)
    {
        try {
            $factura = FacturaVenta::with(['detalles.item.tax', 'cliente'])->findOrFail($facturaId);
            $cantidadesDevueltas = NotaCreditoDetalle::whereHas('notaCredito', function($q) use ($factura) {
                    $q->where('factura_venta_id', $factura->id)->where('estado', 'Activa');
                })->groupBy('item_id')
                ->select('item_id', DB::raw('SUM(cantidad) as total'))
                ->pluck('total', 'item_id');

            return response()->json([
                'success' => true,
                'factura' => $factura,
                'cantidades_devueltas' => $cantidadesDevueltas
            ]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    public function anular($id)
    {
        return DB::transaction(function () use ($id) {
            $nota = NotaCredito::with('detalles.item')->findOrFail($id);

            if ($nota->estado === 'Anulada') {
                throw new \Exception("La nota de credito ya esta anulada.");
            }

            if ($this->noteAlreadyIssued($nota)) {
                throw new \Exception("No se puede anular localmente una nota de credito ya emitida electronicamente.");
            }

            // Reversar inventario
            foreach ($nota->detalles as $detalle) {
                if ($detalle->devuelto_stock && $detalle->item->tipo === 'Inventariable') {
                    $stockAnterior = floatval($detalle->item->stock_actual);
                    $costoAnterior = floatval($detalle->item->costo_promedio);
                    $stockPosterior = $stockAnterior - floatval($detalle->cantidad);
                    $detalle->item->update(['stock_actual' => $stockPosterior]);

                    app(InventoryMovementService::class)->record(
                        item: $detalle->item,
                        naturaleza: 'Salida',
                        cantidad: floatval($detalle->cantidad),
                        costoUnitario: $costoAnterior,
                        stockAnterior: $stockAnterior,
                        stockPosterior: $stockPosterior,
                        costoAnterior: $costoAnterior,
                        costoPosterior: $costoAnterior,
                        origen: 'Anulacion Nota Credito',
                        origenId: $nota->id,
                        referencia: $nota->numero_nota,
                        observacion: 'Reversion de entrada a inventario por anulacion de nota de credito'
                    );
                }
            }

            // Reversar saldo de factura
            if ($nota->factura) {
                $nota->factura->increment('saldo_pendiente', $nota->total);
                if ($nota->factura->saldo_pendiente > 0) {
                    $nota->factura->update(['estado' => 'Abierta']);
                }
            }

            $nota->update(['estado' => 'Anulada']);

            // Asiento de reversiÃƒÂ³n
            $config = TenantConfig::first();
            $reversion = [
                ['account_id' => $this->resolveAccountId($config->cta_cxc_id ?? null, null, 'cuentas por cobrar'), 'debito' => $nota->total, 'credito' => 0],
                ['account_id' => $this->resolveAccountId($config->cta_ventas_id ?? null, null, 'ventas'), 'debito' => 0, 'credito' => $nota->subtotal],
                ['account_id' => $this->resolveAccountId($config->cta_itbms_id ?? null, null, 'ITBMS'), 'debito' => 0, 'credito' => $nota->itbms_total],
            ];

            AccountingService::registrarAsiento(
                now(),
                "ANUL-{$nota->numero_nota}",
                "Anulacion de {$nota->numero_nota}",
                $reversion
            );

            return response()->json(['message' => 'Anulada con exito', 'data' => $nota->fresh()]);
        });
    }

    private function noteAlreadyIssued(NotaCredito $nota): bool
    {
        $status = strtoupper((string) $nota->fe_status);
        $legalStatus = strtoupper((string) $nota->fe_legal_status);

        return filled($nota->fe_document_id)
            || filled($nota->fe_cufe)
            || in_array($status, ['SENT', 'PROCESSED', 'FINISHED', 'DGI_REQUEST'], true)
            || str_contains($legalStatus, 'AUTHORIZED');
    }
}
