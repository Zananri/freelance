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
        'created_by',
        'updated_by',
        'deleted_by',
    ];

    protected $casts = [
        'time_start' => 'datetime:H:i',
        'time_end' => 'datetime:H:i',
        'total_hour' => 'decimal:2',
    ];

    public function employeeShifts()
    {
        return $this->hasMany(EmployeeShift::class);
    }
}
