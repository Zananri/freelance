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
}
