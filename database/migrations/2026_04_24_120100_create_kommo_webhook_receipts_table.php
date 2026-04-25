<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('kommo_webhook_receipts', function (Blueprint $table) {
            $table->id();
            $table->string('event_key', 80)->default('unknown');
            $table->string('status', 40)->default('received');
            $table->json('headers')->nullable();
            $table->json('payload');
            $table->text('notes')->nullable();
            $table->timestamp('processed_at')->nullable();
            $table->timestamps();

            $table->index(['event_key', 'created_at']);
            $table->index(['status', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('kommo_webhook_receipts');
    }
};
