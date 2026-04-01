<?php

use App\Models\TenantConfig;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('alanube_environment_configs', function (Blueprint $table) {
            $table->id();
            $table->string('environment', 20)->unique();
            $table->string('fe_provider')->nullable();
            $table->string('fe_api_base_url')->nullable();
            $table->longText('fe_jwt_token')->nullable();
            $table->string('fe_company_id')->nullable();
            $table->string('fe_office_id')->nullable();
            $table->string('fe_security_code', 20)->nullable();
            $table->longText('fe_company_qr')->nullable();
            $table->string('fe_portal_email')->nullable();
            $table->string('fe_portal_password')->nullable();
            $table->unsignedBigInteger('fe_invoice_range_start')->nullable();
            $table->unsignedBigInteger('fe_invoice_range_end')->nullable();
            $table->string('fe_test_ruc')->nullable();
            $table->string('fe_company_type', 20)->nullable();
            $table->unsignedTinyInteger('fe_type_ruc')->nullable();
            $table->string('fe_trade_name')->nullable();
            $table->string('fe_affiliated_status', 40)->nullable();
            $table->boolean('fe_company_is_active')->nullable();
            $table->unsignedBigInteger('fe_next_id_request')->nullable();
            $table->unsignedBigInteger('fe_next_id_batch_request')->nullable();
            $table->string('fe_logo_url')->nullable();
            $table->longText('fe_signature_p12_base64')->nullable();
            $table->string('fe_signature_p12_password')->nullable();
            $table->longText('fe_authentication_p12_base64')->nullable();
            $table->string('fe_authentication_p12_password')->nullable();
            $table->json('fe_company_payload')->nullable();
            $table->json('fe_office_payload')->nullable();
            $table->timestamps();
        });

        $tenantConfig = TenantConfig::query()->first();
        $sandboxBaseUrl = $tenantConfig?->fe_api_base_url ?: 'https://sandbox-api.alanube.co/pan/v1';
        $productionBaseUrl = str_contains($sandboxBaseUrl, 'sandbox-api.')
            ? str_replace('https://sandbox-api.', 'https://api.', $sandboxBaseUrl)
            : 'https://api.alanube.co/pan/v1';

        DB::table('alanube_environment_configs')->insert([
            'environment' => 'sandbox',
            'fe_provider' => $tenantConfig?->fe_provider ?: 'alanube_pan',
            'fe_api_base_url' => $sandboxBaseUrl,
            'fe_jwt_token' => $tenantConfig?->fe_jwt_token,
            'fe_company_id' => $tenantConfig?->fe_company_id,
            'fe_office_id' => $tenantConfig?->fe_office_id,
            'fe_security_code' => $tenantConfig?->fe_security_code,
            'fe_portal_email' => $tenantConfig?->fe_portal_email,
            'fe_portal_password' => $tenantConfig?->fe_portal_password,
            'fe_invoice_range_start' => $tenantConfig?->fe_invoice_range_start,
            'fe_invoice_range_end' => $tenantConfig?->fe_invoice_range_end,
            'fe_test_ruc' => $tenantConfig?->fe_test_ruc,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        DB::table('alanube_environment_configs')->insert([
            'environment' => 'production',
            'fe_provider' => $tenantConfig?->fe_provider ?: 'alanube_pan',
            'fe_api_base_url' => $productionBaseUrl,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('alanube_environment_configs');
    }
};
