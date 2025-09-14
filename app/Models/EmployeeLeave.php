<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EmployeeLeave extends Model
{
    protected $table = 'employee_leaves';

    protected $fillable = [
        'employee_id',
        'year',

        'annual_leave',
        'collective_leave',
        'sick',

        'remaining_annual_leave',
        'remaining_collective_leave',
        'remaining_sick',

        'special_leave',
        'remaining_special_leave',
        
        'status',
        'created_by',
        'updated_by',
        'deleted_by'
    ];

    public function employee()
    {
        return $this->belongsTo(Employee::class);
    }
}
