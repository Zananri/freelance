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
     * Get parent projects from project_parents table
     */
    public function parents()
    {
        $parentRecord = \DB::table('project_parents')
            ->where('project_id', $this->id)
            ->first();
            
        if (!$parentRecord || !$parentRecord->project_parent_ids) {
            return collect();
        }
        
        $parentIds = json_decode($parentRecord->project_parent_ids, true);
        if (empty($parentIds)) {
            return collect();
        }
        
        return Project::whereIn('id', $parentIds)->get();
    }

    /**
     * Get children projects from project_parents table
     */
    public function children()
    {
        $childrenIds = \DB::table('project_parents')
            ->whereRaw('JSON_CONTAINS(project_parent_ids, ?)', [$this->id])
            ->pluck('project_id');
            
        return Project::whereIn('id', $childrenIds)->get();
    }

    /**
     * Check if this project has the given project as parent
     */
    public function hasParent($parentId)
    {
        $parentRecord = \DB::table('project_parents')
            ->where('project_id', $this->id)
            ->first();
            
        if (!$parentRecord || !$parentRecord->project_parent_ids) {
            return false;
        }
        
        $parentIds = json_decode($parentRecord->project_parent_ids, true);
        return in_array((int)$parentId, array_map('intval', $parentIds ?: []));
    }

    /**
     * Add a parent to this project
     */
    public function addParent($parentId)
    {
        $parentId = (int)$parentId;
        
        // Get existing record or prepare new data
        $existing = \DB::table('project_parents')
            ->where('project_id', $this->id)
            ->first();
            
        if ($existing) {
            $parentIds = json_decode($existing->project_parent_ids, true) ?: [];
            if (!in_array($parentId, array_map('intval', $parentIds))) {
                $parentIds[] = $parentId;
                \DB::table('project_parents')
                    ->where('project_id', $this->id)
                    ->update([
                        'project_parent_ids' => json_encode($parentIds),
                        'updated_at' => now()
                    ]);
            }
        } else {
            \DB::table('project_parents')->insert([
                'project_id' => $this->id,
                'project_parent_ids' => json_encode([$parentId]),
                'created_at' => now(),
                'updated_at' => now()
            ]);
        }
        
        return $this;
    }

    /**
     * Remove a parent from this project
     */
    public function removeParent($parentId)
    {
        $parentId = (int)$parentId;
        
        $existing = \DB::table('project_parents')
            ->where('project_id', $this->id)
            ->first();
            
        if ($existing && $existing->project_parent_ids) {
            $parentIds = json_decode($existing->project_parent_ids, true) ?: [];
            $parentIds = array_values(array_filter(array_map('intval', $parentIds), function($id) use ($parentId) {
                return $id !== $parentId;
            }));
            
            if (empty($parentIds)) {
                \DB::table('project_parents')
                    ->where('project_id', $this->id)
                    ->delete();
            } else {
                \DB::table('project_parents')
                    ->where('project_id', $this->id)
                    ->update([
                        'project_parent_ids' => json_encode($parentIds),
                        'updated_at' => now()
                    ]);
            }
        }
        
        return $this;
    }

    /**
     * Remove all parents from this project
     */
    public function clearParents()
    {
        \DB::table('project_parents')
            ->where('project_id', $this->id)
            ->delete();
            
        return $this;
    }
}
