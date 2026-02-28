<?php

namespace App\Http\Requests\Ventas;

use App\Models\FacturaVenta;
use Illuminate\Foundation\Http\FormRequest;

class ProcessPosSaleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return auth()->check();
    }

    public function rules(): array
    {
        return [
            'contacto_id' => 'required|exists:contactos,id',
            'items' => 'required|array|min:1',
            'items.*.id' => 'required|exists:items,id',
            'items.*.cantidad' => 'required|numeric|min:0.01',
            'items.*.precio' => 'required|numeric|min:0',
            'items.*.descuento' => 'nullable|numeric|min:0',
            'items.*.fromOrder' => 'nullable|exists:ordenes_venta,id',
            'metodo_pago' => 'required|string',
            'monto_pago' => 'required|numeric|min:0',
            'bank_account_id' => 'required|exists:bank_accounts,id',
            'referencia' => 'nullable|string|max:255',
        ];
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {
            $items = collect($this->input('items', []));
            $orderIds = $items->pluck('fromOrder')->filter()->unique();

            if ($orderIds->count() !== 1) {
                return;
            }

            $invoice = FacturaVenta::where('orden_venta_id', $orderIds->first())->first();
            if (!$invoice) {
                return;
            }

            $montoPago = (float) $this->input('monto_pago', 0);
            $saldoPendiente = (float) $invoice->saldo_pendiente;

            if ($montoPago > $saldoPendiente + 0.0001) {
                $validator->errors()->add('monto_pago', 'El monto no puede exceder la deuda pendiente de la factura asociada.');
            }
        });
    }
}
