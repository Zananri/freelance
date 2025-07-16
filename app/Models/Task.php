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
        'reference_url',
        'reference_file',
        'start_date',
        'due_date',
        'complete_date',
        'created_by',
        'updated_by',
        'deleted_by',
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
}
