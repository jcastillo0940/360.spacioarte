<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class KommoInstallation extends Model
{
    protected $fillable = [
        'kommo_account_id',
        'subdomain',
        'base_domain',
        'referer',
        'client_id',
        'scope',
        'token_type',
        'access_token',
        'refresh_token',
        'access_token_expires_at',
        'last_authorized_at',
        'last_refreshed_at',
        'last_error',
        'installed_via_widget',
        'revoked_at',
        'metadata',
    ];

    protected $casts = [
        'scope' => 'array',
        'access_token' => 'encrypted',
        'refresh_token' => 'encrypted',
        'access_token_expires_at' => 'datetime',
        'last_authorized_at' => 'datetime',
        'last_refreshed_at' => 'datetime',
        'revoked_at' => 'datetime',
        'installed_via_widget' => 'boolean',
        'metadata' => 'array',
    ];
}
