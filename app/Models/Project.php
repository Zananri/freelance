<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Project extends Model
{
    use HasFactory;

    protected $fillable = [
        'image',
        'title',
        'project_type',
        'description',
        'department_id',
        'division_id',
        'status',
        'reference_url',
    'reference_urls',
    'reference_files',
    'read_markers',
        'start_date',
        'due_date',
        'part_of_project',
        'complete_date',
        'created_by',
        'updated_by',
        'deleted_by',
    ];

    /**
     * Cast reference_file to array so we can store multiple filenames as JSON
     */
    protected $casts = [
        'reference_urls' => 'array',
        'reference_files' => 'array',
    'read_markers' => 'array',
    'project_type' => 'string',
    ];

    public function department()
    {
        return $this->belongsTo(Department::class);
    }

    public function division()
    {
        return $this->belongsTo(Division::class);
    }

    public function projectAssignments()
    {
        return $this->hasMany(ProjectAssignment::class);
    }

    public function projectFeedbacks()
    {
        return $this->hasMany(ProjectFeedback::class);
    }

    public function tasks()
    {
        return $this->hasMany(Task::class);
    }
}
