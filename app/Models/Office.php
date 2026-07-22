<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Office extends Model
{
    protected $fillable = [
        'name',
        'location',
        'description',
        'status',
        'created_by',
        'updated_by',
    ];

    public function partners()
    {
        return $this->hasMany(Partner::class, 'office_id');
    }
}
