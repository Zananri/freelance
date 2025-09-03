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
    'parent_id',
        'employee_id',
        'feedback_comment',
        'image',
        'reference_url',
        'reference_urls',
        'reference_file',
        'created_by',
        'updated_by',
        'deleted_by',
    ];

    protected $casts = [
        'reference_urls' => 'array',
    ];

    public function project()
    {
        return $this->belongsTo(Project::class);
    }

    public function employee()
    {
        return $this->belongsTo(Employee::class);
    }

    public function parent()
    {
        return $this->belongsTo(ProjectFeedback::class, 'parent_id');
    }

    public function replies()
    {
        return $this->hasMany(ProjectFeedback::class, 'parent_id');
    }
}
