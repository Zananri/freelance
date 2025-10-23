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
     * Get parent projects from project_parents table
     */
    public function parents()
    {
        // New approach: use part_of_project pivot table where each parent is a row
        try {
            $parentIds = \DB::table('part_of_project')
                ->where('project_id', $this->id)
                ->pluck('parent_project_id')
                ->toArray();
            if (empty($parentIds)) return collect();
            return Project::whereIn('id', $parentIds)->get();
        } catch (\Throwable $_) {
            return collect();
        }
    }

    /**
     * Get children projects from project_parents table
     */
    public function children()
    {
        try {
            $childrenIds = \DB::table('part_of_project')
                ->where('parent_project_id', (int)$this->id)
                ->pluck('project_id');
            return Project::whereIn('id', $childrenIds)->get();
        } catch (\Throwable $_) {
            return collect();
        }
    }

    /**
     * Check if this project has the given project as parent
     */
    public function hasParent($parentId)
    {
        try {
            return \DB::table('part_of_project')
                ->where('project_id', $this->id)
                ->where('parent_project_id', (int)$parentId)
                ->exists();
        } catch (\Throwable $_) {
            return false;
        }
    }

    /**
     * Add a parent to this project
     */
    public function addParent($parentId)
    {
        $parentId = (int)$parentId;
        try {
            $exists = \DB::table('part_of_project')
                ->where('project_id', $this->id)
                ->where('parent_project_id', $parentId)
                ->exists();
            if (!$exists) {
                \DB::table('part_of_project')->insert([
                    'project_id' => $this->id,
                    'parent_project_id' => $parentId,
                    'is_primary' => false,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        } catch (\Throwable $_) {
            // ignore
        }
        
        // Update legacy_parent_id field if exists (for tree structure positioning)
        if (\Schema::hasColumn('projects', 'legacy_parent_id')) {
            $this->legacy_parent_id = $parentId;
            $this->save();
        }
        
        return $this;
    }

    /**
     * Remove a parent from this project
     */
    public function removeParent($parentId)
    {
        $parentId = (int)$parentId;
        try {
            \DB::table('part_of_project')
                ->where('project_id', $this->id)
                ->where('parent_project_id', $parentId)
                ->delete();
        } catch (\Throwable $_) {
            // ignore
        }
        
        return $this;
    }

    /**
     * Remove all parents from this project
     */
    public function clearParents()
    {
        try {
            \DB::table('part_of_project')
                ->where('project_id', $this->id)
                ->delete();
        } catch (\Throwable $_) {}
        
        // Clear legacy_parent_id field if exists
        if (\Schema::hasColumn('projects', 'legacy_parent_id')) {
            $this->legacy_parent_id = null;
            $this->save();
        }
            
        return $this;
    }
}
