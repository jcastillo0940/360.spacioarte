<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Events\ChatMessageEvent;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

Route::post('/ventas/enviar-chat', function (Request $request) {

    // CORRECCIÓN: 'mensaje' llega como objeto (array en PHP), no como string
    $request->validate([
        'mensaje' => 'required|array', 
        'token'   => 'required|string',
    ]);

    // SEGURIDAD: Validar que el token pertenezca a una orden real antes de emitir eventos
    $existe = \App\Models\OrdenVenta::where('tracking_token', $request->token)->exists();
    
    if (!$existe) {
        return response()->json(['error' => 'Token inválido'], 403);
    }

    // Disparamos el evento al canal de Pusher
    // Esto no toca tu base de datos MySQL, protegiendo el rendimiento
    broadcast(new ChatMessageEvent(
        $request->mensaje,
        $request->token
    ))->toOthers();

    return response()->json([
        'status' => 'Enviado a la nube (Pusher)'
    ]);
});

// Rutas de Diseño - Movidas a web.php para usar sesión web
// Route::middleware('auth:sanctum')->group(function () {
//     Route::get('/ventas/ordenes/{id}/historial', [App\Http\Controllers\Ventas\OrdenVentaController::class, 'getHistorial']);
//     Route::get('/diseno/search', [App\Http\Controllers\Ventas\DesignController::class, 'search']);
//     Route::post('/diseno/upload', [App\Http\Controllers\Ventas\DesignController::class, 'upload']);
// });