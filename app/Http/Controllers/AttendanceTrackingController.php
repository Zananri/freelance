<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Carbon\Carbon;

use App\Models\User;
use App\Models\Attendance;
use App\Models\AttendanceTracking;
use App\Models\Employee;


class AttendanceTrackingController extends Controller
{
    public function showAttendanceTrackingPage()
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

        return view('attendance_tracking.attendance_tracking',[
            'employee' => $employee
        ]);
    }

    public function getAttendanceTrackingData(Request $request){

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

        $employee = Employee::select('employees.id')
            ->join('users','employees.user_id','=','users.id')
            ->where('employees.status',"ACTIVE")
            ->whereNotIn('users.user_role',["GENERAL_MANAGER","CEO"])
            ->whereNotIn('users.user_type',["ADMINISTRATOR"])
        ->get();

        $employeeIds = $employee->pluck('id');

        $attendance = Attendance::where('date_attendance','>=',$firstDayOfMonth)
            ->whereIn('employee_id',$employeeIds)
            ->where('date_attendance','<=',$lastDayOfMonth)
            ->get();

            //dd($month,$year, $firstDayOfMonth,$lastDayOfMonth,$attendance);
        return response()->json([
                'code' => 200,
                'status' => 'success',
                'data' => $attendance,
                'message' => 'Get attendance tracking data successfully'
        ]);

    }
    
    public function getAttendanceDetail(Request $request){

        try{
            
            $employeeId = 0;
            $dateAttendance = Carbon::now()->toDateString();

            if(isset($request->EMPLOYEE_ID)){
                $employeeId = $request->EMPLOYEE_ID;
            }

            if(isset($request->DATE_ATTENDANCE)){
                $dateAttendance = Carbon::parse($request->DATE_ATTENDANCE)->toDateString();
            }

            $attendance = Attendance::where('employee_id', $employeeId)
                ->where('date_attendance', $dateAttendance)
            ->first();
 
            if(!$attendance){
                throw new \Exception('Attendance not found');
            }

            $employee = Employee::where('id', $employeeId)->first();

            if(!$employee){
                throw new \Exception('Employee not found');
            }

            $attendanceTracking = AttendanceTracking::where('attendance_id', $attendance->id)
            ->get();
            

            return response()->json([
                    'code' => 200,
                    'status' => 'success',
                    'data' => [
                        'employee'  => $employee,
                        'attendance' => $attendance,
                        'attendance_tracking' => $attendanceTracking
                    ],
                    'message' => 'Succeess get attendance detail'
            ]);

        }catch (\Exception $e){

            return response()->json([
                'code' => 500,
                'status' => 'error',
                'data' => [],
                'message' => $e->getMessage()
            ], 500);

        }
    }
}
