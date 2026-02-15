<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ChatMessageEvent implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $mensaje;
    public $token;

    public function __construct($mensaje, $token)
    {
        $this->mensaje = $mensaje;
        $this->token = $token;
    }

    public function broadcastOn()
    {
        // Canal único para esta orden
        return new Channel('chat.' . $this->token);
    }

    public function broadcastAs()
    {
        return 'nuevo-mensaje';
    }
}