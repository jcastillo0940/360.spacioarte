<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Limpiar caché de Spatie
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        // 2. Crear los roles del SRS v2.0
        $roles = [
            'Administrador Total',
            'Vendedor',
            'Impresor',
            'Operador de Máquina',
            'Cobrador',
            'Jefe de Bodega'
        ];

        foreach ($roles as $roleName) {
            Role::firstOrCreate(['name' => $roleName]);
        }

        // 3. Crear o actualizar el usuario Administrador
        // Quitamos 'role' del array de creación porque ya no existe la columna
        $admin = User::updateOrCreate(
            ['email' => 'admin@tjclogisticspanama.com'],
            [
                'name' => 'Administrador ERP',
                'password' => Hash::make('Admin2026*'),
            ]
        );

        // 4. Asignar el rol usando la relación de Spatie
        $admin->syncRoles(['Administrador Total']);
    }
}