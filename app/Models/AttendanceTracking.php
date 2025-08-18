<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AttendanceTracking extends Model
{
    use HasFactory;

    protected $fillable = [
        'attendance_id',
        'is_work_outside',
        'type',
        'location',
        'image',
        'date_time',
        'device',
    ];

    protected $casts = [
        'is_work_outside' => 'boolean',
        'date_time' => 'datetime',
    ];

    public function attendance()
    {
        return $this->belongsTo(Attendance::class);
    }
}
