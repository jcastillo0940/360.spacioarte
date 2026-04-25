<?php

namespace App\Http\Controllers\Integrations;

use App\Http\Controllers\Controller;
use App\Models\KommoInstallation;
use App\Services\Integrations\KommoOAuthService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class KommoOAuthController extends Controller
{
    public function __construct(private readonly KommoOAuthService $oauth)
    {
    }

    public function status(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'subdomain' => 'nullable|string|max:120',
        ]);

        return response()->json(
            $this->oauth->statusBySubdomain($validated['subdomain'] ?? null)
        );
    }

    public function startUrl(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'subdomain' => 'nullable|string|max:120',
        ]);

        $status = $this->oauth->statusBySubdomain($validated['subdomain'] ?? null);

        return response()->json([
            'authorization_url' => $status['authorization_url'],
            'subdomain' => $status['subdomain'],
        ]);
    }

    public function callback(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'code' => 'required|string',
            'referer' => 'nullable|string',
            'referrer' => 'nullable|string',
            'state' => 'nullable|string',
            'from_widget' => 'nullable',
        ]);

        $referer = $validated['referer'] ?? $validated['referrer'] ?? null;

        if (!$referer) {
            abort(422, 'Kommo referer/referrer parameter is missing.');
        }

        $installation = $this->oauth->exchangeAuthorizationCode(
            $validated['code'],
            $referer,
            $request->boolean('from_widget')
        );

        $target = config('services.kommo.oauth_success_redirect') ?: route('login');

        return redirect()->away($target . '?' . http_build_query([
            'kommo_connected' => 1,
            'subdomain' => $installation->subdomain,
        ]));
    }

    public function refresh(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'installation_id' => 'nullable|integer|exists:kommo_installations,id',
            'subdomain' => 'nullable|string|max:120',
        ]);

        $installation = KommoInstallation::query()
            ->when(isset($validated['installation_id']), fn ($query) => $query->where('id', $validated['installation_id']))
            ->when(isset($validated['subdomain']), fn ($query) => $query->where('subdomain', strtolower($validated['subdomain'])))
            ->latest('id')
            ->firstOrFail();

        $installation = $this->oauth->refreshInstallation($installation);

        return response()->json([
            'message' => 'Kommo access token refreshed.',
            'installation' => $this->oauth->mapInstallation($installation),
        ]);
    }

    public function revoked(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'account_id' => 'nullable|integer',
            'client_id' => 'nullable|string|max:120',
        ]);

        $installation = $this->oauth->revokeAccess(
            $validated['account_id'] ?? null,
            $validated['client_id'] ?? null
        );

        return response()->json([
            'ok' => true,
            'installation_found' => (bool) $installation,
        ]);
    }
}
