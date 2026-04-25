<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureKommoWebhookSecret
{
    public function handle(Request $request, Closure $next): Response
    {
        $configuredSecret = (string) config('kommo.webhook_secret');

        if ($configuredSecret === '') {
            abort(503, 'Kommo webhook secret is not configured.');
        }

        $providedSecret = (string) ($request->query('secret') ?: $request->header('X-Kommo-Webhook-Secret'));

        if ($providedSecret === '' || !hash_equals($configuredSecret, $providedSecret)) {
            abort(401, 'Invalid webhook secret.');
        }

        return $next($request);
    }
}
