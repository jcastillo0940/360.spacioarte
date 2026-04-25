<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class KommoWebhookReceipt extends Model
{
    protected $fillable = [
        'event_key',
        'status',
        'headers',
        'payload',
        'notes',
        'processed_at',
    ];

    protected $casts = [
        'headers' => 'array',
        'payload' => 'array',
        'processed_at' => 'datetime',
    ];
}
