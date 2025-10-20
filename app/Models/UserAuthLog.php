<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class UserAuthLog extends Model
{
    use HasFactory;

    protected $table = 'user_auth_logs';

    protected $fillable = [
        'user_id',
        'employee_id',
        'auth_type',
        'date_time_auth',
        'device_info',
        'ip_address',
        'status',
    ];

    protected $casts = [
        'date_time_auth' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function employee()
    {
        return $this->belongsTo(Employee::class);
    }
}
