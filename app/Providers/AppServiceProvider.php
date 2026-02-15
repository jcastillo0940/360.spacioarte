<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        // Indicamos a Laravel que la ruta pública real es public_html
        // Esto corrige problemas con las rutas de imágenes y archivos cargados
        $this->app->bind('path.public', function() {
            return base_path('public_html');
        });
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        //
    }
}