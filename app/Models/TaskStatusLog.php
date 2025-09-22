<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TaskStatusLog extends Model
{
    use HasFactory;

    protected $table = 'task_status_logs';

    protected $fillable = [
        'task_id',
        'employee_id',
        'old_status',
        'new_status',
    ];

    // relations
    public function task()
    {
        return $this->belongsTo(Task::class);
    }

    public function employee()
    {
        return $this->belongsTo(Employee::class);
    }
}
