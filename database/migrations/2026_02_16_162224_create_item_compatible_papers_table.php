<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('item_compatible_papers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained('items')->onDelete('cascade');
            $table->foreignId('paper_id')->constrained('items')->onDelete('cascade');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('item_compatible_papers');
    }
};
