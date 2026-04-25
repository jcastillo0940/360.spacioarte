<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Integrations\KommoIntegrationController;
use App\Http\Controllers\Integrations\KommoOAuthController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

Route::prefix('integrations/kommo')->group(function () {
    Route::post('/webhooks/events', [KommoIntegrationController::class, 'receiveWebhook'])
        ->middleware('kommo.webhook');

    Route::middleware('kommo.auth')->group(function () {
        Route::get('/ping', [KommoIntegrationController::class, 'ping']);
        Route::get('/contacts/search', [KommoIntegrationController::class, 'searchContacts']);
        Route::post('/contacts/sync', [KommoIntegrationController::class, 'syncContact']);
        Route::get('/oauth/status', [KommoOAuthController::class, 'status']);
        Route::get('/oauth/start-url', [KommoOAuthController::class, 'startUrl']);
        Route::post('/oauth/refresh', [KommoOAuthController::class, 'refresh']);
        Route::get('/orders/{numeroOrden}', [KommoIntegrationController::class, 'showOrder']);
        Route::get('/invoices/by-contact/{contacto}', [KommoIntegrationController::class, 'invoicesByContact']);
        Route::get('/quotes/by-contact/{contacto}', [KommoIntegrationController::class, 'quotesByContact']);
        Route::post('/invoices/{factura}/share-whatsapp', [KommoIntegrationController::class, 'shareInvoiceWhatsapp']);
        Route::post('/leads/sync', [KommoIntegrationController::class, 'syncLead']);
    });
});
