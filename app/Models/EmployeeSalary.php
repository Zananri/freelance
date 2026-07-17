<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class EmployeeSalary extends Model
{
    use HasFactory;

    protected $fillable = [
        'employee_id',
        'take_home_pay',
        'basic_salary',
        'positional_allowance',
        'bpjs_allowance',
        'bpjs_tenaga_kerja_allowance',
        'pension_allowance',
        'bank_name',
        'bank_account_number',
        'bank_account_name',
        'status',
        'created_by',
        'updated_by',
    ];

    //
    public function employee()
    {
        return $this->belongsTo(Employee::class);
    }
}
