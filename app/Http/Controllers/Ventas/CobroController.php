<?php

namespace App\Http\Controllers\Ventas;

use App\Http\Controllers\Controller;
use App\Models\BankAccount;
use App\Models\Contacto;
use App\Models\FacturaVenta;
use App\Services\Payments\InvoicePaymentAllocator;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CobroController extends Controller
{
    public function create()
    {
        return Inertia::render('Ventas/Cobros/Create', [
            'facturas' => FacturaVenta::with('cliente')
                ->where('saldo_pendiente', '>', 0)
                ->whereNotIn('estado', ['Anulada', 'Cancelada'])
                ->orderBy('fecha_emision')
                ->orderBy('id')
                ->get(),
            'bancos' => BankAccount::all(),
        ]);
    }

    public function pendingByCustomer(Contacto $contacto, InvoicePaymentAllocator $allocator)
    {
        return response()->json([
            'contacto' => $contacto,
            'facturas' => $allocator->getPendingInvoicesForContact($contacto->id),
        ]);
    }

    public function store(Request $request, InvoicePaymentAllocator $allocator)
    {
        $validated = $request->validate([
            'contacto_id' => 'required|exists:contactos,id',
            'facturas_ids' => 'nullable|array',
            'facturas_ids.*' => 'exists:facturas_venta,id',
            'bank_account_id' => 'required|exists:bank_accounts,id',
            'monto_total' => 'required|numeric|min:0.01',
            'fecha_pago' => 'required|date',
            'metodo_pago' => 'required|in:Efectivo,Cheque,Transferencia,Tarjeta,Otros',
            'referencia' => 'nullable|string',
            'notas' => 'nullable|string',
        ]);

        $result = $allocator->apply($validated);

        return redirect()->route('facturas.index')->with(
            'success',
            'Cobro aplicado por FIFO correctamente. Recibo: ' . $result['numero_recibo']
        );
    }

    public function getDatos()
    {
        return response()->json([
            'facturas' => FacturaVenta::with('cliente')
                ->where('saldo_pendiente', '>', 0)
                ->whereNotIn('estado', ['Anulada', 'Cancelada'])
                ->orderBy('fecha_emision')
                ->orderBy('id')
                ->get(),
            'bancos' => BankAccount::all(),
        ]);
    }
}
