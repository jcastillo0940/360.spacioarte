<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    protected $rootView = 'app';

    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    public function share(Request $request): array
    {
        $user = $request->user();

        return array_merge(parent::share($request), [
            'auth' => [
                'user' => $user ? [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    // Convertimos la colección de Spatie a un array de strings para React
                    'roles' => $user->getRoleNames()->toArray(), 
                    // Pluckeamos solo los nombres de permisos y convertimos a array plano
                    'permissions' => $user->getAllPermissions()->pluck('name')->toArray(),
                ] : null,
            ],
            // Manejo de notificaciones flash para el componente Notifications.jsx
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error' => fn () => $request->session()->get('error'),
            ],
            'app_name' => config('app.name'),
            'ziggy' => function() use ($request) {
                try {
                    return array_merge((new \Tighten\Ziggy\Ziggy)->toArray(), [
                        'location' => $request->url(),
                    ]);
                } catch (\Exception $e) {
                    \Log::error('Ziggy sharing error: ' . $e->getMessage());
                    return ['routes' => [], 'url' => config('app.url')];
                }
            },
        ]);
    }
}