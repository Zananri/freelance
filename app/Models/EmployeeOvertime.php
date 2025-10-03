<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EmployeeOvertime extends Model
{
    protected $table = 'employee_overtimes';

    protected $fillable = [
        'employee_id',
        'status',

        'description',
        'date_overtime',
        'time_start',
        'time_end',
        'total_overtime',
        
        'photo_start',
        'photo_end',
        'location_start',
        'location_end',

        'reject_note',
        'created_by',
        'updated_by',
        'reject_by',
        'approve_by',
        'approve_at',
        'reject_at'
    ];

    public function employee()
    {
        return $this->belongsTo(Employee::class);
    }
}
