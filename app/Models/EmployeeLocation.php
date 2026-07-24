<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EmployeeLocation extends Model
{
    protected $fillable = [
        'employee_id',
        'latitude',
        'longitude',
        'accuracy',
        'tracked_at',
    ];

    public function employee() {
        return $this->belongsTo(Employee::class, 'employee_id');
    }
}
