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