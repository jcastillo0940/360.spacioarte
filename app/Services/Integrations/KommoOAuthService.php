<?php

namespace App\Services\Integrations;

use App\Models\KommoInstallation;
use Illuminate\Http\Client\RequestException;
use Illuminate\Support\Arr;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use RuntimeException;

class KommoOAuthService
{
    public function findActiveInstallation(?string $subdomain): ?KommoInstallation
    {
        $normalized = $this->normalizeSubdomain($subdomain);

        return KommoInstallation::query()
            ->when($normalized, fn ($query) => $query->where('subdomain', $normalized))
            ->whereNull('revoked_at')
            ->latest('id')
            ->first();
    }

    public function buildAuthorizationUrl(?string $state = null): string
    {
        $clientId = config('services.kommo.client_id');
        $redirectUri = config('services.kommo.redirect_uri');

        if (!$clientId || !$redirectUri) {
            throw new RuntimeException('Kommo OAuth is not configured. Missing client_id or redirect_uri.');
        }

        $query = http_build_query([
            'client_id' => $clientId,
            'state' => $state ?: Str::random(32),
            'mode' => 'popup',
        ]);

        return 'https://www.kommo.com/oauth?' . $query;
    }

    public function exchangeAuthorizationCode(string $code, string $referer, bool $fromWidget = false): KommoInstallation
    {
        $normalizedReferer = $this->normalizeReferer($referer);
        $tokenData = $this->requestToken($normalizedReferer, [
            'client_id' => config('services.kommo.client_id'),
            'client_secret' => config('services.kommo.client_secret'),
            'grant_type' => 'authorization_code',
            'code' => $code,
            'redirect_uri' => config('services.kommo.redirect_uri'),
        ]);

        return $this->persistInstallation($normalizedReferer, $tokenData, $fromWidget);
    }

    public function refreshInstallation(KommoInstallation $installation): KommoInstallation
    {
        if (!$installation->refresh_token) {
            throw new RuntimeException('This Kommo installation does not have a refresh token.');
        }

        $tokenData = $this->requestToken($installation->referer, [
            'client_id' => config('services.kommo.client_id'),
            'client_secret' => config('services.kommo.client_secret'),
            'grant_type' => 'refresh_token',
            'refresh_token' => $installation->refresh_token,
            'redirect_uri' => config('services.kommo.redirect_uri'),
        ]);

        return $this->persistInstallation($installation->referer, $tokenData, $installation->installed_via_widget, $installation);
    }

    public function statusBySubdomain(?string $subdomain): array
    {
        $normalized = $this->normalizeSubdomain($subdomain);

        $installation = $normalized
            ? KommoInstallation::query()->where('subdomain', $normalized)->latest('id')->first()
            : KommoInstallation::query()->latest('id')->first();

        $configured = $this->isConfigured();

        return [
            'configured' => $configured,
            'connected' => (bool) ($installation && !$installation->revoked_at),
            'subdomain' => $normalized,
            'authorization_url' => $configured ? $this->buildAuthorizationUrl($this->stateForSubdomain($normalized)) : null,
            'installation' => $installation ? $this->mapInstallation($installation) : null,
        ];
    }

    public function isConfigured(): bool
    {
        return filled(config('services.kommo.client_id'))
            && filled(config('services.kommo.client_secret'))
            && filled(config('services.kommo.redirect_uri'));
    }

    public function revokeAccess(?int $accountId, ?string $clientId): ?KommoInstallation
    {
        $installation = KommoInstallation::query()
            ->when($accountId, fn ($query) => $query->where('kommo_account_id', $accountId))
            ->when($clientId, fn ($query) => $query->where('client_id', $clientId))
            ->latest('id')
            ->first();

        if ($installation) {
            $installation->update([
                'revoked_at' => now(),
                'last_error' => 'Access revoked from Kommo.',
            ]);
        }

        return $installation;
    }

    public function mapInstallation(KommoInstallation $installation): array
    {
        return [
            'id' => $installation->id,
            'kommo_account_id' => $installation->kommo_account_id,
            'subdomain' => $installation->subdomain,
            'base_domain' => $installation->base_domain,
            'referer' => $installation->referer,
            'client_id' => $installation->client_id,
            'scope' => $installation->scope ?: [],
            'token_type' => $installation->token_type,
            'access_token_expires_at' => optional($installation->access_token_expires_at)?->toIso8601String(),
            'last_authorized_at' => optional($installation->last_authorized_at)?->toIso8601String(),
            'last_refreshed_at' => optional($installation->last_refreshed_at)?->toIso8601String(),
            'installed_via_widget' => (bool) $installation->installed_via_widget,
            'revoked_at' => optional($installation->revoked_at)?->toIso8601String(),
            'last_error' => $installation->last_error,
        ];
    }

    public function fetchEntitySnapshot(?string $subdomain, string $entityType, string $entityId): array
    {
        $installation = $this->findActiveInstallation($subdomain);

        if (!$installation) {
            throw new RuntimeException('No active Kommo installation found for this subdomain.');
        }

        if ($installation->access_token_expires_at && $installation->access_token_expires_at->isPast()) {
            $installation = $this->refreshInstallation($installation);
        }

        $normalizedEntityType = strtolower(trim($entityType));

        if (!in_array($normalizedEntityType, ['contacts', 'leads'], true)) {
            throw new RuntimeException('Unsupported Kommo entity type.');
        }

        $payload = $this->requestApi(
            $installation,
            $normalizedEntityType . '/' . rawurlencode($entityId),
            $normalizedEntityType === 'leads' ? ['with' => 'contacts'] : []
        );

        return $normalizedEntityType === 'contacts'
            ? $this->mapContactSnapshot($payload)
            : $this->mapLeadSnapshot($payload);
    }

    private function requestToken(string $referer, array $payload): array
    {
        try {
            return Http::asJson()
                ->acceptJson()
                ->timeout(20)
                ->post($referer . '/oauth2/access_token', $payload)
                ->throw()
                ->json();
        } catch (RequestException $e) {
            $body = $e->response?->json();
            $message = Arr::get($body, 'hint')
                ?: Arr::get($body, 'title')
                ?: $e->getMessage();

            throw new RuntimeException('Kommo token request failed: ' . $message, previous: $e);
        }
    }

    private function requestApi(KommoInstallation $installation, string $path, array $query = []): array
    {
        try {
            return Http::acceptJson()
                ->withToken($installation->access_token)
                ->timeout(20)
                ->get(rtrim($installation->referer, '/') . '/api/v4/' . ltrim($path, '/'), $query)
                ->throw()
                ->json();
        } catch (RequestException $e) {
            $body = $e->response?->json();
            $message = Arr::get($body, 'detail')
                ?: Arr::get($body, 'title')
                ?: $e->getMessage();

            throw new RuntimeException('Kommo API request failed: ' . $message, previous: $e);
        }
    }

    private function persistInstallation(string $referer, array $tokenData, bool $fromWidget = false, ?KommoInstallation $installation = null): KommoInstallation
    {
        $subdomain = $this->extractSubdomain($referer);
        $baseDomain = parse_url($referer, PHP_URL_HOST);
        $accountId = Arr::get($tokenData, 'account_id');

        $installation = $installation
            ?: KommoInstallation::query()
                ->when($accountId, fn ($query) => $query->where('kommo_account_id', $accountId))
                ->where('subdomain', $subdomain)
                ->latest('id')
                ->first()
            ?: new KommoInstallation();

        $expiresAt = now()->addSeconds((int) Arr::get($tokenData, 'expires_in', 86400));

        $installation->fill([
            'kommo_account_id' => $accountId,
            'subdomain' => $subdomain,
            'base_domain' => $baseDomain,
            'referer' => $referer,
            'client_id' => config('services.kommo.client_id'),
            'scope' => $this->normalizeScope(Arr::get($tokenData, 'scope')),
            'token_type' => Arr::get($tokenData, 'token_type', 'Bearer'),
            'access_token' => Arr::get($tokenData, 'access_token'),
            'refresh_token' => Arr::get($tokenData, 'refresh_token'),
            'access_token_expires_at' => $expiresAt,
            'last_authorized_at' => $installation->exists ? $installation->last_authorized_at : now(),
            'last_refreshed_at' => $installation->exists ? now() : null,
            'last_error' => null,
            'installed_via_widget' => $fromWidget,
            'revoked_at' => null,
            'metadata' => [
                'raw_token_payload' => Arr::except($tokenData, ['access_token', 'refresh_token']),
            ],
        ]);

        if (!$installation->exists) {
            $installation->last_authorized_at = now();
        }

        $installation->save();

        return $installation->fresh();
    }

    private function normalizeReferer(string $referer): string
    {
        $referer = trim($referer);

        if ($referer === '') {
            throw new RuntimeException('Kommo referer is required.');
        }

        if (!str_starts_with($referer, 'http://') && !str_starts_with($referer, 'https://')) {
            $referer = 'https://' . $referer;
        }

        $host = parse_url($referer, PHP_URL_HOST);

        if (!$host) {
            throw new RuntimeException('Kommo referer is invalid.');
        }

        return 'https://' . $host;
    }

    private function extractSubdomain(string $referer): string
    {
        $host = parse_url($referer, PHP_URL_HOST) ?: '';
        $parts = explode('.', $host);

        return $parts[0] ?? $host;
    }

    private function normalizeSubdomain(?string $subdomain): ?string
    {
        if (!$subdomain) {
            return null;
        }

        return strtolower(trim($subdomain));
    }

    private function normalizeScope(mixed $scope): array
    {
        if (is_array($scope)) {
            return array_values(array_filter(array_map('strval', $scope)));
        }

        if (is_string($scope) && trim($scope) !== '') {
            return preg_split('/\s+/', trim($scope)) ?: [];
        }

        return [];
    }

    private function stateForSubdomain(?string $subdomain): string
    {
        return base64_encode(json_encode([
            'subdomain' => $subdomain,
            'ts' => Carbon::now()->timestamp,
        ]));
    }

    private function mapContactSnapshot(array $payload): array
    {
        return [
            'entity_type' => 'contacts',
            'entity_id' => (string) Arr::get($payload, 'id', ''),
            'name' => (string) Arr::get($payload, 'name', ''),
            'phone' => $this->extractPrimaryFieldValue($payload, ['PHONE']),
            'email' => $this->extractPrimaryFieldValue($payload, ['EMAIL']),
            'custom_fields_values' => Arr::get($payload, 'custom_fields_values', []),
        ];
    }

    private function mapLeadSnapshot(array $payload): array
    {
        $contacts = collect(Arr::get($payload, '_embedded.contacts', []))
            ->map(function ($contact) {
                return [
                    'id' => (string) Arr::get($contact, 'id', ''),
                    'name' => (string) Arr::get($contact, 'name', ''),
                    'phone' => $this->extractPrimaryFieldValue($contact, ['PHONE']),
                    'email' => $this->extractPrimaryFieldValue($contact, ['EMAIL']),
                ];
            })
            ->values()
            ->all();

        return [
            'entity_type' => 'leads',
            'entity_id' => (string) Arr::get($payload, 'id', ''),
            'name' => (string) Arr::get($payload, 'name', ''),
            'price' => (float) Arr::get($payload, 'price', 0),
            'contacts' => $contacts,
            'primary_contact' => $contacts[0] ?? null,
        ];
    }

    private function extractPrimaryFieldValue(array $payload, array $fieldCodes): ?string
    {
        foreach (Arr::get($payload, 'custom_fields_values', []) as $field) {
            $code = strtoupper((string) Arr::get($field, 'field_code', ''));

            if (!in_array($code, $fieldCodes, true)) {
                continue;
            }

            foreach (Arr::get($field, 'values', []) as $value) {
                $resolved = trim((string) Arr::get($value, 'value', ''));

                if ($resolved !== '') {
                    return $resolved;
                }
            }
        }

        return null;
    }
}
