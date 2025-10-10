<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

use Carbon\Carbon;

use App\Models\User;
use App\Models\Employee;
use App\Models\EmployeeOvertime;

use App\Models\EmployeeLeave;
use App\Models\EmployeeLeaveRequest;

class HRInfoController extends Controller
{
    public function countEmployeeLeaveRequest()
    {

    }

    public function countEmployeeRequest()
    {

        $today = Carbon::today()->toDateString();
        
        $employeeIds = Employee::select('employees.id')
            ->join('users','employees.user_id','=','users.id')
            ->where('employees.status',"ACTIVE")
            ->whereNotIn('users.user_role',["GENERAL_MANAGER","CEO"])
            ->whereNotIn('users.user_type',["ADMINISTRATOR"])
        ->pluck('id');


        $employeeOvertime = EmployeeOvertime::whereIn('employee_id',$employeeIds)
            ->where('status','REQUEST_SUBMIT')
            ->where('date_overtime','<',$today)
            ->count();

        $employeeLave = EmployeeLeaveRequest::whereIn('employee_id',$employeeIds)
            ->where('status','REQUEST')
            ->count();
            

        return response()->json([
                'code' => 200,
                'status' => 'success',
                'data' => [
                    'employee_overtime' => $employeeOvertime,
                    'employee_leave' => $employeeLave,
                ],
                'message' => 'Get count employee overtime request'
        ]);
    }
}
