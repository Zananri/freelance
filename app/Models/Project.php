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
        // Cast start_date and due_date to DateTime instances for consistent handling
        'start_date' => 'datetime',
        'due_date' => 'datetime',
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
        try {
            $childrenIds = \DB::table('project_parents')
                ->whereRaw('JSON_CONTAINS(project_parent_ids, ?)', [json_encode((int)$this->id)])
                ->pluck('project_id');
            return Project::whereIn('id', $childrenIds)->get();
        } catch (\Throwable $e) {
            try {
                $rows = \DB::table('project_parents')->get(['project_id', 'project_parent_ids']);
                $ids = collect($rows)->filter(function ($row) {
                    if (!isset($row->project_parent_ids) || $row->project_parent_ids === null) return false;
                    $raw = $row->project_parent_ids;
                    if (is_string($raw)) {
                        $decoded = json_decode($raw, true);
                        if (is_array($decoded)) {
                            return in_array((int)$this->id, array_map('intval', $decoded));
                        }
                        if (strpos($raw, ',') !== false) {
                            $parts = array_map('trim', explode(',', $raw));
                            return in_array((string)$this->id, $parts) || in_array((int)$this->id, array_map('intval', $parts));
                        }
                    }
                    if (is_array($raw)) {
                        return in_array((int)$this->id, array_map('intval', $raw));
                    }
                    return false;
                })->pluck('project_id')->toArray();

                return Project::whereIn('id', $ids)->get();
            } catch (\Throwable $_) {
                return collect();
            }
        }
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
        
        // Update legacy_parent_id field if exists (for tree structure positioning)
        if (\Schema::hasColumn('projects', 'legacy_parent_id')) {
            $this->legacy_parent_id = $parentId;
            $this->save();
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
        
        // Clear legacy_parent_id field if exists
        if (\Schema::hasColumn('projects', 'legacy_parent_id')) {
            $this->legacy_parent_id = null;
            $this->save();
        }
            
        return $this;
    }
}

