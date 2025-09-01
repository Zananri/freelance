<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Employee extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'department_id',
        'division_id',
        'job_id',
        'shift_id',
        'profile_picture',
        'name',
    'employee_niks',
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
    'grade_id',
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

    public function grade()
    {
        return $this->belongsTo(Grade::class, 'grade_id');
    }

    public function shift()
    {
        return $this->belongsTo(Shift::class);
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

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function projectAssignments()
    {
        return $this->hasMany(ProjectAssignment::class);
    }

    public function projectFeedbacks()
    {
        return $this->hasMany(ProjectFeedback::class);
    }

    public function attendances()
    {
        return $this->hasMany(Attendance::class);
    }

    public function shifts()
    {
        return $this->hasMany(EmployeeShift::class);
    }

    // Accessor for first name
    public function getFirstNameAttribute()
    {
        $parts = explode(' ', trim($this->name));
        return $parts[0] ?? '';
    }

    // Accessor for last name
    public function getLastNameAttribute()
    {
        $parts = explode(' ', trim($this->name));
        return count($parts) > 1 ? $parts[count($parts) - 1] : '';
    }
}
