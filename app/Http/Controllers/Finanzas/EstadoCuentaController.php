<?php

namespace App\Http\Controllers\Finanzas;

use App\Http\Controllers\Controller;
use App\Models\{Contacto, FacturaVenta, FacturaCompra, ReciboPago, Egreso, NotaCredito};
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Carbon;
use Barryvdh\DomPDF\Facade\Pdf;

class EstadoCuentaController extends Controller
{
    public function index(Request $request)
    {
        $search = $request->input('search');
        $query = Contacto::query()->select('id', 'razon_social', 'identificacion');

        if (!empty($search)) {
            $query->where(function($q) use ($search) {
                $term = '%' . trim($search) . '%';
                $q->where('razon_social', 'LIKE', $term)
                  ->orWhere('identificacion', 'LIKE', $term);
            });
        }

        $contactos = $query->limit(20)->get() ?: [];

        return Inertia::render('Finanzas/EstadosCuenta/Index', [
            'contactos' => $contactos,
            'filters'   => ['search' => $search]
        ]);
    }

    public function show(Request $request, $contacto_id)
    {
        $data = $this->getDatosReporte($request, $contacto_id);
        return Inertia::render('Finanzas/EstadosCuenta/Show', $data);
    }

    public function generarPDF(Request $request, $contacto_id)
    {
        $data = $this->getDatosReporte($request, $contacto_id);
        $pdf = Pdf::loadView('pdf.estado_cuenta', $data);
        $pdf->setPaper('letter', 'portrait');
        return $pdf->download("Estado_Cuenta_{$data['contacto']->razon_social}.pdf");
    }

    private function getDatosReporte(Request $request, $contacto_id)
    {
        $contacto = Contacto::findOrFail($contacto_id);
        $fechaDesde = $request->input('fecha_desde', Carbon::now()->startOfMonth()->toDateString());
        $fechaHasta = $request->input('fecha_hasta', Carbon::now()->endOfMonth()->toDateString());

        // 1. Saldo Anterior ( CXC - PagosRecibidos - NotasCredito )
        $cxcPrevio = FacturaVenta::where('contacto_id', $contacto_id)->where('fecha_emision', '<', $fechaDesde)->sum('total');
        $pagosCxcPrevio = ReciboPago::whereHas('factura', fn($q) => $q->where('contacto_id', $contacto_id))->where('fecha_pago', '<', $fechaDesde)->sum('monto_pagado');
        
        // --- NUEVO: Notas de Crédito previas ---
        $ncPrevio = NotaCredito::where('contacto_id', $contacto_id)->where('fecha', '<', $fechaDesde)->where('estado', 'Activa')->sum('total');

        $cxpPrevio = FacturaCompra::where('contacto_id', $contacto_id)->where('fecha_emision', '<', $fechaDesde)->sum('total');
        $pagosCxpPrevio = Egreso::whereHas('facturaCompra', fn($q) => $q->where('contacto_id', $contacto_id))->where('fecha_pago', '<', $fechaDesde)->sum('monto_pagado');

        // El saldo anterior resta las NC del cliente porque disminuyen su deuda
        $saldoAnterior = ($cxcPrevio + $pagosCxpPrevio) - ($pagosCxcPrevio + $cxpPrevio + $ncPrevio);

        // 2. Movimientos
        $movimientos = collect();

        // Ventas (Débito)
        FacturaVenta::where('contacto_id', $contacto_id)->whereBetween('fecha_emision', [$fechaDesde, $fechaHasta])->get()
            ->each(fn($fv) => $movimientos->push(['fecha' => $fv->fecha_emision, 'referencia' => $fv->numero_factura, 'descripcion' => 'Factura de Venta', 'debito' => (float)$fv->total, 'credito' => 0]));

        // Pagos Recibidos (Crédito)
        ReciboPago::whereHas('factura', fn($q) => $q->where('contacto_id', $contacto_id))->whereBetween('fecha_pago', [$fechaDesde, $fechaHasta])->get()
            ->each(fn($p) => $movimientos->push(['fecha' => $p->fecha_pago, 'referencia' => $p->numero_recibo, 'descripcion' => 'Recibo de Pago', 'debito' => 0, 'credito' => (float)$p->monto_pagado]));

        // --- NUEVO: Notas de Crédito del periodo (Crédito) ---
        NotaCredito::where('contacto_id', $contacto_id)->whereBetween('fecha', [$fechaDesde, $fechaHasta])->where('estado', 'Activa')->get()
            ->each(fn($nc) => $movimientos->push(['fecha' => $nc->fecha, 'referencia' => $nc->numero_nota, 'descripcion' => 'Nota de Crédito', 'debito' => 0, 'credito' => (float)$nc->total]));

        // Compras y Egresos (Mantenemos tu lógica existente)
        FacturaCompra::where('contacto_id', $contacto_id)->whereBetween('fecha_emision', [$fechaDesde, $fechaHasta])->get()
            ->each(fn($fc) => $movimientos->push(['fecha' => $fc->fecha_emision, 'referencia' => $fc->numero_factura_proveedor, 'descripcion' => 'Factura de Compra', 'debito' => 0, 'credito' => (float)$fc->total]));

        Egreso::whereHas('facturaCompra', fn($q) => $q->where('contacto_id', $contacto_id))->whereBetween('fecha_pago', [$fechaDesde, $fechaHasta])->get()
            ->each(fn($e) => $movimientos->push(['fecha' => $e->fecha_pago, 'referencia' => $e->numero_egreso, 'descripcion' => 'Egreso / Pago a Proveedor', 'debito' => (float)$e->monto_pagado, 'credito' => 0]));

        // 3. Saldo Acumulado
        $saldoCorriente = (float)$saldoAnterior;
        $movimientosFinales = $movimientos->sortBy('fecha')->values()->map(function ($mov) use (&$saldoCorriente) {
            $saldoCorriente += ($mov['debito'] - $mov['credito']);
            $mov['saldo_acumulado'] = (float)$saldoCorriente;
            return $mov;
        });

        return [
            'contacto' => $contacto,
            'movimientos' => $movimientosFinales,
            'saldo_total' => (float)$saldoCorriente,
            'saldo_anterior' => (float)$saldoAnterior,
            'filtros' => ['desde' => $fechaDesde, 'hasta' => $fechaHasta],
            'resumen' => [
                'por_cobrar' => (float)FacturaVenta::where('contacto_id', $contacto_id)->sum('saldo_pendiente'),
                'por_pagar' => (float)FacturaCompra::where('contacto_id', $contacto_id)->sum('saldo_pendiente')
            ]
        ];
    }
}