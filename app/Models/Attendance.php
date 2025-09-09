<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Carbon\Carbon;

class Attendance extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'employee_id',
        'is_work_outside',
        'date_attendance',
        'time_in',
        'time_out',
        'time_late',
        'status',
        'type_attendance',
        'note',
        'image',
        'created_by',
        'updated_by',
        'deleted_by',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
    'date_attendance' => 'date',
    // time columns are TIME in DB; cast as string to prevent unintended datetime conversion
    'time_in' => 'string',
    'time_out' => 'string',
    'time_late' => 'string',
        'is_work_outside' => 'boolean',
        'image' => 'array',
    ];

    /**
     * Get the employee that owns the attendance.
     */
    public function employee()
    {
        return $this->belongsTo(Employee::class);
    }

    /**
     * Get the attendance trackings for this attendance.
     */
    public function attendanceTrackings()
    {
        return $this->hasMany(AttendanceTracking::class);
    }

    /**
     * Scope a query to only include attendances for a specific employee.
     */
    public function scopeForEmployee($query, $employeeId)
    {
        return $query->where('employee_id', $employeeId);
    }

    /**
     * Scope a query to only include attendances for a specific date.
     */
    public function scopeForDate($query, $date)
    {
        return $query->where('date_attendance', $date);
    }

    /**
     * Scope a query to only include late attendances.
     */
    public function scopeLate($query)
    {
        return $query->whereNotNull('time_late');
    }

    /**
     * Check if attendance is late based on company policy (after 09:15).
     */
    public function isLate()
    {
        if (!$this->time_in) {
            return false;
        }

        $checkInTime = Carbon::parse($this->time_in);
        $lateTime = Carbon::parse('09:15:00');

        return $checkInTime->gt($lateTime);
    }

    /**
     * Calculate working hours.
     */
    public function getWorkingHoursAttribute()
    {
        if ($this->time_in && $this->time_out) {
            $timeIn = Carbon::parse($this->date_attendance . ' ' . $this->time_in);
            $timeOut = Carbon::parse($this->date_attendance . ' ' . $this->time_out);
            // Use %h and %i for hours and minutes
            return $timeIn->diff($timeOut)->format('%h:%i');
        }

        return null;
    }
}
