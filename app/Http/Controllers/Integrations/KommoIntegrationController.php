<?php

namespace App\Http\Controllers\Integrations;

use App\Http\Controllers\Controller;
use App\Models\Contacto;
use App\Models\FacturaVenta;
use App\Models\KommoWebhookReceipt;
use App\Services\Integrations\KommoIntegrationService;
use App\Services\Integrations\KommoOAuthService;
use App\Services\InvoiceShareService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;

class KommoIntegrationController extends Controller
{
    public function __construct(
        private readonly KommoIntegrationService $kommo,
        private readonly KommoOAuthService $oauth,
        private readonly InvoiceShareService $invoiceShareService,
    ) {
    }

    public function ping(): JsonResponse
    {
        return response()->json([
            'ok' => true,
            'service' => 'kommo-integration',
            'timestamp' => now()->toIso8601String(),
            'environment' => app()->environment(),
        ]);
    }

    public function searchContacts(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'phone' => 'nullable|string|max:50',
            'email' => 'nullable|email|max:180',
            'query' => 'nullable|string|max:180',
        ]);

        if (blank($validated['phone'] ?? null) && blank($validated['email'] ?? null) && blank($validated['query'] ?? null)) {
            return response()->json([
                'message' => 'You must provide phone, email, or query.',
            ], 422);
        }

        $contacts = $this->kommo->searchContacts(
            $validated['phone'] ?? null,
            $validated['email'] ?? null,
            $validated['query'] ?? null,
        );

        return response()->json([
            'data' => $contacts->map(fn ($contact) => $this->kommo->mapContact($contact))->values(),
        ]);
    }

    public function showOrder(string $numeroOrden): JsonResponse
    {
        $order = $this->kommo->findOrderByNumber($numeroOrden);

        if (!$order) {
            return response()->json([
                'message' => 'Order not found.',
            ], 404);
        }

        return response()->json([
            'data' => $this->kommo->summarizeOrder($order),
        ]);
    }

    public function invoicesByContact(Contacto $contacto): JsonResponse
    {
        $invoices = $this->kommo->invoicesByContact($contacto);

        return response()->json([
            'contact' => $this->kommo->mapContact($contacto),
            'data' => $invoices->map(fn ($invoice) => $this->kommo->mapInvoice($invoice))->values(),
        ]);
    }

    public function quotesByContact(Contacto $contacto): JsonResponse
    {
        $quotes = $this->kommo->quotesByContact($contacto);

        return response()->json([
            'contact' => $this->kommo->mapContact($contacto),
            'data' => $quotes->map(fn ($quote) => $this->kommo->mapQuote($quote))->values(),
        ]);
    }

    public function shareInvoiceWhatsapp(Request $request, FacturaVenta $factura): JsonResponse
    {
        $shareData = $this->invoiceShareService->buildWhatsappShareData($factura, $request->user()?->id);

        return response()->json([
            'invoice' => $this->kommo->mapInvoice($factura->fresh(['cliente', 'vendedor'])),
            'share' => $shareData,
        ]);
    }

    public function entitySnapshot(Request $request, string $entityType, string $entityId): JsonResponse
    {
        $validated = $request->validate([
            'subdomain' => 'nullable|string|max:120',
        ]);

        return response()->json([
            'data' => $this->oauth->fetchEntitySnapshot(
                $validated['subdomain'] ?? null,
                $entityType,
                $entityId
            ),
        ]);
    }

    public function syncLead(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'kommo_lead_id' => 'nullable|string|max:60',
            'kommo_contact_id' => 'nullable|string|max:60',
            'title' => 'required|string|max:180',
            'company_name' => 'nullable|string|max:180',
            'contact_name' => 'nullable|string|max:180',
            'email' => 'nullable|email|max:180',
            'phone' => 'nullable|string|max:50',
            'expected_value' => 'nullable|numeric|min:0',
            'probability' => 'nullable|integer|min:0|max:100',
            'notes' => 'nullable|string',
            'next_follow_up_at' => 'nullable|date',
            'last_activity_at' => 'nullable|date',
            'is_archived' => 'nullable|boolean',
        ]);

        $synced = $this->kommo->syncLead($validated);

        return response()->json([
            'message' => 'Lead synchronized successfully.',
            'contact' => $this->kommo->mapContact($synced['contact']),
            'lead' => [
                'id' => $synced['lead']->id,
                'title' => $synced['lead']->title,
                'pipeline' => $synced['lead']->pipeline?->name,
                'stage' => $synced['lead']->stage?->name,
                'contacto_id' => $synced['lead']->contacto_id,
                'expected_value' => (float) $synced['lead']->expected_value,
            ],
        ], 201);
    }

    public function syncContact(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'kommo_contact_id' => 'nullable|string|max:60',
            'contact_id' => 'nullable|string|max:60',
            'name' => 'nullable|string|max:180',
            'company_name' => 'nullable|string|max:180',
            'contact_name' => 'nullable|string|max:180',
            'email' => 'nullable|email|max:180',
            'phone' => 'nullable|string|max:50',
        ]);

        $contact = $this->kommo->syncContact($validated);

        return response()->json([
            'message' => 'Contact synchronized successfully.',
            'contact' => $this->kommo->mapContact($contact),
        ], 201);
    }

    public function receiveWebhook(Request $request): JsonResponse
    {
        $payload = $request->all();

        $receipt = KommoWebhookReceipt::create([
            'event_key' => $this->inferEventKey($payload),
            'status' => 'received',
            'headers' => collect($request->headers->all())
                ->map(fn ($values) => is_array($values) && count($values) === 1 ? $values[0] : $values)
                ->all(),
            'payload' => $payload,
        ]);

        try {
            $result = $this->kommo->processWebhookPayload($payload);

            $receipt->update([
                'status' => 'processed',
                'notes' => json_encode($result, JSON_UNESCAPED_UNICODE),
                'processed_at' => now(),
            ]);

            return response()->json([
                'ok' => true,
                'result' => $result,
                'receipt_id' => $receipt->id,
            ]);
        } catch (\Throwable $e) {
            $receipt->update([
                'status' => 'failed',
                'notes' => $e->getMessage(),
                'processed_at' => now(),
            ]);

            throw $e;
        }
    }

    private function inferEventKey(array $payload): string
    {
        foreach (['leads', 'contacts', 'tasks', 'catalogs'] as $entity) {
            $entityPayload = Arr::get($payload, $entity);

            if (!is_array($entityPayload)) {
                continue;
            }

            foreach (['add', 'update', 'delete', 'note'] as $action) {
                if (!empty($entityPayload[$action])) {
                    return "{$entity}.{$action}";
                }
            }
        }

        return 'unknown';
    }
}
