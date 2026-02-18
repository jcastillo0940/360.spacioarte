<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            UserSeeder::class,
            ChartOfAccountsSeeder::class,
            InitialConfigSeeder::class,
            ProcesoSeeder::class,
            ItemProduccionSeeder::class,
            PosSeeder::class,
        ]);
    }
}