<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('invoice_share_links', function (Blueprint $table) {
            $table->id();
            $table->foreignId('factura_venta_id')->constrained('facturas_venta')->onDelete('cascade');
            $table->string('channel', 30)->default('whatsapp');
            $table->string('target', 30)->default('thermal_ticket');
            $table->string('token', 32)->unique();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('expires_at')->nullable();
            $table->timestamp('last_accessed_at')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index(['factura_venta_id', 'channel', 'target', 'is_active'], 'invoice_share_links_lookup_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('invoice_share_links');
    }
};
