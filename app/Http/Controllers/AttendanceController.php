<?php

namespace App\Http\Controllers;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Carbon\Carbon;
use App\Models\Office;
use App\Models\Employee;
use App\Models\EmployeeShift;

use App\Models\EmployeeLeave;
use App\Models\EmployeeOvertime;
use App\Models\EmployeeLeaveRequest;

use App\Models\Attendance;
use App\Models\AttendanceTracking;
use App\Helpers\DeviceHelper;
use App\Helpers\ActivityHelper;
use Illuminate\Http\Request;

class AttendanceController extends Controller
{

    
    public function showAttendancePage()
    {
        
        $user = auth()->user();

        $month = Carbon::today()->format('n');
        $year = Carbon::today()->format('Y');

        $now = Carbon::now();
        $today = Carbon::today()->toDateString();
        $yesterday = Carbon::today()->subDays(1)->toDateString();
        $tomorow = Carbon::today()->addDay()->toDateString();
        
        $firstDayOfMonth = Carbon::create($year, $month, 1)->startOfMonth()->toDateString();
        $lastDayOfMonth = Carbon::create($year, $month, 1)->endOfMonth()->toDateString();

        // $now = Carbon::parse('2025-09-07 01:15:00');
        // $today = Carbon::parse('2025-09-07')->toDateString();
        // $yesterday = Carbon::parse('2025-09-06')->toDateString();

        $employee = Employee::with('division', 'department', 'job','grade','shift')->where('user_id', $user->id)->first();
        $employeeLeave = EmployeeLeave::where('employee_id',$employee->id)->where('year',date('Y'))->first();
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

        $todayDate = $rangeStart->format('j F Y');


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

        $timeStart = $timeStart->format('H:i');
        $timeEnd = $timeEnd->format('H:i');
        
        
        
        

        $overtimeTotalDays = EmployeeOvertime::where('employee_id',$employee->id)
            ->where('status','APPROVED')
            ->where('date_overtime','>=',$firstDayOfMonth)
            ->where('date_overtime','<=',$lastDayOfMonth)
        ->count();

        $overtimeTotalHours = EmployeeOvertime::select(DB::raw('SUM(TIME_TO_SEC(`total_overtime`)) AS total_hours'))
            ->where('employee_id',$employee->id)
            ->where('status','APPROVED')
            ->where('date_overtime','>=',$firstDayOfMonth)
            ->where('date_overtime','<=',$lastDayOfMonth)
            ->groupBy('employee_id')
        ->get();

        if(count($overtimeTotalHours) > 0){
            $overtimeTotalHours = $overtimeTotalHours[0]['total_hours'];
        }else{
            $overtimeTotalHours = 0;
        }


        
        try {
            ActivityHelper::record([
                'employee_id' => $employee?->id,
                'menu' => 'ATTENDANCE',
                'activity' => 'VIEW_PAGE',
                'description' => ($employee?->name ?? 'Unknown') . ' View page attendance',
            ]);
        } catch (\Throwable $_) {}

        return view('attendance.attendance', compact('employee','employeeLeave','overtimeTotalDays','overtimeTotalHours','office', 'timeStart','timeEnd', 'attendance','employeeShift','todayDate','isLate','timeIn','timeOut','atendanceTrackingCheckin','atendanceTrackingCheckout'));
    
    }

    // Record page view activity for attendance page (safe, non-blocking)
    // We add call near return points; above is main return.

    public function getAttendanceEmployeeByMonth(Request $request){

        try{

        
            $userId = Auth::user()->id;

            $month = '';
            $year = '';

            if(isset($request->MONTH)){
                $month = $request->MONTH;
            }

            if(isset($request->YEAR)){
                $year = $request->YEAR;
            }

            if(!$month || !$year){
                throw new \Exception('Month and year is required');
            }

            $employee = Employee::with('division', 'department', 'job','grade','shift')->where('user_id',$userId)->first();

            $firstDayOfMonth = Carbon::create($year, $month, 1)->startOfMonth()->toDateString();
            $lastDayOfMonth = Carbon::create($year, $month, 1)->endOfMonth()->toDateString();

            $attendance = Attendance::where('date_attendance','>=',$firstDayOfMonth)
                ->where('date_attendance','<=',$lastDayOfMonth)
                ->where('employee_id',$employee->id)
                ->get();

                //dd($month,$year, $firstDayOfMonth,$lastDayOfMonth,$attendance);
            return response()->json([
                    'code' => 200,
                    'status' => 'success',
                    'data' => $attendance,
                    'message' => 'Get attendance tracking data successfully'
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

    public function submitCheckin(Request $request){
        try {
            DB::beginTransaction();

            $request->validate([
                'is_work_outside' => 'required|in:0,1,true,false',
                'latitudeCheckIn' => 'required',
                'longitudeCheckIn' => 'required',
                'photo_checkin' => 'nullable|image|mimes:jpeg,png,jpg|max:10048',
            ]);

            //$request->hasFile('photo_checkin');
            
            $user = auth()->user();
            $userId = $user->id;

            $workOutside = $request->input('is_work_outside');
            $latitude = $request->input('latitudeCheckIn');
            $longitude = $request->input('longitudeCheckIn');
            $location = $latitude . ',' . $longitude;

            //$image = $request->file('photo_checkin');
            //$imageName = 'ATTENDANCE_' . time() . '.' . $image->getClientOriginalExtension();

            $now = Carbon::now();
            $today = Carbon::today()->toDateString();
            $yesterday = Carbon::today()->subDays(1)->toDateString();
            $tomorow = Carbon::today()->addDay()->toDateString();

            $employee = Employee::with('shift')->where('user_id', $userId)->first();
            
            $shiftId = $employee->shift_id;

            $employeeShiftToday = EmployeeShift::with('shift')->where('employee_id', $employee->id)
                ->where('date_shift', $today)
            ->first();

            $employeeShiftYesterday = EmployeeShift::with('shift')->where('employee_id', $employee->id)
                    ->where('date_shift', $yesterday)
            ->first();

            $rangeStart = Carbon::parse($today.' '.$employee->shift->time_start)->subHours(2); 
            $rangeEnd = Carbon::parse($today.' '.$employee->shift->time_end)->addHours(6);

            $timeStart = Carbon::parse($employee->shift->time_start);
            $timeEnd = Carbon::parse($employee->shift->time_end);
            
            if($timeEnd < $timeStart){
                $rangeStart = Carbon::parse($today.' '.$employee->shift->time_start)->subHours(2); 
                $rangeEnd = Carbon::parse($tomorow.' '.$employee->shift->time_end)->addHours(6);
            }


            
            if($employeeShiftToday){

                $rangeStart = Carbon::parse($today.' '.$employeeShiftToday->shift->time_start)->subHours(2); 
                $rangeEnd = Carbon::parse($today.' '.$employeeShiftToday->shift->time_end)->addHours(6);

                $timeStart = Carbon::parse($today.' '.$employeeShiftToday->shift->time_start);
                $timeEnd = Carbon::parse($today.' '.$employeeShiftToday->shift->time_end);
                
                $shiftId = $employeeShiftToday->shift_id;

                if($timeEnd < $timeStart){
                    
                    $rangeStart = Carbon::parse($today.' '.$employeeShiftToday->shift->time_start)->subHours(2); 
                    $rangeEnd = Carbon::parse($tomorow.' '.$employeeShiftToday->shift->time_end)->addHours(6);
                }
                
            }
            
            $dateAttendance = Carbon::today()->toDateString();
            
            if($employeeShiftYesterday){


                $checkTimeStart = Carbon::parse($yesterday.' '.$employeeShiftYesterday->shift->time_start);
                $checkTimeEnd = Carbon::parse($yesterday.' '.$employeeShiftYesterday->shift->time_end);
                

                if($checkTimeEnd < $checkTimeStart){

                    $checkRangeStart = Carbon::parse($yesterday.' '.$employeeShiftYesterday->shift->time_start)->subHours(2); 
                    $checkRangeEnd = Carbon::parse($today.' '.$employeeShiftYesterday->shift->time_end)->addHours(6);

                    if($now <= $checkRangeEnd && $now >= $checkRangeStart){

                        $shiftId = $employeeShiftYesterday->shift_id;

                        $timeStart = Carbon::parse($yesterday.' '.$employeeShiftYesterday->shift->time_start);
                        $timeEnd = Carbon::parse($today.' '.$employeeShiftYesterday->shift->time_end);
                        
                        $rangeStart = Carbon::parse($yesterday.' '.$employeeShiftYesterday->shift->time_start)->subHours(2); 
                        $rangeEnd = Carbon::parse($today.' '.$employeeShiftYesterday->shift->time_end)->addHours(6);
                    }
                }
                
            }
            

            if($now <= $rangeEnd && $now >= $rangeStart){
                $dateAttendance = $rangeStart->addHours(2)->toDateString();
            }else{
                throw new \Exception('Check In only in you shift time');
            }


            $attendance = Attendance::where('employee_id', $employee->id)
                ->where('date_attendance', $dateAttendance)
            ->first();

            
            
            $imageArray = [];

            if ($request->hasFile('photo_checkin')) {

                $image = $request->file('photo_checkin');
                $imageName = 'ATTENDANCE_' . time() . '.' . $image->getClientOriginalExtension();

                $destinationPath = public_path('file/attendance');
                $image->move($destinationPath, $imageName);
                $imageArray[] = 'file/attendance/' . $imageName;
            }

            if($workOutside == 1 && count($imageArray) == 0){
                throw new \Exception('Work outside, please add photo');
            }

            $statusAttendance = 'INCOMPLETE_CHECK';
            $timeLate = '00:00:00';

            if($now > $timeStart){
                $timeLate = $now->diff($timeStart)->format('%H:%I:%S');
            }

            if($timeLate != '00:00:00'){
                $statusAttendance = 'LATE';
            };


            $attendanceExist = Attendance::where('employee_id',$employee->id)->where('date_attendance',$now->toDateString())->first();
            $attendanceId = 0;

            
            if($attendanceExist){
                $attendanceId = $attendanceExist->id;
                $attendanceExist->update([
                    'time_in' => $now->format('H:i'),
                    'status'    => $statusAttendance,
                    'time_late' => $timeLate,
                    'shift_time_start' => $timeStart->format('H:i'),
                    'shift_time_end' => $timeEnd->format('H:i'),
                    'updated_by' => $userId
                ]);
            }else{
                // Create attendance record
                $attendance = Attendance::create([
                    'employee_id' => $employee->id,
                    'date_attendance' => $dateAttendance,
                    'time_in' => $now->format('H:i'),
                    'type_attendance' => 'check_in',
                    'shift_time_start' => $timeStart->format('H:i'),
                    'shift_time_end' => $timeEnd->format('H:i'),
                    'note' => null,
                    'status' => $statusAttendance,
                    'image' => $imageArray,
                    'time_late' => $timeLate,
                    'created_by' => $userId,
                    'updated_by' => $userId
                ]);

                $attendanceId = $attendance->id;

                EmployeeShift::updateOrCreate(
                    [
                        'employee_id' => $employee->id,
                        'date_shift' => $dateAttendance,
                    ],
                    [
                        'shift_id' => $shiftId,
                    ]
                );
            }

            

            // Create attendance tracking record
            $attendanceTracking = AttendanceTracking::create([
                'attendance_id' => $attendanceId,
                'is_work_outside' => $workOutside,
                'type' => 'check_in',
                'location' => $location, // Set null dulu sesuai permintaan
                'device' => DeviceHelper::getDeviceFromRequest($request), // Simpan device awal
                'image' => $imageArray, // Simpan juga di attendance_trackings
                'date_time' => $now,
                'created_by' => $userId,
                'updated_by' => $userId
            ]);

            DB::commit();

            try {
                ActivityHelper::record([
                    'employee_id' => $employee?->id,
                    'menu' => 'ATTENDANCE',
                    'activity' => 'CHECK_IN',
                    'description' => ($employee?->name ?? 'Unknown') . ' performed check in',
                    'date_time_activity' => $now,
                ]);
            } catch (\Throwable $_) {}

            return response()->json([
                'code' => 200,
                'status' => 'success',
                'data' => [],
                'message' => 'Check In successfully'
            ]);

        } catch (\Exception $e) {

            DB::rollBack();
            
            return response()->json([
                'code' => 500,
                'status' => 'error',
                'data' => [],
                'message' => $e->getMessage()
            ], 500);
        }

    }

    public function submitCheckout(Request $request){
        try {
            DB::beginTransaction();

            $request->validate([
                'is_work_outside' => 'required|in:0,1,true,false',
                'latitudeCheckOut' => 'required',
                'longitudeCheckOut' => 'required',
                'photo_checkout' => 'nullable|image|mimes:jpeg,png,jpg|max:10048',
            ]);

            //$request->hasFile('photo_checkin');
            
            $user = auth()->user();
            $userId = $user->id;

            $workOutside = $request->input('is_work_outside');
            $latitude = $request->input('latitudeCheckOut');
            $longitude = $request->input('longitudeCheckOut');
            $location = $latitude . ',' . $longitude;

            //$image = $request->file('photo_checkin');
            //$imageName = 'ATTENDANCE_' . time() . '.' . $image->getClientOriginalExtension();

            $now = Carbon::now();
            $today = Carbon::today()->toDateString();
            $yesterday = Carbon::today()->subDays(1)->toDateString();
            $tomorow = Carbon::today()->addDay()->toDateString();

            //$now = Carbon::parse('2025-09-07 03:15:00');
            //$today = Carbon::parse('2025-09-07')->toDateString();
            //$yesterday = Carbon::parse('2025-09-06')->toDateString();

            $employee = Employee::with('shift')->where('user_id', $userId)->first();
            
            $employeeShiftToday = EmployeeShift::with('shift')->where('employee_id', $employee->id)
                ->where('date_shift', $today)
            ->first();

            $employeeShiftYesterday = EmployeeShift::with('shift')->where('employee_id', $employee->id)
                    ->where('date_shift', $yesterday)
            ->first();

            $rangeStart = Carbon::parse($today.' '.$employee->shift->time_start)->subHours(2); 
            $rangeEnd = Carbon::parse($today.' '.$employee->shift->time_end)->addHours(6);

            $timeStart = Carbon::parse($employee->shift->time_start);
            $timeEnd = Carbon::parse($employee->shift->time_end);
            
            if($timeEnd < $timeStart){
                $rangeStart = Carbon::parse($today.' '.$employee->shift->time_start)->subHours(2); 
                $rangeEnd = Carbon::parse($tomorow.' '.$employee->shift->time_end)->addHours(6);
            }


            
            if($employeeShiftToday){

                $rangeStart = Carbon::parse($today.' '.$employeeShiftToday->shift->time_start)->subHours(2); 
                $rangeEnd = Carbon::parse($today.' '.$employeeShiftToday->shift->time_end)->addHours(6);

                $timeStart = Carbon::parse($today.' '.$employeeShiftToday->shift->time_start);
                $timeEnd = Carbon::parse($today.' '.$employeeShiftToday->shift->time_end);
                

                if($timeEnd < $timeStart){
                    $rangeStart = Carbon::parse($today.' '.$employeeShiftToday->shift->time_start)->subHours(2); 
                    $rangeEnd = Carbon::parse($tomorow.' '.$employeeShiftToday->shift->time_end)->addHours(6);
                }
                
            }
            
            $dateAttendance = Carbon::today()->toDateString();
            
            if($employeeShiftYesterday){


                $timeStart = Carbon::parse($yesterday.' '.$employeeShiftYesterday->shift->time_start);
                $timeEnd = Carbon::parse($yesterday.' '.$employeeShiftYesterday->shift->time_end);
                

                if($timeEnd < $timeStart){

                    $checkRangeStart = Carbon::parse($yesterday.' '.$employeeShiftYesterday->shift->time_start)->subHours(2); 
                    $checkRangeEnd = Carbon::parse($today.' '.$employeeShiftYesterday->shift->time_end)->addHours(6);

                    if($now <= $checkRangeEnd && $now >= $checkRangeStart){
                        $rangeStart = Carbon::parse($yesterday.' '.$employeeShiftYesterday->shift->time_start)->subHours(2); 
                        $rangeEnd = Carbon::parse($today.' '.$employeeShiftYesterday->shift->time_end)->addHours(6);
                    }
                }
                
            }
            

            if($now <= $rangeEnd && $now >= $rangeStart){
                $dateAttendance = $rangeStart->addHours(2)->toDateString();
            }else{
                throw new \Exception('Checkout only in you shift time');
            }


            $attendance = Attendance::where('employee_id', $employee->id)
                ->where('date_attendance', $dateAttendance)
            ->first();

            if($attendance){
                
                $attendanceId = $attendance->id;

                $attendanceTrackingCheckIn = AttendanceTracking::where('attendance_id', $attendanceId)
                    ->where('type', 'check_in')
                ->first();

                if(!$attendanceTrackingCheckIn){
                    throw new \Exception('Please Check in first');
                }
                
            }else{
                throw new \Exception('Please Check in first');
            }
            

            $imageArray = [];

            if ($request->hasFile('photo_checkout')) {

                $image = $request->file('photo_checkout');
                $imageName = 'ATTENDANCE_' . time() . '.' . $image->getClientOriginalExtension();

                $destinationPath = public_path('file/attendance');
                $image->move($destinationPath, $imageName);
                $imageArray[] = 'file/attendance/' . $imageName;
            }

            if($workOutside == 1 && count($imageArray) == 0){
                throw new \Exception('Work outside, please add photo');
            }

 

            $attendanceId = 0;
            

            if($attendance){
                
                $attendanceId = $attendance->id;


                $attendanceTrackingCheckIn = AttendanceTracking::where('attendance_id', $attendanceId)
                    ->where('type', 'check_in')
                ->first();

                if(!$attendanceTrackingCheckIn){
                    throw new \Exception('Check in first');
                }
                
                
                $attendance->update([
                    'time_out' => $now->format('H:i'),
                    'updated_by' => $userId
                ]);
                

            }else{
                // Create attendance record
                $attendanceNew = Attendance::create([
                    'employee_id' => $employee->id,
                    'date_attendance' => $dateAttendance,
                    'time_out' => $now->format('H:i'),
                    'type_attendance' => 'check_out',
                    'note' => null,
                    'image' => $imageArray,
                    'created_by' => $userId,
                    'updated_by' => $userId
                ]);

                $attendanceId = $attendanceNew->id;
                
            }
            
            $totalWorkDuration = null;

            $attendanceTrackingCheckIn = AttendanceTracking::where('attendance_id', $attendanceId)
                ->where('type', 'check_in')
            ->first();

            
            if($attendanceTrackingCheckIn){
                
                $checkInTime = Carbon::parse($attendanceTrackingCheckIn->date_time);

                $totalWorkDuration = $checkInTime->diff(Carbon::now())->format('%H:%I');

                Attendance::where('employee_id', $employee->id)->where('date_attendance', $dateAttendance)
                ->update([
                    'total_work_duration' => $totalWorkDuration
                ]);
            }

            
            $attendanceTracking = AttendanceTracking::where('attendance_id', $attendanceId)
                ->where('type', 'check_out')
            ->first();

            if($attendanceTracking){

                $attendanceTracking->update([
                    'date_time' => $now,
                    'device' => DeviceHelper::getDeviceFromRequest($request),
                    'location' => $location,
                    'is_work_outside' => $workOutside,
                    'image' => $imageArray,
                    'updated_by' => $userId
                ]);
 

            }else{
                // Create attendance tracking record
                $attendanceTracking = AttendanceTracking::create([
                    'attendance_id' => $attendanceId,
                    'is_work_outside' => $workOutside,
                    'type' => 'check_out',
                    'location' => $location, // Set null dulu sesuai permintaan
                    'device' => DeviceHelper::getDeviceFromRequest($request), // Simpan device awal
                    'image' => $imageArray, // Simpan juga di attendance_trackings
                    'date_time' => $now,
                    'created_by' => $userId,
                    'updated_by' => $userId
                ]);
            }


            Attendance::where('employee_id', $employee->id)
                ->where('date_attendance', $dateAttendance)
                ->whereNotNull('time_out')
                ->whereNotNull('time_in')
            ->update([
                'status' => 'PRESENT'
            ]);


            DB::commit();

            try {
                ActivityHelper::record([
                    'employee_id' => $employee?->id,
                    'menu' => 'ATTENDANCE',
                    'activity' => 'CHECK_OUT',
                    'description' => ($employee?->name ?? 'Unknown') . ' performed check out',
                    'date_time_activity' => $now,
                ]);
            } catch (\Throwable $_) {}

            return response()->json([
                'code' => 200,
                'status' => 'success',
                'data' => [],
                'message' => 'Check Out successfully'
            ]);

        } catch (\Exception $e) {

            DB::rollBack();
            
            return response()->json([
                'code' => 500,
                'status' => 'error',
                'data' => [],
                'message' => $e->getMessage()
            ], 500);
        }

    }

    /**
     * Get attendance records for an employee for a specific month
     */
    public function getMonthlyAttendance($employeeId, $year, $month)
    {
        try {
            $startDate = Carbon::createFromDate($year, $month, 1)->startOfMonth()->toDateString();
            $endDate = Carbon::createFromDate($year, $month, 1)->endOfMonth()->toDateString();

            // Return all attendance records for the month (multiple per day)
            $attendances = Attendance::where('employee_id', $employeeId)
                ->whereBetween('date_attendance', [$startDate, $endDate])
                ->orderBy('date_attendance', 'asc')
                ->orderBy('time_in', 'asc')
                ->get(['date_attendance', 'type_attendance', 'time_in', 'time_out']);

            return response()->json([
                'code' => 200,
                'status' => 'success',
                'data' => $attendances,
                'message' => 'Monthly attendance retrieved successfully'
            ]);
        } catch (\Exception $e) {
            \Log::error('Error fetching monthly attendance:', [
                'employee_id' => $employeeId,
                'year' => $year,
                'month' => $month,
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'code' => 500,
                'status' => 'error',
                'data' => null,
                'message' => 'Server error: ' . $e->getMessage()
            ], 500);
        }
    }

}
