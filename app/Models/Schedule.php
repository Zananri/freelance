<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Schedule extends Model
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
		'read_markers',
		'executor_ids',
		'start_date',
		'due_date',
		'due_in_days',
		'complete_date',
		'created_by',
		'updated_by',
		'deleted_by',
		'recurrence_type',
		'recurrence_interval',
		'recurrence_day_of_week',
		'recurrence_day_of_month',
		'recurrence_start_date',
		'recurrence_end_date',
		'next_run_at',
		'last_generated_at',
		'is_active',
	];

	protected $casts = [
		'project_id' => 'integer',
		'point' => 'integer',
		'reference_urls' => 'array',
		'reference_files' => 'array',
		'read_markers' => 'array',
	'executor_ids' => 'array',
		'start_date' => 'date',
		'due_date' => 'date',
		'due_in_days' => 'integer',
		'complete_date' => 'date',
		'recurrence_interval' => 'integer',
		'recurrence_day_of_week' => 'integer',
		'recurrence_day_of_month' => 'integer',
		'recurrence_start_date' => 'date',
		'recurrence_end_date' => 'date',
		'next_run_at' => 'datetime',
		'last_generated_at' => 'datetime',
		'is_active' => 'boolean',
	];

    public function project()
    {
        return $this->belongsTo(Project::class, 'project_id');
    }

}

