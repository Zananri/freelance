<?php

namespace App\Http\Controllers;

use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;


use App\Models\Employee;
use App\Models\EmployeeSalary;

class SalaryPayslipController extends Controller
{

    public function showSalaryPayslipPage()
    {
        $user = auth()->user();
        $userId = auth()->user()->id;
        
        $currentEmployee = Employee::where('user_id', $userId)->first();
        
        $userType = strtoupper((string) ($user->user_type ?? ''));
        $userRole = strtoupper((string) ($user->user_role ?? ''));

        
        $employee = Employee::select('employees.id','employees.user_id','employees.weekday_off','employees.department_id','employees.division_id','employees.name','employees.status','employees.photo',
            'job_list.job_name'
        )
        ->join('job_list','employees.job_id','=','job_list.id')
        ->join('users','employees.user_id','=','users.id')
        ->where('employees.status',"ACTIVE");


        if (in_array($userType, ['ADMINISTRATOR','MANAGEMENT']) && in_array($userRole, ['ADMINISTRATOR','GENERAL_MANAGER', 'CEO','HR_MANAGER'])) {
            //show all
        }else{
            $employee = $employee->where('employees.department_id',$currentEmployee->department_id);
        }

        $employee = $employee->whereNotIn('users.user_role',["GENERAL_MANAGER","CEO"])
            ->whereNotIn('users.user_type',["ADMINISTRATOR"])
        ->get();

        return view('employee.salary_payslip',[
            'employee' => $employee
        ]);
    }
}
