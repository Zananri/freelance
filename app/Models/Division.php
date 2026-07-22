<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Division extends Model
{
    use HasFactory;

    protected $fillable = [
        'department_id',
        'partner_id',
        'name_division',
        'status',
        'description',
        'images',
        'created_by',
        'updated_by',
        'deleted_by',
    ];

    public function department()
    {
        return $this->belongsTo(Partner::class, 'partner_id');
    }

    public function partner()
    {
        return $this->belongsTo(Partner::class, 'partner_id');
    }

    public function businessDepartment()
    {
        return $this->hasOneThrough(
            Department::class,
            Partner::class,
            'id',
            'id',
            'partner_id',
            'department_id'
        );
    }

    public function projects()
    {
        return $this->hasMany(Project::class);
    }
}
