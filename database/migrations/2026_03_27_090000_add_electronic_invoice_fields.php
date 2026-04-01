<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tenant_configs', function (Blueprint $table) {
            $table->boolean('fe_enabled')->default(false)->after('factura_inicio');
            $table->boolean('fe_auto_emit')->default(false)->after('fe_enabled');
            $table->string('fe_provider')->nullable()->after('fe_auto_emit');
            $table->string('fe_environment')->nullable()->after('fe_provider');
            $table->string('fe_api_base_url')->nullable()->after('fe_environment');
            $table->text('fe_jwt_token')->nullable()->after('fe_api_base_url');
            $table->string('fe_company_id')->nullable()->after('fe_jwt_token');
            $table->string('fe_office_id')->nullable()->after('fe_company_id');
            $table->string('fe_portal_email')->nullable()->after('fe_office_id');
            $table->string('fe_portal_password')->nullable()->after('fe_portal_email');
            $table->unsignedBigInteger('fe_invoice_range_start')->nullable()->after('fe_portal_password');
            $table->unsignedBigInteger('fe_invoice_range_end')->nullable()->after('fe_invoice_range_start');
            $table->string('fe_test_ruc')->nullable()->after('fe_invoice_range_end');
        });

        Schema::table('facturas_venta', function (Blueprint $table) {
            $table->string('fe_provider')->nullable()->after('estado');
            $table->string('fe_status')->nullable()->after('fe_provider');
            $table->string('fe_legal_status')->nullable()->after('fe_status');
            $table->string('fe_document_id')->nullable()->after('fe_legal_status');
            $table->string('fe_cufe')->nullable()->after('fe_document_id');
            $table->timestamp('fe_issue_date')->nullable()->after('fe_cufe');
            $table->timestamp('fe_last_sync_at')->nullable()->after('fe_issue_date');
            $table->text('fe_public_url')->nullable()->after('fe_last_sync_at');
            $table->text('fe_container_xml_url')->nullable()->after('fe_public_url');
            $table->json('fe_request_payload')->nullable()->after('fe_container_xml_url');
            $table->json('fe_response_payload')->nullable()->after('fe_request_payload');
            $table->text('fe_error_message')->nullable()->after('fe_response_payload');
        });
    }

    public function down(): void
    {
        Schema::table('facturas_venta', function (Blueprint $table) {
            $table->dropColumn([
                'fe_provider',
                'fe_status',
                'fe_legal_status',
                'fe_document_id',
                'fe_cufe',
                'fe_issue_date',
                'fe_last_sync_at',
                'fe_public_url',
                'fe_container_xml_url',
                'fe_request_payload',
                'fe_response_payload',
                'fe_error_message',
            ]);
        });

        Schema::table('tenant_configs', function (Blueprint $table) {
            $table->dropColumn([
                'fe_enabled',
                'fe_auto_emit',
                'fe_provider',
                'fe_environment',
                'fe_api_base_url',
                'fe_jwt_token',
                'fe_company_id',
                'fe_office_id',
                'fe_portal_email',
                'fe_portal_password',
                'fe_invoice_range_start',
                'fe_invoice_range_end',
                'fe_test_ruc',
            ]);
        });
    }
};
