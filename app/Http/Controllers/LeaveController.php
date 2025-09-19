<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

use Carbon\Carbon;

use App\Models\User;
use App\Models\Employee;
use App\Models\EmployeeLeave;
use App\Models\EmployeeLeaveRequest;

class LeaveController extends Controller
{
    public function showLeavePage()
    {
        $employee = Employee::select('employees.id','employees.user_id','employees.department_id','employees.division_id','employees.name','employees.status','employees.photo',
            'job_list.job_name'
        )
        ->join('job_list','employees.job_id','=','job_list.id')
        ->join('users','employees.user_id','=','users.id')
        ->where('employees.status',"ACTIVE")
        ->whereNotIn('users.user_role',["GENERAL_MANAGER","CEO"])
        ->whereNotIn('users.user_type',["ADMINISTRATOR"])
        ->get();

        return view('leave.leave',[
            'employee' => $employee
        ]);
    }

    public function getEmployeeLeaveByYear(Request $request)
    {

        $year = Carbon::today()->format('Y');

        if(isset($request->YEAR)){
            $year = $request->YEAR;
        }

        $employee = Employee::select('employees.id')
            ->join('users','employees.user_id','=','users.id')
            ->where('employees.status',"ACTIVE")
            ->whereNotIn('users.user_role',["GENERAL_MANAGER","CEO"])
            ->whereNotIn('users.user_type',["ADMINISTRATOR"])
        ->get();

        $employeeIds = $employee->pluck('id');

        $employeeLave = EmployeeLeave::where('year',$year)
            ->whereIn('employee_id',$employeeIds)
            ->get();

        return response()->json([
                'code' => 200,
                'status' => 'success',
                'data' => $employeeLave,
                'message' => 'Get employee leave successfully'
        ]);
    }

    public function allEmployeeLeaveRequest(Request $request){


        $employeeActive = Employee::select('employees.id')
            ->join('users','employees.user_id','=','users.id')
            ->whereIn('employees.status',["ACTIVE","RESIGN"])
            ->whereNotIn('users.user_role',["GENERAL_MANAGER","CEO"])
            ->whereNotIn('users.user_type',["ADMINISTRATOR"])
        ->get();

        $employeeLeaveRequest = EmployeeLeaveRequest::with('employee')
            ->whereIn('employee_id',$employeeActive->pluck('id'))
            ->whereIn('status',['REQUEST','APPROVED','REJECTED'])
            ->orderBy('created_at','desc')
        ->get();
    
        
        return response()->json([
            'code' => 200,
            'status' => 'success',
            'data' => [
                'employeeLeaveRequest' => $employeeLeaveRequest
            ],
            'message' => 'All request time off'
        ]);
    }

}
