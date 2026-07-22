<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Job extends Model
{
    use HasFactory;

    protected $table = 'job_list';

    protected $fillable = [
        'department_id',
        'partner_id',
        'division_id',
        'job_name',
        'description',
        'status',
        'created_by',
        'updated_by',
        'deleted_by',
    ];

    public function department()
    {
        return $this->belongsTo(Partner::class, 'partner_id');
    }

    public function partner()
    {
        return $this->belongsTo(Partner::class, 'partner_id');
    }

    public function division()
    {
        return $this->belongsTo(Division::class);
    }
}
