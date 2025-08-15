<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ProjectFeedback extends Model
{
    use HasFactory;

    protected $table = 'project_feedbacks';

    protected $fillable = [
        'project_id',
        'employee_id',
        'feedback_comment',
        'image',
        'reference_url',
        'reference_file',
        'created_by',
        'updated_by',
        'deleted_by',
    ];

    public function project()
    {
        return $this->belongsTo(Project::class);
    }

    public function employee()
    {
        return $this->belongsTo(Employee::class);
    }
}
