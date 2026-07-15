<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ScheduleRecruitment extends Model
{
    protected $table = 'schedule_recruitments';

    protected $fillable = [
        'candidate_id',
        'job_id',
        'schedule_type',
        'title',
        'description',
        'location',
        'time_start',
        'time_end',
        'meeting_link',
    ];

    public function candidate()
    {
        return $this->belongsTo(Candidate::class, 'candidate_id');
    }

}
