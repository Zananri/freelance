<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EmployeeActivity extends Model
{
    protected $table = 'employee_activities';

    protected $fillable = [
        'employee_id',
        'menu',
        'activity',
        'description',
        'date_time_activity',
        'status'
    ];

    public $timestamps = true;
}
