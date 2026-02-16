<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

$app = Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        channels: __DIR__.'/../routes/channels.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        $middleware->web(append: [
            \App\Http\Middleware\HandleInertiaRequests::class,
        ]);
        
        $middleware->statefulApi();

        // CORRECCIÓN: Excluimos explícitamente la ruta del chat de la verificación CSRF
        // Esto soluciona de raíz el error 419 (Page Expired)
        $middleware->validateCsrfTokens(except: [
            'api/ventas/enviar-chat',
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        //
    })->create();

$app->usePublicPath(realpath(__DIR__.'/../public_html'));

return $app;