<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureKommoIntegrationKey
{
    public function handle(Request $request, Closure $next): Response
    {
        $configuredKey = (string) config('kommo.integration_key');

        if ($configuredKey === '') {
            abort(503, 'Kommo integration key is not configured.');
        }

        $providedKey = $this->extractKey($request);

        if (!is_string($providedKey) || $providedKey === '' || !hash_equals($configuredKey, $providedKey)) {
            abort(401, 'Invalid integration key.');
        }

        return $next($request);
    }

    private function extractKey(Request $request): ?string
    {
        $bearerToken = $request->bearerToken();
        if (is_string($bearerToken) && $bearerToken !== '') {
            return $bearerToken;
        }

        $headerToken = $request->header('X-Integration-Key');
        if (is_string($headerToken) && $headerToken !== '') {
            return $headerToken;
        }

        return $request->query('integration_key');
    }
}
