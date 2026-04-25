<?php

namespace App\Services;

use App\Models\FacturaVenta;
use App\Models\InvoiceShareLink;
use Illuminate\Support\Str;

class InvoiceShareService
{
    public function buildWhatsappShareData(FacturaVenta $factura, ?int $userId = null): array
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
                'created_by' => $userId,
                'expires_at' => now()->addDays(30),
                'is_active' => true,
            ]);
        }

        $shareUrl = route('facturas.shared.show', $link->token);
        $phone = $this->normalizePhone($factura->cliente?->telefono);
        $message = "Hola, descarga tu factura aqui: {$shareUrl}";

        return [
            'share_url' => $shareUrl,
            'message' => $message,
            'phone' => $phone,
            'whatsapp_url' => $phone
                ? 'https://wa.me/' . $phone . '?text=' . urlencode($message)
                : null,
            'expires_at' => optional($link->expires_at)?->toIso8601String(),
        ];
    }

    public function normalizePhone(?string $phone): ?string
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

    private function generateUniqueToken(): string
    {
        do {
            $token = Str::lower(Str::random(10));
        } while (InvoiceShareLink::query()->where('token', $token)->exists());

        return $token;
    }
}
