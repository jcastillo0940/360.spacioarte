<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('crm_activities', function (Blueprint $table) {
            $table->id();
            $table->foreignId('lead_id')->constrained('crm_leads')->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('activity_type', 50)->default('seguimiento');
            $table->string('priority', 20)->default('normal');
            $table->string('subject');
            $table->text('notes')->nullable();
            $table->timestamp('due_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->boolean('send_email_reminder')->default(true);
            $table->timestamp('email_reminded_at')->nullable();
            $table->timestamps();

            $table->index(['lead_id', 'due_at']);
            $table->index(['user_id', 'due_at']);
            $table->index(['completed_at', 'email_reminded_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('crm_activities');
    }
};
