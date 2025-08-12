<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class EmployeeShift extends Model
{
    use HasFactory;

    protected $fillable = [
        'employee_id',
        'date_shift',
        'time_start',
        'time_end',
        'total_hour',
    ];

    protected $casts = [
        'date_shift' => 'date',
        'time_start' => 'datetime:H:i',
        'time_end' => 'datetime:H:i',
        'total_hour' => 'decimal:2',
    ];

    public function employee()
    {
        return $this->belongsTo(Employee::class);
    }
}
