<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('roles')) {
            return;
        }

        $now = now();

        DB::table('roles')->updateOrInsert(
            ['name' => 'Developer', 'guard_name' => 'web'],
            ['created_at' => $now, 'updated_at' => $now]
        );

        DB::table('roles')->updateOrInsert(
            ['name' => 'Superadmin', 'guard_name' => 'web'],
            ['created_at' => $now, 'updated_at' => $now]
        );
    }

    public function down(): void
    {
        if (!Schema::hasTable('roles')) {
            return;
        }

        DB::table('roles')
            ->whereIn('name', ['Developer', 'Superadmin'])
            ->where('guard_name', 'web')
            ->delete();
    }
};
