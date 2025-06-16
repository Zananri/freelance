<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Department extends Model
{
    use HasFactory;

    protected $fillable = [
        'nama_departmen',
        'manager',
        'auth_provider',
        'auth_provider_id',
        'remember_token',
    ];
}
