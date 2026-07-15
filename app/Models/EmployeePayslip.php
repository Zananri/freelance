<?php

namespace App\Models;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class EmployeePayslip extends Model
{
    use HasFactory;

    protected $fillable = [
        'employee_id',
        'date_salary',
        'date_salary_send',
        'date_payslip_send',
        'payslip_path',
        
        'total_day_active',
        'total_working_day',
        'total_working_day_meal',

        'take_home_pay',
        'basic_salary',
        'positional_allowance',
        '',
        'meal_allowance',
        'transportation_allowance',

        'prorate_basic_salary',
        'prorate_positional_allowance',
        'prorate_internet_phone_allowance',
        'prorate_meal_allowance',
        'prorate_transportation_allowance',

        'bonus',
        'overtime',
        'thr',

        'bank_name',
        'bank_account_number',
        'bank_account_name',

        'deduction',
        'deduction_absent',
        'deduction_leave',
        'deduction_sick',
        'deduction_pph21',
        'deduction_bpjs_kesehatan',
        'deduction_bpjs_tenaga_kerja',
        'deduction_asuransi_kesehatan',
        'deduction_late',
        
        'note',
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
