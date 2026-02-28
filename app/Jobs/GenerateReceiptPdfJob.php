<?php

namespace App\Jobs;

use App\Models\ReciboPago;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Storage;

class GenerateReceiptPdfJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(public int $reciboId)
    {
    }

    public function handle(): void
    {
        $recibo = ReciboPago::with(['factura.cliente', 'cuentaBancaria'])->find($this->reciboId);

        if (!$recibo) {
            return;
        }

        $pdf = Pdf::loadView('pdf.receipt', [
            'recibo' => $recibo,
            'factura' => $recibo->factura,
            'cliente' => $recibo->factura?->cliente,
        ])->setPaper('letter', 'portrait');

        $path = 'receipts/recibo-' . $recibo->id . '.pdf';
        Storage::disk('public')->put($path, $pdf->output());

        $recibo->update(['pdf_path' => $path]);
    }
}
