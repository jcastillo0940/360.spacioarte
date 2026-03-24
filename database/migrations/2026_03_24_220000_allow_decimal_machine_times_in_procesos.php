<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement('ALTER TABLE procesos MODIFY tiempo_setup_minutos DECIMAL(10,2) NOT NULL DEFAULT 0');
        DB::statement('ALTER TABLE procesos MODIFY tiempo_estimado_por_unidad DECIMAL(10,2) NOT NULL DEFAULT 0');
    }

    public function down(): void
    {
        DB::statement('ALTER TABLE procesos MODIFY tiempo_setup_minutos INT NOT NULL DEFAULT 0');
        DB::statement('ALTER TABLE procesos MODIFY tiempo_estimado_por_unidad INT NOT NULL DEFAULT 0');
    }
};
