<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('notas_credito', function (Blueprint $table) {
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
        Schema::table('notas_credito', function (Blueprint $table) {
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
    }
};
