<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Task extends Model
{
    use HasFactory;

    protected $fillable = [
        'project_id',
        'point',
        'title',
        'description',
        'image',
        'priority',
        'status',
        'reference_url',
    'reference_urls',
        'reference_files',
        'start_date',
        'due_date',
        'complete_date',
        'created_by',
        'updated_by',
        'deleted_by',
    ];

    protected $casts = [
        'reference_files' => 'array',
    'reference_urls' => 'array',
    'read_markers' => 'array',
    ];

    // Define relationship to Project
    public function project()
    {
        return $this->belongsTo(Project::class);
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
