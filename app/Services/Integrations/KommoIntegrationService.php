<?php

namespace App\Services\Integrations;

use App\Models\Contacto;
use App\Models\Cotizacion;
use App\Models\CrmLead;
use App\Models\CrmPipeline;
use App\Models\CrmPipelineStage;
use App\Models\FacturaVenta;
use App\Models\KommoEntityLink;
use App\Models\OrdenVenta;
use App\Models\PaymentTerm;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;

class KommoIntegrationService
{
    public function searchContacts(?string $phone = null, ?string $email = null, ?string $query = null)
    {
        return Contacto::query()
            ->when($phone, fn ($builder) => $builder->whereRaw('REPLACE(REPLACE(REPLACE(telefono, " ", ""), "-", ""), "+", "") like ?', ['%' . $this->digitsOnly($phone) . '%']))
            ->when($email, fn ($builder) => $builder->where('email', $email))
            ->when($query, function ($builder) use ($query) {
                $builder->where(function ($nested) use ($query) {
                    $nested->where('razon_social', 'like', '%' . $query . '%')
                        ->orWhere('identificacion', 'like', '%' . $query . '%')
                        ->orWhere('telefono', 'like', '%' . $query . '%')
                        ->orWhere('email', 'like', '%' . $query . '%');
                });
            })
            ->with(['payment_term'])
            ->orderBy('razon_social')
            ->limit(20)
            ->get();
    }

    public function findOrderByNumber(string $numeroOrden): ?OrdenVenta
    {
        return OrdenVenta::query()
            ->with(['cliente', 'vendedor', 'sucursal', 'detalles.item', 'ordenesProduccion.proceso'])
            ->where('numero_orden', $numeroOrden)
            ->first();
    }

    public function invoicesByContact(Contacto $contacto)
    {
        return FacturaVenta::query()
            ->with(['cliente', 'vendedor'])
            ->where('contacto_id', $contacto->id)
            ->latest('fecha_emision')
            ->limit(50)
            ->get();
    }

    public function quotesByContact(Contacto $contacto)
    {
        return Cotizacion::query()
            ->with(['cliente', 'vendedor'])
            ->where('contacto_id', $contacto->id)
            ->latest('fecha_emision')
            ->limit(50)
            ->get();
    }

    public function syncLead(array $payload): array
    {
        $contact = $this->resolveOrCreateContact($payload);
        $lead = $this->resolveOrCreateLead($payload, $contact);

        return [
            'contact' => $contact->fresh(),
            'lead' => $lead->fresh(['pipeline', 'stage', 'contacto', 'owner']),
        ];
    }

    public function syncContact(array $payload): Contacto
    {
        return $this->resolveOrCreateContact($payload)->fresh();
    }

    public function processWebhookPayload(array $payload): array
    {
        $processed = [
            'contacts' => 0,
            'leads' => 0,
            'ignored' => [],
        ];

        foreach (Arr::get($payload, 'contacts.add', []) as $contactPayload) {
            $this->syncContactFromWebhook($contactPayload);
            $processed['contacts']++;
        }

        foreach (Arr::get($payload, 'contacts.update', []) as $contactPayload) {
            $this->syncContactFromWebhook($contactPayload);
            $processed['contacts']++;
        }

        foreach (Arr::get($payload, 'leads.add', []) as $leadPayload) {
            $this->syncLeadFromWebhook($leadPayload);
            $processed['leads']++;
        }

        foreach (Arr::get($payload, 'leads.update', []) as $leadPayload) {
            $this->syncLeadFromWebhook($leadPayload);
            $processed['leads']++;
        }

        if ($processed['contacts'] === 0 && $processed['leads'] === 0) {
            $processed['ignored'][] = 'No supported contact/lead records found in payload.';
        }

        return $processed;
    }

    public function summarizeOrder(OrdenVenta $orden): array
    {
        $saldoPendiente = max(0, (float) $orden->total - (float) ($orden->monto_abonado ?? 0));
        $factura = FacturaVenta::query()
            ->where('orden_venta_id', $orden->id)
            ->latest('id')
            ->first();

        return [
            'id' => $orden->id,
            'numero_orden' => $orden->numero_orden,
            'estado' => $orden->estado,
            'estado_diseno' => $orden->estado_diseno,
            'fecha_emision' => optional($orden->fecha_emision)->toDateString(),
            'fecha_entrega' => optional($orden->fecha_entrega)->toDateString(),
            'total' => (float) $orden->total,
            'monto_abonado' => (float) ($orden->monto_abonado ?? 0),
            'saldo_pendiente' => round($saldoPendiente, 2),
            'tracking_url' => route('tracking.publico', $orden->tracking_token),
            'cliente' => [
                'id' => $orden->cliente?->id,
                'razon_social' => $orden->cliente?->razon_social,
                'telefono' => $orden->cliente?->telefono,
                'email' => $orden->cliente?->email,
            ],
            'factura' => $factura ? [
                'id' => $factura->id,
                'numero_factura' => $factura->numero_factura,
                'estado' => $factura->estado,
                'saldo_pendiente' => (float) $factura->saldo_pendiente,
                'fe_status' => $factura->fe_status,
                'fe_legal_status' => $factura->fe_legal_status,
                'fe_public_url' => $factura->fe_public_url,
            ] : null,
            'items' => $orden->detalles->map(function ($detalle) {
                return [
                    'id' => $detalle->id,
                    'item_id' => $detalle->item_id,
                    'nombre' => $detalle->item?->nombre,
                    'cantidad' => (float) $detalle->cantidad,
                    'precio_unitario' => (float) $detalle->precio_unitario,
                    'total' => (float) $detalle->total,
                ];
            })->values()->all(),
        ];
    }

    public function mapContact(Contacto $contacto): array
    {
        $pendingBalance = (float) FacturaVenta::query()
            ->where('contacto_id', $contacto->id)
            ->sum('saldo_pendiente');

        return [
            'id' => $contacto->id,
            'razon_social' => $contacto->razon_social,
            'identificacion' => $contacto->identificacion,
            'telefono' => $contacto->telefono,
            'telefono_normalizado' => $this->digitsOnly($contacto->telefono),
            'email' => $contacto->email,
            'es_cliente' => (bool) $contacto->es_cliente,
            'payment_term' => $contacto->payment_term?->nombre,
            'limite_credito' => (float) ($contacto->limite_credito ?? 0),
            'saldo_pendiente_facturas' => round($pendingBalance, 2),
        ];
    }

    public function mapInvoice(FacturaVenta $factura): array
    {
        return [
            'id' => $factura->id,
            'numero_factura' => $factura->numero_factura,
            'fecha_emision' => optional($factura->fecha_emision)->toDateString(),
            'fecha_vencimiento' => optional($factura->fecha_vencimiento)->toDateString(),
            'estado' => $factura->estado,
            'total' => (float) $factura->total,
            'saldo_pendiente' => (float) $factura->saldo_pendiente,
            'fe_status' => $factura->fe_status,
            'fe_legal_status' => $factura->fe_legal_status,
            'fe_public_url' => $factura->fe_public_url,
            'cliente' => [
                'id' => $factura->cliente?->id,
                'razon_social' => $factura->cliente?->razon_social,
            ],
        ];
    }

    public function mapQuote(Cotizacion $cotizacion): array
    {
        return [
            'id' => $cotizacion->id,
            'numero_cotizacion' => $cotizacion->numero_cotizacion,
            'estado' => $cotizacion->estado,
            'fecha_emision' => optional($cotizacion->fecha_emision)->toDateString(),
            'fecha_vencimiento' => optional($cotizacion->fecha_vencimiento)->toDateString(),
            'total' => (float) $cotizacion->total,
            'cliente' => [
                'id' => $cotizacion->cliente?->id,
                'razon_social' => $cotizacion->cliente?->razon_social,
            ],
            'share_available' => false,
        ];
    }

    private function syncContactFromWebhook(array $payload): Contacto
    {
        $normalized = [
            'kommo_contact_id' => (string) ($payload['id'] ?? ''),
            'name' => $payload['name'] ?? null,
            'email' => $this->extractCustomFieldValue($payload, ['email', 'correo']),
            'phone' => $this->extractCustomFieldValue($payload, ['phone', 'telefono', 'teléfono']),
            'company_name' => $payload['name'] ?? null,
        ];

        return $this->resolveOrCreateContact($normalized);
    }

    private function syncLeadFromWebhook(array $payload): CrmLead
    {
        $normalized = [
            'kommo_lead_id' => (string) ($payload['id'] ?? ''),
            'kommo_contact_id' => $this->extractPrimaryLinkedId($payload, 'main_contact', 'linked_contacts_id'),
            'title' => $payload['name'] ?? 'Lead Kommo',
            'expected_value' => $payload['price'] ?? 0,
            'notes' => 'Sincronizado automaticamente desde webhook de Kommo.',
        ];

        $contact = null;

        if ($normalized['kommo_contact_id']) {
            $contactLink = KommoEntityLink::query()
                ->where('kommo_entity_type', 'contact')
                ->where('kommo_entity_id', $normalized['kommo_contact_id'])
                ->first();

            if ($contactLink && $contactLink->local_model_type === Contacto::class) {
                $contact = Contacto::find($contactLink->local_model_id);
            }
        }

        return $this->resolveOrCreateLead($normalized, $contact);
    }

    private function resolveOrCreateContact(array $payload): Contacto
    {
        $kommoContactId = $this->stringOrNull($payload['kommo_contact_id'] ?? $payload['contact_id'] ?? null);
        $phone = $this->stringOrNull($payload['phone'] ?? null);
        $email = $this->stringOrNull($payload['email'] ?? null);
        $name = $this->stringOrNull($payload['name'] ?? $payload['contact_name'] ?? $payload['company_name'] ?? null) ?: 'Contacto Kommo';

        $contact = null;

        if ($kommoContactId) {
            $link = KommoEntityLink::query()
                ->where('kommo_entity_type', 'contact')
                ->where('kommo_entity_id', $kommoContactId)
                ->first();

            if ($link && $link->local_model_type === Contacto::class) {
                $contact = Contacto::find($link->local_model_id);
            }
        }

        if (!$contact && $phone) {
            $digits = $this->digitsOnly($phone);
            $contact = Contacto::query()
                ->whereRaw('REPLACE(REPLACE(REPLACE(telefono, " ", ""), "-", ""), "+", "") like ?', ['%' . $digits . '%'])
                ->first();
        }

        if (!$contact && $email) {
            $contact = Contacto::query()->where('email', $email)->first();
        }

        if (!$contact) {
            $contact = Contacto::create([
                'razon_social' => $name,
                'tipo_identificacion' => 'Pasaporte',
                'identificacion' => $this->generateKommoIdentification($kommoContactId, $phone, $email),
                'telefono' => $phone,
                'email' => $email,
                'es_cliente' => true,
                'payment_term_id' => PaymentTerm::query()->orderBy('id')->value('id'),
            ]);
        } else {
            $contact->fill(array_filter([
                'razon_social' => $contact->razon_social ?: $name,
                'telefono' => $contact->telefono ?: $phone,
                'email' => $contact->email ?: $email,
                'es_cliente' => true,
            ], fn ($value) => $value !== null));

            if ($contact->isDirty()) {
                $contact->save();
            }
        }

        if ($kommoContactId) {
            $this->upsertLink('contact', $kommoContactId, $contact, $payload);
        }

        return $contact;
    }

    private function resolveOrCreateLead(array $payload, ?Contacto $contact = null): CrmLead
    {
        $kommoLeadId = $this->stringOrNull($payload['kommo_lead_id'] ?? $payload['lead_id'] ?? null);
        $title = $this->stringOrNull($payload['title'] ?? null) ?: 'Lead Kommo';

        $lead = null;

        if ($kommoLeadId) {
            $link = KommoEntityLink::query()
                ->where('kommo_entity_type', 'lead')
                ->where('kommo_entity_id', $kommoLeadId)
                ->first();

            if ($link && $link->local_model_type === CrmLead::class) {
                $lead = CrmLead::find($link->local_model_id);
            }
        }

        [$pipeline, $stage] = $this->resolveDefaultPipelineAndStage();

        $attributes = [
            'pipeline_id' => $pipeline->id,
            'stage_id' => $stage->id,
            'contacto_id' => $contact?->id,
            'title' => $title,
            'company_name' => $payload['company_name'] ?? $contact?->razon_social,
            'contact_name' => $payload['contact_name'] ?? $contact?->razon_social,
            'email' => $payload['email'] ?? $contact?->email,
            'phone' => $payload['phone'] ?? $contact?->telefono,
            'source' => 'kommo',
            'probability' => (int) ($payload['probability'] ?? 0),
            'expected_value' => (float) ($payload['expected_value'] ?? 0),
            'next_follow_up_at' => $this->nullableDateTime($payload['next_follow_up_at'] ?? null),
            'last_activity_at' => $this->nullableDateTime($payload['last_activity_at'] ?? now()),
            'notes' => $payload['notes'] ?? null,
            'is_archived' => (bool) ($payload['is_archived'] ?? false),
        ];

        if (!$lead) {
            $lead = CrmLead::create($attributes);
        } else {
            $lead->fill($attributes);
            $lead->save();
        }

        if ($kommoLeadId) {
            $this->upsertLink('lead', $kommoLeadId, $lead, $payload);
        }

        return $lead;
    }

    private function resolveDefaultPipelineAndStage(): array
    {
        $pipeline = CrmPipeline::query()
            ->when(config('kommo.default_pipeline_slug'), fn ($builder, $slug) => $builder->where('slug', $slug))
            ->first();

        if (!$pipeline) {
            $pipeline = CrmPipeline::query()
                ->where('is_default', true)
                ->first();
        }

        if (!$pipeline) {
            $pipeline = CrmPipeline::query()->orderBy('id')->first();
        }

        if (!$pipeline) {
            $pipeline = CrmPipeline::create([
                'name' => 'Kommo',
                'slug' => 'kommo',
                'description' => 'Pipeline creada automaticamente para sincronizacion inicial con Kommo.',
                'is_default' => true,
                'is_active' => true,
            ]);
        }

        $stage = $pipeline->stages()->orderBy('position')->first();

        if (!$stage) {
            $stage = CrmPipelineStage::create([
                'pipeline_id' => $pipeline->id,
                'name' => 'Nuevos Leads',
                'color' => '#0f172a',
                'position' => 1,
                'is_closed_won' => false,
                'is_closed_lost' => false,
            ]);
        }

        return [$pipeline, $stage];
    }

    private function upsertLink(string $entityType, string $entityId, Model $model, array $payload): void
    {
        KommoEntityLink::query()->updateOrCreate(
            [
                'kommo_entity_type' => $entityType,
                'kommo_entity_id' => $entityId,
            ],
            [
                'local_model_type' => $model::class,
                'local_model_id' => $model->getKey(),
                'payload' => $payload,
                'last_synced_at' => now(),
            ]
        );
    }

    private function extractCustomFieldValue(array $payload, array $needles): ?string
    {
        foreach (($payload['custom_fields'] ?? []) as $field) {
            $name = strtolower((string) ($field['name'] ?? ''));

            foreach ($needles as $needle) {
                if (str_contains($name, strtolower($needle))) {
                    $value = Arr::get($field, 'values.0.value');
                    return $this->stringOrNull($value);
                }
            }
        }

        return null;
    }

    private function extractPrimaryLinkedId(array $payload, string ...$keys): ?string
    {
        foreach ($keys as $key) {
            $value = $payload[$key] ?? null;

            if (is_scalar($value) && $value !== '') {
                return (string) $value;
            }

            if (is_array($value) && $value !== []) {
                $firstKey = array_key_first($value);
                if ($firstKey !== null) {
                    return (string) $firstKey;
                }
            }
        }

        return null;
    }

    private function digitsOnly(?string $value): string
    {
        return preg_replace('/\D+/', '', (string) $value) ?: '';
    }

    private function stringOrNull(mixed $value): ?string
    {
        if (!is_scalar($value)) {
            return null;
        }

        $string = trim((string) $value);

        return $string === '' ? null : $string;
    }

    private function nullableDateTime(mixed $value): ?Carbon
    {
        if (!$value) {
            return null;
        }

        try {
            return Carbon::parse($value);
        } catch (\Throwable) {
            return null;
        }
    }

    private function generateKommoIdentification(?string $kommoContactId, ?string $phone, ?string $email): string
    {
        $base = $kommoContactId
            ?: $this->digitsOnly($phone)
            ?: preg_replace('/[^a-z0-9]+/i', '', (string) $email)
            ?: now()->format('YmdHis');

        $base = strtoupper(substr($base, 0, 38));
        $candidate = 'KOMMO-' . $base;
        $suffix = 1;

        while (Contacto::query()->where('identificacion', $candidate)->exists()) {
            $candidate = 'KOMMO-' . substr($base, 0, max(1, 34)) . '-' . $suffix;
            $suffix++;
        }

        return $candidate;
    }
}
