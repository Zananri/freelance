<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Employee extends Model
{
    use HasFactory;

    protected $fillable = [
        'department_id',
        'division_id',
        'job_id',
        'profile_picture',
        'name',
        'email',
        'email_work',
        'phone',
        'status',
        'address',
        'photo',
        'ktp',
        'birth_date',
        'hire_date',
        'resign_date',
        'grade',
        'office',
        'created_by',
        'deleted_by',
        'updated_by',
    ];

    public function department()
    {
        return $this->belongsTo(Department::class);
    }

    public function division()
    {
        return $this->belongsTo(Division::class);
    }

    public function job()
    {
        return $this->belongsTo(Job::class);
    }

    public function createdBy()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function deletedBy()
    {
        return $this->belongsTo(User::class, 'deleted_by');
    }

    public function updatedBy()
    {
        return $this->belongsTo(User::class, 'updated_by');
    }
}
