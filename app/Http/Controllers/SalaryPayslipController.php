<?php

namespace App\Http\Controllers;

use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

use App\Helpers\EmployeeHelper;

use App\Models\Department;
use App\Models\Division;
use App\Models\Employee;
use App\Models\EmployeeSalary;
use App\Models\EmployeePayslip;

class SalaryPayslipController extends Controller
{

    public function showSalaryPayslipPage()
    {
        $user = auth()->user();
        $userId = auth()->user()->id;
        
        $employeeActiveIds = EmployeeHelper::EmployeeActiveIds();
        
        $employee = Employee::select('employees.id','employees.user_id','employees.name','employees.status','employees.photo',
                'employees.department_id','employees.division_id',
                'job_list.job_name'
            )
            ->join('job_list','employees.job_id','=','job_list.id')
            ->join('users','employees.user_id','=','users.id')
            ->where('employees.status',"ACTIVE")
            ->whereIn('employees.id',$employeeActiveIds)
        ->get();

        $department = Department::where('status','ACTIVE')->get();
        $division = Division::where('status','ACTIVE')->get();

        return view('employee.salary_payslip',[
            'employee' => $employee,
            'department'    => $department,
            'division'      => $division
        ]);
    }

    public function getEmployeeSalaryData(Request $request){

        $user = auth()->user();
        $userId = auth()->user()->id;
        
        $month = Carbon::today()->format('n');
        $year = Carbon::today()->format('Y');

        if(isset($request->MONTH)){
            $month = $request->MONTH;
        }

        if(isset($request->YEAR)){
            $year = $request->YEAR;
        }

        $firstDayOfMonth = Carbon::create($year, $month, 1)->startOfMonth()->toDateString();
        $lastDayOfMonth = Carbon::create($year, $month, 1)->endOfMonth()->toDateString();

        $employeeActiveIds = EmployeeHelper::EmployeeActiveIds();

        $employeeSalary = EmployeeSalary::with('employee')->whereIn('employee_id',$employeeActiveIds)->get();
        $employeePayslip = EmployeePayslip::with('employee')
            ->where('date_salary','>=',$firstDayOfMonth)
            ->where('date_salary','<=',$lastDayOfMonth)
            ->where('status','ACTIVE')
        ->whereIn('employee_id',$employeeActiveIds)->get();

        return response()->json([
                'code' => 200,
                'status' => 'success',
                'data' => [
                    'employeeSalary' => $employeeSalary,
                    'EmployeePayslip' => $employeePayslip
                ],
                'message' => 'Get employee salary data successfully'
        ]);

    }
}
