<?php

namespace App\Http\Controllers;

use Carbon\Carbon;
use Illuminate\Http\Request;
use App\Models\Employee;
use App\Models\Attendance;
use App\Models\AttendanceTracking;
use App\Models\EmployeeShift;

class DashboardController extends Controller
{
    public function dashboard()
    {
        $user = auth()->user();

        $now = Carbon::now();
        $today = Carbon::today()->toDateString();
        $yesterday = Carbon::today()->subDays(1)->toDateString();


        $employee = Employee::with('division', 'department', 'job','grade','shift')->where('user_id', $user->id)->first();

        $employeeShift = EmployeeShift::with('shift')->where('employee_id', $employee->id)
                ->where('date_shift', $today)
        ->first();

        $employeeShiftYesterday = EmployeeShift::with('shift')->where('employee_id', $employee->id)
                ->where('date_shift', $yesterday)
        ->first();

        $attendance = Attendance::where('employee_id', $employee->id)
            ->where('date_attendance', $today)
        ->first();
        
        $timeStart = Carbon::parse($employee->shift->time_start);
        $timeEnd = Carbon::parse($employee->shift->time_end);
        
        
        if($employeeShift){
            $timeStart = Carbon::parse($employeeShift->shift->time_start);
            $timeEnd = Carbon::parse($employeeShift->shift->time_end);
        }

        

        $shiftTimeType = 'NORMAL';
        
        if($employeeShiftYesterday){

            $timeStartYesterday = Carbon::parse($employeeShiftYesterday->shift->time_start);
            $timeEndYesterday = Carbon::parse($employeeShiftYesterday->shift->time_end);

            if($timeEndYesterday < $timeStartYesterday){
                $shiftTimeType = 'OVERNIGHT';

                //Jika belum lewat 2 jam waktu checkout
                if($now->diffInHours($timeEndYesterday) > -2){
                    $timeStart = $timeStartYesterday;
                    $timeEnd = $timeEndYesterday;
                    
                    $employeeShift = $employeeShiftYesterday;
                    $attendance = Attendance::where('employee_id', $employee->id)
                            ->where('date_attendance', $yesterday)
                    ->first();
                }
            }
            
            
        }

        $isLate = '';

        $atendanceTrackingCheckin = '';
        $atendanceTrackingCheckout = '';


        if($attendance){
            $attendanceTimeIn = Carbon::parse($attendance->time_in);

            if($attendanceTimeIn > $timeStart){
                $isLate = 'islate';
            }

            $atendanceTrackingCheckin = AttendanceTracking::where('attendance_id', $attendance->id)
                ->where('type', 'check_in')
            ->first();

            $atendanceTrackingCheckout = AttendanceTracking::where('attendance_id', $attendance->id)
                ->where('type', 'check_out')
            ->first();

        }

        $todayDate = Carbon::now()->format('l, j F Y'); 
        
        $timeIn = '';
        $timeOut = '';

        $totalWorkHour = '';


        if($attendance){
            
            if($attendance->time_in){
                $timeIn = Carbon::parse($attendance->time_in)->format('H:i');
            }

            if($attendance->time_out){
                $timeOut = Carbon::parse($attendance->time_out)->format('H:i');
            }
            
            if($attendance->time_in && $attendance->time_out){
                $totalWorkHour = Carbon::parse($attendance->time_in)->diffInHours(Carbon::parse($attendance->time_out));
            }
        }

        //dd($timeIn,$timeOut,$totalWorkHour);
        //dd($timeStart->format('H:i'),$timeEnd->format('H:i'));
        


        return view('dashboard', compact('employee', 'attendance','employeeShift','shiftTimeType','todayDate','isLate','timeIn','timeOut','atendanceTrackingCheckin','atendanceTrackingCheckout'));
    }

    // 'Present'

    // 'Absent'

    // 'Leave'

    // 'Holiday'

    // 'Half-Day'

    // 'Remote Work'
}
