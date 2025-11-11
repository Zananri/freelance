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
        'internet_phone_allowance',
        'meal_allowance',
        'transportation_allowance',
        'positional_allowance',
        'basic_salary',
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
