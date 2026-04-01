<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable, HasRoles;

    protected $fillable = [
        'name',
        'email',
        'password',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }
    
    public function recepcionesOrdenes()
    {
        return $this->hasMany(RecepcionOrden::class, 'user_id');
    }

    public function crmLeads()
    {
        return $this->hasMany(CrmLead::class, 'owner_id');
    }

    public function crmActivities()
    {
        return $this->hasMany(CrmActivity::class, 'user_id');
    }
}
