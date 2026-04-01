<?php

namespace App\Http\Controllers\Ventas;

use App\Http\Controllers\Controller;
use App\Models\FacturaVenta;
use App\Models\InvoiceShareLink;
use App\Models\TenantConfig;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class InvoiceShareController extends Controller
{
    public function whatsappLink(Request $request, FacturaVenta $factura): JsonResponse
    {
        $factura->loadMissing(['cliente', 'detalles.item', 'vendedor']);

        $link = InvoiceShareLink::query()
            ->where('factura_venta_id', $factura->id)
            ->where('channel', 'whatsapp')
            ->where('target', 'thermal_ticket')
            ->where('is_active', true)
            ->where(function ($query) {
                $query->whereNull('expires_at')
                    ->orWhere('expires_at', '>', now());
            })
            ->latest('id')
            ->first();

        if (!$link) {
            $link = InvoiceShareLink::create([
                'factura_venta_id' => $factura->id,
                'channel' => 'whatsapp',
                'target' => 'thermal_ticket',
                'token' => $this->generateUniqueToken(),
                'created_by' => $request->user()?->id,
                'expires_at' => now()->addDays(30),
                'is_active' => true,
            ]);
        }

        $shareUrl = route('facturas.shared.show', $link->token);
        $phone = $this->normalizePhone($factura->cliente?->telefono);
        $message = "Hola, descarga tu factura aqui: {$shareUrl}";

        return response()->json([
            'share_url' => $shareUrl,
            'message' => $message,
            'phone' => $phone,
            'whatsapp_url' => $phone
                ? 'https://wa.me/' . $phone . '?text=' . urlencode($message)
                : null,
        ]);
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

    private function generateUniqueToken(): string
    {
        do {
            $token = Str::lower(Str::random(10));
        } while (InvoiceShareLink::query()->where('token', $token)->exists());

        return $token;
    }

    private function normalizePhone(?string $phone): ?string
    {
        $digits = preg_replace('/\D+/', '', (string) $phone);

        if ($digits === '') {
            return null;
        }

        if (str_starts_with($digits, '00')) {
            $digits = substr($digits, 2);
        }

        if (strlen($digits) === 8) {
            return '507' . $digits;
        }

        if (str_starts_with($digits, '507') && strlen($digits) >= 11) {
            return $digits;
        }

        return $digits;
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
