<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Employee extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'region',
        'department_id',
        'partner_id',
        'division_id',
        'job_id',
        'shift_id',
        'total_checkpoint',
        'weekday_off',
        'profile_picture',
        'name',
        'employee_niks',
        'email',
        'email_work',
        'phone',
        'status',
        'bpjs_allowance',
        'no_bpjs',
        'no_bpjstk',
        'bpjs_tenaga_kerja_allowance',
        'pension_allowance',
        'positional_allowance',
        'basic_salary',
        'address',
        'photo',
        'ktp',
        'cv',
        'pkwt',
        'birth_date',
        'hire_date',
        'contract_end_date',
        'resign_date',
        'grade_id',
        'office',
        'created_by',
        'deleted_by',
        'updated_by',
    ];

    public function department()
    {
        return $this->belongsTo(Department::class, 'department_id');
    }

    public function partner()
    {
        return $this->belongsTo(Partner::class, 'partner_id');
    }

    public function businessDepartment()
    {
        return $this->belongsTo(Department::class, 'department_id');
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

    // Office relation (column name is 'office' storing office id)
    public function officeModel()
    {
        return $this->belongsTo(Office::class, 'office');
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
