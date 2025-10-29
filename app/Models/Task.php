<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Task extends Model
{
    use HasFactory;

    protected $fillable = [
        'project_id',
        'parent_id',
        'parent_ids',
        'position_x',
        'position_y',
        'free_positioned',
        'point',
        'title',
        'description',
        'image',
        'priority',
        'status',
        'reference_url',
        'reference_urls',
        'reference_files',
        'complete_files',
        'complete_urls',
        'complete_note',
        'start_date',
        'due_date',
        'complete_date',
        'finished_date',
        'created_by',
        'updated_by',
        'deleted_by',
    ];

    protected $casts = [
        'reference_files' => 'array',
        'reference_urls' => 'array',
        'read_markers' => 'array',
        'complete_files' => 'array',
        'complete_urls' => 'array',
        'parent_ids' => 'array',
        'free_positioned' => 'boolean',
        'position_x' => 'integer',
        'position_y' => 'integer',
    ];

    // Define relationship to Project
    public function project()
    {
        return $this->belongsTo(Project::class);
    }

    // Self-referential parent relationship
    public function parent()
    {
        return $this->belongsTo(Task::class, 'parent_id');
    }

    // Self-referential children relationship
    public function children()
    {
        return $this->hasMany(Task::class, 'parent_id');
    }

    /**
     * Helper: return all parent IDs as array (includes legacy parent_id if set)
     */
    public function getAllParentIdsAttribute(): array
    {
        $ids = [];
        try {
            if (is_array($this->parent_ids)) {
                $ids = array_values(array_filter($this->parent_ids, fn($v) => $v !== null && $v !== ''));
            }
            if (!empty($this->parent_id) && !in_array($this->parent_id, $ids)) {
                $ids[] = (int) $this->parent_id;
            }
        } catch (\Throwable $_) {}
        return $ids;
    }

    // Define relationship to TaskAssignment
    public function assignments()
    {
        return $this->hasMany(TaskAssignment::class);
    }

   // Di model Task.php
public function feedback_comments()
{
    return $this->hasMany(TaskFeedback::class);
}

}
