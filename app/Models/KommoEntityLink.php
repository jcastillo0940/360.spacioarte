<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class KommoEntityLink extends Model
{
    protected $fillable = [
        'kommo_entity_type',
        'kommo_entity_id',
        'local_model_type',
        'local_model_id',
        'payload',
        'last_synced_at',
    ];

    protected $casts = [
        'payload' => 'array',
        'last_synced_at' => 'datetime',
    ];

    public function localModel(): MorphTo
    {
        return $this->morphTo(__FUNCTION__, 'local_model_type', 'local_model_id');
    }
}
