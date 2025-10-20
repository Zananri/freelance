<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ActivityTracking extends Model
{
    use HasFactory;

    protected $table = 'activity_trackings';

    protected $fillable = [
        'employee_id',
        'department_id',
        'division_id',
        'time_login',
        'time_logout',
        'location_in',
        'location_out',
        'created_by',
        'updated_by',
        'deleted_by',
    ];

    protected $casts = [
        'time_login' => 'datetime',
        'time_logout' => 'datetime',
    ];

    public function employee()
    {
        return $this->belongsTo(Employee::class);
    }

    public function department()
    {
        return $this->belongsTo(Department::class);
    }

    public function division()
    {
        return $this->belongsTo(Division::class);
    }
}
