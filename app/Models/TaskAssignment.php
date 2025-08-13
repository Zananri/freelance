<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TaskAssignment extends Model
{
    use HasFactory;

    protected $fillable = [
        'task_id',
        'employee_id',
        'role',
        'is_receive',
        'date_receive',
    ];

    // Define relationship to Task
    public function task()
    {
        return $this->belongsTo(Task::class);
    }

    // Define relationship to Employee
    public function employee()
    {
        return $this->belongsTo(Employee::class);
    }
}
