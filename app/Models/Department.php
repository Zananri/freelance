<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Department extends Model
{
    use HasFactory;

    protected $fillable = [
        'name_department',
        'status',
        'description',
        'images',
        'created_by',
        'updated_by',
        'deleted_by',
    ];

    public function divisions()
    {
        return $this->hasMany(Division::class);
    }

    public function partners()
    {
        return $this->hasMany(Partner::class);
    }

    public function projects()
    {
        return $this->hasMany(Project::class);
    }
}
