<?php

namespace App\Events;

use App\Models\OrdenVenta;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class OrderStateChanged implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $orden;
    public $nuevoEstado;

    public function __construct(OrdenVenta $orden, string $nuevoEstado)
    {
        $this->orden = $orden;
        $this->nuevoEstado = $nuevoEstado;
    }

    public function broadcastOn()
    {
        return new Channel('orders');
    }

    public function broadcastWith()
    {
        return [
            'id' => $this->orden->id,
            'numero_orden' => $this->orden->numero_orden,
            'estado' => $this->nuevoEstado,
            'updated_at' => now()->toIso8601String()
        ];
    }
}
