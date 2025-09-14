<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EmployeeLeaveRequest extends Model
{
    protected $table = 'employee_leave_requests';

    //employee_id leave_type reason start_date end_date day_amount photo_1 photo_2 file_1 file_2 reject_reason status
    protected $fillable = [
        'employee_id',

        'leave_type',
        'reason',

        'start_date',
        'end_date',
        'day_amount',
        
        'photo_1',
        'photo_2',
        'file_1',
        'file_2',
        
        'reject_reason',
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
