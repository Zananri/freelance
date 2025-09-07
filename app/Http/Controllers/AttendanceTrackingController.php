<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Carbon\Carbon;

use App\Models\User;
use App\Models\Attendance;
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
        ->where('users.user_type',"REGULAR")
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


        $attendance = Attendance::where('date_attendance','>=',$firstDayOfMonth)
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
}
