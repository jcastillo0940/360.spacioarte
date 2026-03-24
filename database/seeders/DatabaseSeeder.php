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
            FamiliaProduccionSeeder::class,
            ProcesoSeeder::class,
            BaseMaterialCatalogSeeder::class,
            SupportMaterialCatalogSeeder::class,
            ItemProduccionSeeder::class,
            PosSeeder::class,
        ]);
    }
}
