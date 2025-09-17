<?php

namespace App\Http\Controllers;

use Carbon\Carbon;
use Illuminate\Http\Request;

use App\Models\Office;
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
        $tomorow = Carbon::today()->addDay()->toDateString();

        // $now = Carbon::parse('2025-09-07 01:15:00');
        // $today = Carbon::parse('2025-09-07')->toDateString();
        // $yesterday = Carbon::parse('2025-09-06')->toDateString();

        $employee = Employee::with('division', 'department', 'job','grade','shift')->where('user_id', $user->id)->first();
        
        $office = Office::where('id',$employee->office)->first();

        $employeeShift = EmployeeShift::with('shift')->where('employee_id', $employee->id)
                ->where('date_shift', $today)
        ->first();

        $employeeShiftYesterday = EmployeeShift::with('shift')->where('employee_id', $employee->id)
                ->where('date_shift', $yesterday)
        ->first();
  
        $employeeShiftToday = EmployeeShift::with('shift')->where('employee_id', $employee->id)
            ->where('date_shift', $today)
        ->first();

        $employeeShiftYesterday = EmployeeShift::with('shift')->where('employee_id', $employee->id)
                ->where('date_shift', $yesterday)
        ->first();

        $rangeStart = Carbon::parse($today.' '.$employee->shift->time_start)->subHours(2); 
        $rangeEnd = Carbon::parse($today.' '.$employee->shift->time_end)->addHours(3);

        $timeStart = Carbon::parse($employee->shift->time_start);
        $timeEnd = Carbon::parse($employee->shift->time_end);
        
        if($timeEnd < $timeStart){
            $rangeStart = Carbon::parse($today.' '.$employee->shift->time_start)->subHours(2); 
            $rangeEnd = Carbon::parse($tomorow.' '.$employee->shift->time_end)->addHours(3);
        }

        if($employeeShiftToday){

            $rangeStart = Carbon::parse($today.' '.$employeeShiftToday->shift->time_start)->subHours(2); 
            $rangeEnd = Carbon::parse($today.' '.$employeeShiftToday->shift->time_end)->addHours(3);

            $timeStart = Carbon::parse($today.' '.$employeeShiftToday->shift->time_start);
            $timeEnd = Carbon::parse($today.' '.$employeeShiftToday->shift->time_end);
            

            if($timeEnd < $timeStart){
                $rangeStart = Carbon::parse($today.' '.$employeeShiftToday->shift->time_start)->subHours(2); 
                $rangeEnd = Carbon::parse($tomorow.' '.$employeeShiftToday->shift->time_end)->addHours(3);
            }
            
        }        
        
        
        if($employeeShiftYesterday){


            $checkTimeStart = Carbon::parse($yesterday.' '.$employeeShiftYesterday->shift->time_start);
            $checkTimeEnd = Carbon::parse($yesterday.' '.$employeeShiftYesterday->shift->time_end);
            
            
            

            if($checkTimeEnd < $checkTimeStart){
            

                $checkRangeStart = Carbon::parse($yesterday.' '.$employeeShiftYesterday->shift->time_start)->subHours(2); 
                $checkRangeEnd = Carbon::parse($today.' '.$employeeShiftYesterday->shift->time_end)->addHours(3);

                if($now <= $checkRangeEnd && $now >= $checkRangeStart){

                    $timeStart = Carbon::parse($yesterday.' '.$employeeShiftYesterday->shift->time_start);
                    $timeEnd = Carbon::parse($today.' '.$employeeShiftYesterday->shift->time_end);
            
                    $rangeStart = Carbon::parse($yesterday.' '.$employeeShiftYesterday->shift->time_start)->subHours(2); 
                    $rangeEnd = Carbon::parse($today.' '.$employeeShiftYesterday->shift->time_end)->addHours(3);
                }
            }
            
        }

        
        
        $isLate = '';

        $atendanceTrackingCheckin = '';
        $atendanceTrackingCheckout = '';

        
        $timeIn = '';
        $timeOut = '';

        $totalWorkHour = '';
        
        $attendance = Attendance::where('employee_id', $employee->id)
            ->where('date_attendance', $rangeStart->addHours(2)->toDateString())
        ->first();

        $todayDate = $rangeStart->format('l, j F Y');


        if($attendance){
 
            $attendanceTimeIn = Carbon::parse($attendance->time_in);
 
            if($attendanceTimeIn > $timeStart){
                $isLate = 'islate';
            }

            //dd($isLate,$attendanceTimeIn,$timeStart);

            $atendanceTrackingCheckin = AttendanceTracking::where('attendance_id', $attendance->id)
                ->where('type', 'check_in')
            ->first();

            $atendanceTrackingCheckout = AttendanceTracking::where('attendance_id', $attendance->id)
                ->where('type', 'check_out')
            ->first();
            

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
        


        return view('dashboard', compact('employee','office', 'attendance','employeeShift','todayDate','isLate','timeIn','timeOut','atendanceTrackingCheckin','atendanceTrackingCheckout'));
    }

    // 'Present'

    // 'Absent'

    // 'Leave'

    // 'Holiday'

    // 'Half-Day'

    // 'Remote Work'
}
