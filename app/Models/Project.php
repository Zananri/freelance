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

    /**
     * Many-to-many self relation: this project may have multiple parents.
     */
    public function parents()
    {
        return $this->belongsToMany(Project::class, 'project_parents', 'project_id', 'parent_project_id')
            ->withTimestamps()
            ->withPivot('is_primary');
    }

    /**
     * Many-to-many self relation: this project may have multiple children.
     */
    public function children()
    {
        return $this->belongsToMany(Project::class, 'project_parents', 'parent_project_id', 'project_id')
            ->withTimestamps()
            ->withPivot('is_primary');
    }

    /**
     * Backward-compatible primary parent accessor using either pivot or legacy part_of_project column.
     */
    public function primaryParent()
    {
        return $this->parents()->wherePivot('is_primary', true)->limit(1);
    }
}
