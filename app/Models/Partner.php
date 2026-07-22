<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Partner extends Model
{
    protected $appends = [
        'name_department',
    ];

    protected $fillable = [
        'partner_name',
        'department_id',
        'office_id',
        'status',
        'description',
        'images',
        'created_by',
        'updated_by',
        'deleted_by',
    ];

    public function getNameDepartmentAttribute(): string
    {
        return (string) $this->partner_name;
    }

    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class, 'department_id');
    }

    public function office(): BelongsTo
    {
        return $this->belongsTo(Office::class, 'office_id');
    }

    public function divisions(): HasMany
    {
        return $this->hasMany(Division::class, 'partner_id');
    }

    public function jobs(): HasMany
    {
        return $this->hasMany(Job::class, 'partner_id');
    }

    public function employees(): HasMany
    {
        return $this->hasMany(Employee::class, 'partner_id');
    }
}
