<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Candidate extends Model
{
    protected $table = 'candidates';

    public const STATUSES = [
        'Applied',
        'Screening',
        'Interview',
        'Tech Test',
        'Hired',
        'Rejected',
    ];

    protected $fillable = [
        'candidates_name',
        'candidates_email',
        'candidates_phone',
        'candidates_address',
        'job_id',
        'gender',
        'candidates_birthdate',
        'last_education',
        'experience_years',
        'cv_file',
        'expected_salary',
        'photo',
        'source',
        'status',
    ];

    public function scheduleRecruitments()
    {
        return $this->hasMany(ScheduleRecruitment::class, 'candidate_id');
    }

    public function job()
    {
        return $this->belongsTo(Job::class, 'job_id');
    }

    public function scopeStatus($query, string $status)
    {
        return $query->where('status', $status);
    }
}