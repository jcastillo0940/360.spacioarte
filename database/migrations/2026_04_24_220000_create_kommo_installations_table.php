<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('kommo_installations', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('kommo_account_id')->nullable();
            $table->string('subdomain', 120);
            $table->string('base_domain', 190)->nullable();
            $table->string('referer', 190);
            $table->string('client_id', 120)->nullable();
            $table->json('scope')->nullable();
            $table->string('token_type', 40)->nullable();
            $table->longText('access_token')->nullable();
            $table->longText('refresh_token')->nullable();
            $table->timestamp('access_token_expires_at')->nullable();
            $table->timestamp('last_authorized_at')->nullable();
            $table->timestamp('last_refreshed_at')->nullable();
            $table->text('last_error')->nullable();
            $table->boolean('installed_via_widget')->default(false);
            $table->timestamp('revoked_at')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamps();

            $table->index(['subdomain', 'revoked_at']);
            $table->index(['kommo_account_id', 'revoked_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('kommo_installations');
    }
};
