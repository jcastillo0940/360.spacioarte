<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        User::create([
            'name' => 'Administrador ERP',
            'email' => 'admin@tjclogisticspanama.com',
            'password' => Hash::make('Admin2026*'), // Cambia esta clave al entrar
            'role' => 'Administrador', // Campo para RBAC 
        ]);
    }
}