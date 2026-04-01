<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AlanubeEnvironmentConfig extends Model
{
    protected $fillable = [
        'environment',
        'fe_provider',
        'fe_api_base_url',
        'fe_jwt_token',
        'fe_company_id',
        'fe_office_id',
        'fe_security_code',
        'fe_company_qr',
        'fe_portal_email',
        'fe_portal_password',
        'fe_invoice_range_start',
        'fe_invoice_range_end',
        'fe_test_ruc',
        'fe_company_type',
        'fe_type_ruc',
        'fe_trade_name',
        'fe_affiliated_status',
        'fe_company_is_active',
        'fe_next_id_request',
        'fe_next_id_batch_request',
        'fe_logo_url',
        'fe_signature_p12_base64',
        'fe_signature_p12_password',
        'fe_authentication_p12_base64',
        'fe_authentication_p12_password',
        'fe_company_payload',
        'fe_office_payload',
    ];

    protected $casts = [
        'fe_type_ruc' => 'integer',
        'fe_company_is_active' => 'boolean',
        'fe_next_id_request' => 'integer',
        'fe_next_id_batch_request' => 'integer',
        'fe_company_payload' => 'array',
        'fe_office_payload' => 'array',
    ];

    public static function forEnvironment(?string $environment): ?self
    {
        $environment = in_array($environment, ['sandbox', 'production'], true)
            ? $environment
            : 'sandbox';

        return self::query()->where('environment', $environment)->first();
    }

    public static function defaultBaseUrl(string $environment): ?string
    {
        return match ($environment) {
            'sandbox' => 'https://sandbox-api.alanube.co/pan/v1',
            'production' => 'https://api.alanube.co/pan/v1',
            default => null,
        };
    }
}
