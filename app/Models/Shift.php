<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Shift extends Model
{
    use HasFactory;

    protected $casts = [
        'checkpoint_times' => 'array',
    ];

    protected $fillable = [
        'title',
        'description',
        'time_start',
        'time_end',
        'total_hour',
        'total_checkpoint',
        'checkpoint_times',
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
