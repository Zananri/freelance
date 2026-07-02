<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AttendanceTracking extends Model
{
    use HasFactory;

    protected $fillable = [
        'attendance_id',
        'type',
        'location',
        'image',
        'date_time',
        'device',
    ];

    protected $casts = [
        'date_time' => 'datetime',
        'image' => 'array',
    ];

    public function attendance()
    {
        return $this->belongsTo(Attendance::class);
    }
}
