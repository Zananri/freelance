<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TaskFeedback extends Model
{
    use HasFactory;

    protected $fillable = [
        'project_id',
        'task_id',
        'employee_id',
        'feedback_comment',
        'image',
        'reference_url',
        'reference_file',
    ];

    // Define relationships if needed
    public function project()
    {
        return $this->belongsTo(Project::class);
    }

    public function task()
    {
        return $this->belongsTo(Task::class);
    }

    public function employee()
    {
        return $this->belongsTo(Employee::class);
    }
}
