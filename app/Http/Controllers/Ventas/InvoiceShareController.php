<?php

namespace App\Http\Controllers\Ventas;

use App\Http\Controllers\Controller;
use App\Models\FacturaVenta;
use App\Models\TenantConfig;
use App\Services\InvoiceShareService;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class InvoiceShareController extends Controller
{
    public function __construct(private readonly InvoiceShareService $invoiceShareService)
    {
    }

    public function whatsappLink(Request $request, FacturaVenta $factura): JsonResponse
    {
        return response()->json(
            $this->invoiceShareService->buildWhatsappShareData($factura, $request->user()?->id)
        );
    }

    public function show(string $token)
    {
        $link = InvoiceShareLink::query()
            ->where('token', $token)
            ->where('is_active', true)
            ->where(function ($query) {
                $query->whereNull('expires_at')
                    ->orWhere('expires_at', '>', now());
            })
            ->firstOrFail();

        $factura = $link->factura()->with(['cliente', 'detalles.item', 'vendedor'])->firstOrFail();

        $link->forceFill([
            'last_accessed_at' => now(),
        ])->saveQuietly();

        return $this->renderThermalTicket($factura);
    }

    private function renderThermalTicket(FacturaVenta $factura)
    {
        $config = TenantConfig::first();
        $widthMm = (int) ($config->factura_termica_ancho_mm ?? 80);
        $widthMm = in_array($widthMm, [58, 80], true) ? $widthMm : 80;
        $paperWidthPoints = $this->mmToPoints($widthMm);
        $paperHeightPoints = $this->calculateTicketHeight($factura);

        $pdf = Pdf::loadView('pdf.factura-ticket-termica', [
            'factura' => $factura,
            'config' => $config,
            'ticketWidthMm' => $widthMm,
            'qrImageUrl' => $factura->fe_public_url
                ? 'https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=' . urlencode($factura->fe_public_url)
                : null,
        ])->setPaper([0, 0, $paperWidthPoints, $paperHeightPoints], 'portrait');

        return $pdf->stream("ticket-{$factura->numero_factura}.pdf");
    }

    private function mmToPoints(int $mm): float
    {
        return $mm * 2.83465;
    }

    private function calculateTicketHeight(FacturaVenta $factura): float
    {
        $baseHeightMm = 110;
        $lineHeightMm = 12;
        $extraHeightMm = max($factura->detalles->count(), 1) * $lineHeightMm;

        return $this->mmToPoints($baseHeightMm + $extraHeightMm);
    }
}
