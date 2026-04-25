<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('kommo_entity_links', function (Blueprint $table) {
            $table->id();
            $table->string('kommo_entity_type', 40);
            $table->string('kommo_entity_id', 80);
            $table->string('local_model_type');
            $table->unsignedBigInteger('local_model_id');
            $table->json('payload')->nullable();
            $table->timestamp('last_synced_at')->nullable();
            $table->timestamps();

            $table->unique(['kommo_entity_type', 'kommo_entity_id'], 'kommo_entity_links_unique');
            $table->index(['local_model_type', 'local_model_id'], 'kommo_entity_links_local_model_index');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('kommo_entity_links');
    }
};
