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
        'description',
        'department_id',
        'division_id',
        'status',
        'reference_url',
        'reference_file',
        'start_date',
        'due_date',
        'part_of_project',
        'complete_date',
        'created_by',
        'updated_by',
        'deleted_by',
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
}
