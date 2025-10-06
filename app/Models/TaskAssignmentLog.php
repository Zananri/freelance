<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TaskAssignmentLog extends Model
{
    use HasFactory;

    protected $table = 'task_assignment_logs';

    protected $fillable = [
        'task_id',
        'employee_id',
        'creator_task',
        'action',
        'status',
        'created_by',
        'updated_by',
        'deleted_by',
    ];

    public function task()
    {
        return $this->belongsTo(Task::class, 'task_id');
    }

    public function employee()
    {
        return $this->belongsTo(Employee::class, 'employee_id');
    }

    public function creator()
    {
        return $this->belongsTo(Employee::class, 'creator_task');
    }

    public function createdByUser()
    {
        return $this->belongsTo(Employee::class, 'created_by');
    }

    public function updatedByUser()
    {
        return $this->belongsTo(Employee::class, 'updated_by');
    }

    public function deletedByUser()
    {
        return $this->belongsTo(Employee::class, 'deleted_by');
    }

    // Convenience status constants
    // Action constants (events)
    const ACTION_PENDING = 'PENDING';
    const ACTION_ACCEPTED = 'ACCEPTED';
    const ACTION_REJECTED = 'REJECTED';
    const ACTION_ISSUED = 'ISSUED';

    // Status constants for the record
    const STATUS_ACTIVE = 'ACTIVE';
    const STATUS_INACTIVE = 'INACTIVE';

    /**
     * Scope to filter by action
     */
    public function scopeOfAction($query, $action)
    {
        return $query->where('action', strtoupper($action));
    }

    /**
     * Normalize action to uppercase and derive status
     */
    public static function normalizeActionAndStatus($action)
    {
        $act = strtoupper($action ?: self::ACTION_PENDING);
        $status = in_array($act, [self::ACTION_PENDING, self::ACTION_ACCEPTED]) ? self::STATUS_ACTIVE : self::STATUS_INACTIVE;
        return [$act, $status];
    }
}
