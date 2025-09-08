<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Shift extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'description',
        'time_start',
        'time_end',
        'total_hour',
        'status',
        'created_by',
        'updated_by',
        'deleted_by',
    ];

    public function employeeShifts()
    {
        return $this->hasMany(EmployeeShift::class);
    }

    public function employees()
    {
        return $this->hasMany(Employee::class);
    }
}
