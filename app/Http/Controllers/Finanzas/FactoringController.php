<?php
namespace App\Http\Controllers\Finanzas;

use App\Http\Controllers\Controller;
use App\Models\{
    OperacionFactoring, 
    FacturaCompra, 
    FacturaVenta, 
    NotaCredito, 
    BankAccount, 
    TenantConfig,
    ReciboPago,        // Confirmado
    Egreso,            // Confirmado
    BankTransaction    // Confirmado
};
use App\Services\AccountingService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class FactoringController extends Controller
{
    public function index()
    {
        $operaciones = OperacionFactoring::with([
            'facturaCompra.proveedor',
            'facturaVenta.cliente',
            'cuentaBancaria'
        ])
        ->latest('fecha_operacion')
        ->paginate(20);

        if (request()->is('api/*') || request()->wantsJson()) {
            return response()->json($operaciones);
        }

        return Inertia::render('Finanzas/Factoring/Index', [
            'operaciones' => $operaciones
        ]);
    }

    public function show($id)
    {
        $operacion = OperacionFactoring::with([
            'detalles.facturaCompra.proveedor',
            'detalles.facturaVenta.cliente',
            'detalles.notaCredito.cliente',
            'cuentaBancaria'
        ])->findOrFail($id);

        if (request()->is('api/*') || request()->wantsJson()) {
            return response()->json($operacion);
        }

        return Inertia::render('Finanzas/Factoring/Show', [
            'operacion' => $operacion
        ]);
    }

    public function createCompra() { return Inertia::render('Finanzas/Factoring/CreateCompra'); }
    public function createVenta() { return Inertia::render('Finanzas/Factoring/CreateVenta'); }

    public function getFacturasCompraPendientes()
    {
        $facturas = FacturaCompra::with('proveedor')
            ->where('estado', 'Abierta')
            ->where('saldo_pendiente', '>', 0)
            ->orderBy('fecha_emision', 'desc')
            ->get();
        return response()->json($facturas);
    }

    public function getFacturasVentaPendientes()
    {
        $facturas = FacturaVenta::with(['cliente', 'notasCredito' => function($query) {
                $query->where('estado', 'Activa');
            }])
            ->where('estado', 'Abierta')
            ->where('saldo_pendiente', '>', 0)
            ->orderBy('fecha_emision', 'desc')
            ->get()
            ->map(function($factura) {
                $totalNC = $factura->notasCredito->sum('total');
                $factura->monto_factorable = max(0, $factura->saldo_pendiente - $totalNC);
                $factura->total_nc_activas = $totalNC;
                $factura->cantidad_nc = $factura->notasCredito->count();
                return $factura;
            })
            ->filter(function($factura) { return $factura->monto_factorable > 0; })
            ->values();
        return response()->json($facturas);
    }
    
    public function getNotasCreditoPendientes()
    {
        try {
            $notasCredito = NotaCredito::with(['cliente', 'factura', 'sucursal'])
                ->where('estado', 'Activa')
                ->orderBy('fecha', 'desc')
                ->get()
                ->map(function ($nc) {
                    return [
                        'id' => $nc->id,
                        'numero_nota' => $nc->numero_nota,
                        'fecha_emision' => $nc->fecha,
                        'monto' => $nc->total,
                        'total' => $nc->total,
                        'tipo_nota' => $nc->tipo_nota,
                        'cliente' => [
                            'id' => $nc->cliente->id ?? null,
                            'razon_social' => $nc->cliente->razon_social ?? 'Sin cliente',
                        ],
                    ];
                });
            return response()->json($notasCredito);
        } catch (\Exception $e) {
            return response()->json([], 500);
        }
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'tipo' => 'required|in:compra,venta',
            'facturas_ids' => 'required_without:notas_credito_ids|array',
            'notas_credito_ids' => 'nullable|array',
            'fecha_operacion' => 'required|date',
            'porcentaje' => 'required|numeric|min:0|max:100',
            'bank_account_id' => 'required|exists:bank_accounts,id',
            'entidad_financiera' => 'nullable|string|max:255',
            'numero_operacion_externa' => 'nullable|string|max:255',
            'notas' => 'nullable|string|max:1000',
        ]);

        try {
            return DB::transaction(function () use ($validated) {
                $config = TenantConfig::firstOrFail();
                $montoDocumentosTotal = 0;
                $documentosParaPivote = [];
                $pagosParaCrear = [];

                // ---------------------------------------------------------
                // 1. PROCESAMIENTO DE DOCUMENTOS (Bloqueo y Cálculos)
                // ---------------------------------------------------------
                if ($validated['tipo'] === 'compra') {
                    // --- FACTORING DE COMPRA (Pago a Proveedores) ---
                    $docs = FacturaCompra::whereIn('id', $validated['facturas_ids'])->lockForUpdate()->get();
                    foreach ($docs as $doc) {
                        $montoDocumentosTotal += $doc->saldo_pendiente;
                        $documentosParaPivote[] = ['factura_compra_id' => $doc->id];
                        
                        // Preparar datos para crear el EGRESO individual
                        $pagosParaCrear[] = [
                            'type' => 'Egreso',
                            'factura_id' => $doc->id,
                            'monto' => $doc->saldo_pendiente,
                            'ref_doc' => $doc->numero_factura_proveedor
                        ];

                        // Actualizar Factura
                        $doc->update(['estado' => 'Pagada', 'saldo_pendiente' => 0]);
                    }
                } else {
                    // --- FACTORING DE VENTA (Cobro a Clientes) ---
                    $facturas = FacturaVenta::whereIn('id', $validated['facturas_ids'] ?? [])->lockForUpdate()->get();
                    $ncs = NotaCredito::whereIn('id', $validated['notas_credito_ids'] ?? [])->lockForUpdate()->get();
                    
                    $montoDocumentosTotal = $facturas->sum('saldo_pendiente') - $ncs->sum('total');

                    foreach ($facturas as $f) {
                        $documentosParaPivote[] = ['factura_venta_id' => $f->id];
                        
                        // Preparar datos para crear el RECIBO DE PAGO individual
                        $pagosParaCrear[] = [
                            'type' => 'Recibo',
                            'factura_id' => $f->id,
                            'monto' => $f->saldo_pendiente,
                            'ref_doc' => $f->numero_factura
                        ];

                        $f->update(['estado' => 'Pagada', 'saldo_pendiente' => 0]);
                    }
                    foreach ($ncs as $nc) {
                        $documentosParaPivote[] = ['nota_credito_id' => $nc->id];
                        $nc->update(['estado' => 'Aplicada']);
                    }
                }

                $montoDescuento = $montoDocumentosTotal * ($validated['porcentaje'] / 100);
                $montoNeto = $montoDocumentosTotal - $montoDescuento;

                // ---------------------------------------------------------
                // 2. CREACIÓN DE LA OPERACIÓN MAESTRA
                // ---------------------------------------------------------
                $operacion = OperacionFactoring::create([
                    'numero_operacion' => $this->generateOperationNumber($validated['tipo']),
                    'tipo' => $validated['tipo'],
                    // Asignación segura de ID para evitar error de FK
                    'factura_compra_id' => $validated['tipo'] === 'compra' ? ($validated['facturas_ids'][0] ?? null) : null,
                    'factura_venta_id'  => $validated['tipo'] === 'venta'  ? ($validated['facturas_ids'][0] ?? null) : null,
                    'fecha_operacion' => $validated['fecha_operacion'],
                    'monto_factura' => $montoDocumentosTotal,
                    'porcentaje' => $validated['porcentaje'],
                    'monto_descuento' => $montoDescuento,
                    'monto_neto' => $montoNeto,
                    'bank_account_id' => $validated['bank_account_id'],
                    'entidad_financiera' => $validated['entidad_financiera'],
                    'numero_operacion_externa' => $validated['numero_operacion_externa'],
                    'notas' => $validated['notas'],
                    'estado' => 'Activa'
                ]);

                // 3. Insertar detalle histórico (Pivote)
                foreach ($documentosParaPivote as $d) {
                    DB::table('factoring_documentos')->insert(array_merge($d, ['operacion_id' => $operacion->id]));
                }

                // ---------------------------------------------------------
                // 4. GENERAR PAGOS (Esto actualiza el Estado de Cuenta del Cliente/Proveedor)
                // ---------------------------------------------------------
                foreach ($pagosParaCrear as $pago) {
                    if ($pago['type'] === 'Egreso') {
                        // Crear Egreso (Pago de Compra)
                        Egreso::create([
                            'numero_egreso' => 'EG-F-' . time() . rand(10,99),
                            'factura_compra_id' => $pago['factura_id'],
                            'bank_account_id' => $validated['bank_account_id'],
                            'fecha_pago' => $validated['fecha_operacion'],
                            'monto_pagado' => $pago['monto'],
                            'metodo_pago' => 'Factoring',
                            'referencia' => $operacion->numero_operacion,
                            'notas' => "Pago automático por Factoring {$operacion->numero_operacion}"
                        ]);
                    } else {
                        // Crear ReciboPago (Cobro de Venta)
                        ReciboPago::create([
                            'numero_recibo' => 'RC-F-' . time() . rand(10,99),
                            'factura_venta_id' => $pago['factura_id'],
                            'bank_account_id' => $validated['bank_account_id'],
                            'fecha_pago' => $validated['fecha_operacion'],
                            'monto_pagado' => $pago['monto'],
                            'metodo_pago' => 'Factoring',
                            'referencia' => $operacion->numero_operacion,
                            'notas' => "Cobro automático por Factoring {$operacion->numero_operacion}"
                        ]);
                    }
                }

                // ---------------------------------------------------------
                // 5. MOVIMIENTO BANCARIO (Actualiza saldo Banco por 'booted' en el Modelo)
                // ---------------------------------------------------------
                BankTransaction::create([
                    'bank_account_id' => $validated['bank_account_id'],
                    'tipo' => $validated['tipo'] === 'compra' ? 'Egreso' : 'Ingreso',
                    'monto' => $montoNeto, // El dinero real que sale/entra
                    'fecha' => $validated['fecha_operacion'],
                    'referencia' => $operacion->numero_operacion,
                    'descripcion' => "Factoring " . $operacion->entidad_financiera,
                    'categoria_contable' => 'Factoring',
                    'conciliado' => false
                ]);

                // 6. Contabilidad
                $this->generarAsientoUnico($operacion, $config);

                return response()->json(['message' => 'Operación registrada con éxito', 'data' => $operacion], 201);
            });
        } catch (\Exception $e) {
            Log::error("Error Factoring: " . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    private function generarAsientoUnico($operacion, $config)
    {
        $ctaBanco = BankAccount::find($operacion->bank_account_id)->account_id;
        
        if ($operacion->tipo === 'compra') {
            $asientos = [
                ['account_id' => $config->cta_cxp_id, 'debito' => $operacion->monto_factura, 'credito' => 0],
                ['account_id' => $ctaBanco, 'debito' => 0, 'credito' => $operacion->monto_neto],
                ['account_id' => $config->cta_ingresos_financieros_id, 'debito' => 0, 'credito' => $operacion->monto_descuento]
            ];
        } else {
            $asientos = [
                ['account_id' => $ctaBanco, 'debito' => $operacion->monto_neto, 'credito' => 0],
                ['account_id' => $config->cta_gastos_financieros_id, 'debito' => $operacion->monto_descuento, 'credito' => 0],
                ['account_id' => $config->cta_cxc_id, 'debito' => 0, 'credito' => $operacion->monto_factura]
            ];
        }

        AccountingService::registrarAsiento(
            $operacion->fecha_operacion,
            $operacion->numero_operacion,
            "Factoring {$operacion->numero_operacion}",
            $asientos
        );
    }

    private function generateOperationNumber($tipo)
    {
        $prefix = $tipo === 'compra' ? 'FC' : 'FV';
        $ultimo = OperacionFactoring::where('tipo', $tipo)->latest('id')->first();
        
        if (!$ultimo) {
            $nextNum = 1;
        } else {
            $ultimoNumeroStr = str_replace($prefix . '-', '', $ultimo->numero_operacion);
            $nextNum = (int)$ultimoNumeroStr + 1;
        }
        
        $numero = $prefix . '-' . str_pad($nextNum, 8, '0', STR_PAD_LEFT);
        
        while (OperacionFactoring::where('numero_operacion', $numero)->exists()) {
            $nextNum++;
            $numero = $prefix . '-' . str_pad($nextNum, 8, '0', STR_PAD_LEFT);
        }
        return $numero;
    }

    public function anular($id)
    {
        return DB::transaction(function () use ($id) {
            $operacion = OperacionFactoring::findOrFail($id);
            if ($operacion->estado === 'Anulada') throw new \Exception("Ya está anulada.");

            // 1. Restaurar Documentos y Borrar Pagos
            $docs = DB::table('factoring_documentos')->where('operacion_id', $id)->get();
            foreach ($docs as $doc) {
                if ($doc->factura_compra_id) {
                    $f = FacturaCompra::find($doc->factura_compra_id);
                    if ($f) {
                        // Restaurar factura
                        $f->update(['estado' => 'Abierta', 'saldo_pendiente' => $f->total]);
                        // Borrar el Egreso generado automáticamente (limpieza de estado de cuenta)
                        Egreso::where('factura_compra_id', $f->id)
                              ->where('referencia', $operacion->numero_operacion)
                              ->delete();
                    }
                }
                if ($doc->factura_venta_id) {
                    $f = FacturaVenta::find($doc->factura_venta_id);
                    if ($f) {
                        $f->update(['estado' => 'Abierta', 'saldo_pendiente' => $f->total]);
                        // Borrar el ReciboPago generado automáticamente
                        ReciboPago::where('factura_venta_id', $f->id)
                                  ->where('referencia', $operacion->numero_operacion)
                                  ->delete();
                    }
                }
                if ($doc->nota_credito_id) {
                    NotaCredito::where('id', $doc->nota_credito_id)->update(['estado' => 'Activa']);
                }
            }

            // 2. Reversar Banco (Crear contra-movimiento para mantener historial)
            BankTransaction::create([
                'bank_account_id' => $operacion->bank_account_id,
                'tipo' => $operacion->tipo === 'compra' ? 'Ingreso' : 'Egreso', // Tipo inverso al original
                'monto' => $operacion->monto_neto,
                'fecha' => now(),
                'referencia' => "ANUL-" . $operacion->numero_operacion,
                'descripcion' => "Anulación Factoring " . $operacion->numero_operacion,
                'conciliado' => false
            ]);

            $operacion->update(['estado' => 'Anulada']);
            $this->generarAsientoReversion($operacion);

            return response()->json(['message' => 'Operación anulada exitosamente']);
        });
    }

    private function generarAsientoReversion($operacion)
    {
        $config = TenantConfig::first();
        $ctaBanco = BankAccount::find($operacion->bank_account_id)->account_id;

        if ($operacion->tipo === 'compra') {
            $asientos = [
                ['account_id' => $config->cta_cxp_id, 'debito' => 0, 'credito' => $operacion->monto_factura],
                ['account_id' => $ctaBanco, 'debito' => $operacion->monto_neto, 'credito' => 0],
                ['account_id' => $config->cta_ingresos_financieros_id, 'debito' => $operacion->monto_descuento, 'credito' => 0]
            ];
        } else {
            $asientos = [
                ['account_id' => $ctaBanco, 'debito' => 0, 'credito' => $operacion->monto_neto],
                ['account_id' => $config->cta_gastos_financieros_id, 'debito' => 0, 'credito' => $operacion->monto_descuento],
                ['account_id' => $config->cta_cxc_id, 'debito' => $operacion->monto_factura, 'credito' => 0]
            ];
        }

        AccountingService::registrarAsiento(
            now(),
            "ANUL-{$operacion->numero_operacion}",
            "Anulación Factoring {$operacion->numero_operacion}",
            $asientos
        );
    }
}