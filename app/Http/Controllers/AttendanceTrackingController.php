<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;

use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Color;
use PhpOffice\PhpSpreadsheet\Style\Fill;

use PhpOffice\PhpSpreadsheet\Cell\Coordinate;

use App\Helpers\ActivityHelper;
use App\Models\User;
use App\Models\Attendance;
use App\Models\AttendanceTracking;
use App\Models\Employee;
use App\Models\EmployeeShift;
use App\Models\EmployeeLeaveRequest;
use App\Models\EmployeeOvertimeRequest;


class AttendanceTrackingController extends Controller
{
    public function showAttendanceTrackingPage()
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


        if ($userType !== 'SUPERADMIN') {
            $employee->where('employees.department_id', $currentEmployee?->department_id ?? 0);
        }

        $employee = $employee
            ->whereNotIn('users.user_role', ["GENERAL_MANAGER", "CEO"])
            ->where(function ($query) {
                $query->whereNull('users.user_type')
                    ->orWhereNotIn(DB::raw('UPPER(TRIM(users.user_type))'), ["ADMIN", "ADMINISTRATOR", "SUPERADMIN"]);
            })
            ->get();

        return view('attendance_tracking.attendance_tracking',[
            'employee' => $employee
        ]);
    }

    public function getAttendanceTrackingData(Request $request){
        $user = auth()->user();
        $currentEmployee = $user?->employee;
        $userType = strtoupper((string) ($user?->user_type ?? ''));

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
            ->whereNotIn('users.user_role', ["GENERAL_MANAGER", "CEO"])
            ->where(function ($query) {
                $query->whereNull('users.user_type')
                    ->orWhereNotIn(DB::raw('UPPER(TRIM(users.user_type))'), ["ADMIN", "ADMINISTRATOR", "SUPERADMIN"]);
            })
            ->when(
                $userType !== 'SUPERADMIN',
                fn ($query) => $query->where('employees.department_id', $currentEmployee?->department_id ?? 0)
            )
            ->get();

        $employeeIds = $employee->pluck('id');

        $attendance = Attendance::where('date_attendance','>=',$firstDayOfMonth)
            ->whereIn('employee_id',$employeeIds)
            ->where('date_attendance','<=',$lastDayOfMonth)
            ->get();
        
        $employeeLeave = EmployeeLeaveRequest::whereIn('employee_id',$employeeIds)
            ->where('status','APPROVED')
            ->where('start_date','>=',$firstDayOfMonth)
            ->where('start_date','<=',$lastDayOfMonth)
            ->where('end_date','>=',$firstDayOfMonth)
            ->where('end_date','<=',$lastDayOfMonth)
        ->get();

            //dd($month,$year, $firstDayOfMonth,$lastDayOfMonth,$attendance);
        return response()->json([
                'code' => 200,
                'status' => 'success',
                'data' => [
                    'attendance' => $attendance,
                    'employeeLeave' => $employeeLeave,
                ],
                'message' => __('attendance_tracking.messages.data_loaded')
        ]);

    }
    
    public function getAttendanceDetail(Request $request){

        try{
            $user = auth()->user();
            $currentEmployee = $user?->employee;
            $userType = strtoupper((string) ($user?->user_type ?? ''));
            
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

            $leave = EmployeeLeaveRequest::with('employee')
                ->where('employee_id', $employeeId)
                ->where('status', 'APPROVED')
                ->where('start_date','<=', $dateAttendance)
                ->where('end_date','>=', $dateAttendance)
            ->first();
 

            $employee = Employee::with('department', 'division', 'job', 'grade', 'shift')
                ->select('employees.*')
                ->join('users', 'employees.user_id', '=', 'users.id')
                ->where('employees.id', $employeeId)
                ->when(
                    $userType !== 'SUPERADMIN',
                    fn ($query) => $query->where('employees.department_id', $currentEmployee?->department_id ?? 0)
                )
                ->where(function ($query) {
                    $query->whereNull('users.user_type')
                        ->orWhereNotIn(DB::raw('UPPER(TRIM(users.user_type))'), ['ADMIN', 'ADMINISTRATOR', 'SUPERADMIN']);
                })
                ->first();

            if(!$employee){
                throw new \Exception(__('attendance_tracking.messages.employee_not_found'));
            }

            $attendanceTracking = [];

            if($attendance){
                $attendanceTracking = AttendanceTracking::where('attendance_id', $attendance->id)
                ->get();
            }
            

            return response()->json([
                    'code' => 200,
                    'status' => 'success',
                    'data' => [
                        'employee'  => $employee,
                        'leave'  => $leave,
                        'attendance' => $attendance,
                        'attendance_tracking' => $attendanceTracking
                    ],
                    'message' => __('attendance_tracking.messages.detail_loaded')
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

    public function exportAttendanceMonthly($year,$month){

        $user = auth()->user();
        $userId = auth()->user()->id;
        
        $currentEmployee = Employee::where('user_id', $userId)->first();
        
        $userType = strtoupper((string) ($user->user_type ?? ''));
        $userRole = strtoupper((string) ($user->user_role ?? ''));

        $monthFull = $month;
        $month = Carbon::parse($month)->format('n');
        $year = Carbon::parse($year)->format('Y');


        $firstDayOfMonth = Carbon::create($year, $month, 1)->startOfMonth()->toDateString();
        $lastDayOfMonth = Carbon::create($year, $month, 1)->endOfMonth()->toDateString();

        $daysInMonth = Carbon::parse($firstDayOfMonth)->daysInMonth;

        $employee = Employee::select('employees.id')
            ->join('users','employees.user_id','=','users.id')
            ->where('employees.status',"ACTIVE");
            
        if ($userType !== 'SUPERADMIN') {
            $employee->where('employees.department_id', $currentEmployee?->department_id ?? 0);
        }

        $employee = $employee
            ->whereNotIn('users.user_role', ["GENERAL_MANAGER", "CEO"])
            ->where(function ($query) {
                $query->whereNull('users.user_type')
                    ->orWhereNotIn(DB::raw('UPPER(TRIM(users.user_type))'), ["ADMIN", "ADMINISTRATOR", "SUPERADMIN"]);
            })
            ->get();

        $employeeIds = $employee->pluck('id');

        $allEmployeeActive = Employee::with('department','division','job','grade')
            ->whereIn('employees.id',$employeeIds)
            ->orderBy('employees.division_id','asc')
        ->get();

        $spreadsheet = new Spreadsheet();
        $activeWorksheet = $spreadsheet->getActiveSheet();
    
        $activeWorksheet->mergeCells('A1:J1');
        
        $activeWorksheet->mergeCells('K1:R1');
        $activeWorksheet->setCellValue('K1', __('attendance_tracking.export.off_and_lateness'));
        $activeWorksheet->getStyle('K1')->getFont()->setBold(true)->setSize(44);
        $activeWorksheet->getStyle('K1')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
        
        $activeWorksheet->mergeCells('S1:BB1');
        $activeWorksheet->setCellValue('S1', __('attendance_tracking.export.present_list'));

        $activeWorksheet->getStyle('S1')->getFont()->setBold(true)->setSize(44);
        $activeWorksheet->getStyle('S1')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);

        //No	NAMA KARYAWAN	NSAID	Department	Division	Job Position	Grade/Rank	Join Date	Periode Kerja	Penempatan	Time Lateness 1 Hour	Time Lateness 1 > Hour	Overtime off work day	Overtime on Work day	Sick	Permit	Absen	Leave	Shift 2	Total Work half Day This Month	Amount Work half Day This Month	Total Work Day This Month (23 Days)	Total Day Off This Month
        
        $activeWorksheet->setCellValue('A2', __('attendance_tracking.export.number'));
        $activeWorksheet->setCellValue('B2', __('attendance_tracking.export.employee_name'));
        $activeWorksheet->setCellValue('C2', 'NSAID');
        $activeWorksheet->setCellValue('D2', __('attendance_tracking.export.department'));
        $activeWorksheet->setCellValue('E2', __('attendance_tracking.export.division'));
        $activeWorksheet->setCellValue('F2', __('attendance_tracking.export.job_position'));
        $activeWorksheet->setCellValue('G2', __('attendance_tracking.export.grade_rank'));
        $activeWorksheet->setCellValue('H2', __('attendance_tracking.export.join_date'));
        $activeWorksheet->setCellValue('I2', __('attendance_tracking.export.work_period'));
        $activeWorksheet->setCellValue('J2', __('attendance_tracking.export.placement'));
        $activeWorksheet->setCellValue('K2', __('attendance_tracking.export.late_under_one_hour'));
        $activeWorksheet->setCellValue('L2', __('attendance_tracking.export.late_over_one_hour'));
        $activeWorksheet->setCellValue('M2', __('attendance_tracking.export.overtime_off_day'));
        $activeWorksheet->setCellValue('N2', __('attendance_tracking.export.overtime_work_day'));
        $activeWorksheet->setCellValue('O2', __('attendance_tracking.sick'));
        $activeWorksheet->setCellValue('P2', __('attendance_tracking.export.permit'));
        $activeWorksheet->setCellValue('Q2', __('attendance_tracking.absent'));
        $activeWorksheet->setCellValue('R2', __('attendance_tracking.leave'));
        $activeWorksheet->setCellValue('S2', __('attendance_tracking.export.shift_two'));
        $activeWorksheet->setCellValue('T2', __('attendance_tracking.export.total_half_days'));
        $activeWorksheet->setCellValue('U2', __('attendance_tracking.export.half_day_amount'));
        $activeWorksheet->setCellValue('V2', __('attendance_tracking.export.total_work_days'));
        $activeWorksheet->setCellValue('W2', __('attendance_tracking.export.total_days_off'));

        // add border 
        $headerStyle = [
            'borders' => [
                'allBorders' => [
                    'borderStyle' => Border::BORDER_THIN,
                ],
            ],
        ];
        

        $activeWorksheet->getStyle('A2:W2')->applyFromArray($headerStyle)->getFont()->setBold(true)->setSize(10);

        $activeWorksheet->getStyle('A2:W2')
            ->getAlignment()
            ->setWrapText(true)
            ->setHorizontal(Alignment::HORIZONTAL_CENTER)
        ->setVertical(Alignment::VERTICAL_CENTER);
        
        $localizedWeekdays = __('attendance_tracking.export.weekdays');

        

        for ($i = 0; $i < $daysInMonth; $i++) {
            $newAddDate = Carbon::parse($firstDayOfMonth)->copy()->addDays($i);
            $column = Coordinate::stringFromColumnIndex($i + 24); // Mengubah indeks menjadi huruf kolom (1=A, 2=B, ...)
            
            $activeWorksheet->setCellValue(
                $column.'2',
                $newAddDate->copy()->locale(app()->getLocale())->translatedFormat('d-M')
            );
            $activeWorksheet->setCellValue($column.'3', $localizedWeekdays[$newAddDate->format('w')]);

            if($newAddDate->isSunday()) {
                $activeWorksheet->getStyle($column.'3')
                    ->getFont()
                    ->getColor()
                ->setARGB('ffffffff');

                $activeWorksheet->getStyle($column.'3')
                    ->getFill()
                    ->setFillType(Fill::FILL_SOLID)
                    ->getStartColor()
                ->setARGB('ffd74e51');
            }

        }

        $activeWorksheet->getStyle('X2:BC3')
            ->getAlignment()
            ->setHorizontal(Alignment::HORIZONTAL_CENTER)
        ->setVertical(Alignment::VERTICAL_CENTER);

        

        // Menulis data dari database ke sheet
        $row = 4; // Mulai dari baris kedua
        $no = 1;

        foreach ($allEmployeeActive as $employeeItem) {

            $attendanceTotalDays = Attendance::where('employee_id', $employeeItem->id)
                    ->where('date_attendance', '<=', $lastDayOfMonth)
                    ->where('date_attendance', '>=', $firstDayOfMonth)
                    ->count();

            $employeeLeaveAmount = EmployeeLeaveRequest::where('employee_id',$employeeItem->id)
                    ->where('status','APPROVED')
                    ->where('leave_type','ANNUAL_LEAVE')
                    ->where('start_date','>=',$firstDayOfMonth)
                    ->where('start_date','<=',$lastDayOfMonth)
                    ->where('end_date','>=',$firstDayOfMonth)
                    ->where('end_date','<=',$lastDayOfMonth)
                ->sum('day_amount');

            $employeeSickAmount = EmployeeLeaveRequest::where('employee_id',$employeeItem->id)
                    ->where('status','APPROVED')
                    ->where('leave_type','SICK')
                    ->where('start_date','>=',$firstDayOfMonth)
                    ->where('start_date','<=',$lastDayOfMonth)
                    ->where('end_date','>=',$firstDayOfMonth)
                    ->where('end_date','<=',$lastDayOfMonth)
                ->sum('day_amount');

            $activeWorksheet->setCellValue('A'.$row, $no);
            $activeWorksheet->setCellValue('B'.$row, $employeeItem->name);
            $activeWorksheet->setCellValue('C'.$row, $employeeItem->employee_niks);
            $activeWorksheet->setCellValue('D'.$row, $employeeItem->department->name_department);//'Department'
            $activeWorksheet->setCellValue('E'.$row, $employeeItem->division->name_division);//'Division'
            $activeWorksheet->setCellValue('F'.$row, $employeeItem->job->job_name);//'Job Position'
            $activeWorksheet->setCellValue('G'.$row, $employeeItem->grade->title);//'Grade/Rank'
            $activeWorksheet->setCellValue('H'.$row, $employeeItem->hire_date);//'Join Date'
            $activeWorksheet->setCellValue('I'.$row, '');//'Periode Kerja'
            $activeWorksheet->setCellValue('J'.$row, '');//'Penempatan' $employeeItem->office
            $activeWorksheet->setCellValue('K'.$row, '');//'Time Lateness 1 Hour'
            $activeWorksheet->setCellValue('L'.$row, '');//'Time Lateness 1 > Hour'
            $activeWorksheet->setCellValue('M'.$row, '');//'Overtime off work day'
            $activeWorksheet->setCellValue('N'.$row, '');//'Overtime on Work day'
            $activeWorksheet->setCellValue('O'.$row, $employeeSickAmount);//'Sick'
            $activeWorksheet->setCellValue('P'.$row, '');//'Permit'
            $activeWorksheet->setCellValue('Q'.$row, '');//'Absen'
            $activeWorksheet->setCellValue('R'.$row, $employeeLeaveAmount);//'Leave'
            $activeWorksheet->setCellValue('S'.$row, '');//'Shift'
            $activeWorksheet->setCellValue('T'.$row, '');//'Total Work half Day This Month'
            $activeWorksheet->setCellValue('U'.$row, '');//'Amount Work half Day This Month'
            $activeWorksheet->setCellValue('V'.$row, $attendanceTotalDays);//Total Work Day This Month (23 Days)
            $activeWorksheet->setCellValue('W'.$row, '');//'Total Day Off This Month'
            
            for ($i = 0; $i < $daysInMonth; $i++) {

                $column = Coordinate::stringFromColumnIndex($i + 24); // Mengubah indeks menjadi huruf kolom (1=A, 2=B, ...)

                $newAddDate = Carbon::parse($firstDayOfMonth)->copy()->addDays($i);
                $weekdayIndex = $newAddDate->format('N');

                if($employeeItem->weekday_off){
                    if(str_contains($employeeItem->weekday_off,$weekdayIndex)){

                        $activeWorksheet->setCellValue($column.$row, '#');

                        $activeWorksheet->getStyle($column.$row)
                            ->getFill()
                            ->setFillType(Fill::FILL_SOLID)
                            ->getStartColor()
                        ->setARGB('ffd74e51');
                    }
                }
                
                $attendance = Attendance::where('employee_id', $employeeItem->id)
                    ->where('date_attendance', $newAddDate->toDateString())
                ->first();
                
                if($attendance){

                    
                    $timeIn = Carbon::parse($attendance->time_in)->format('H:i');
                    $timeOut = Carbon::parse($attendance->time_out)->format('H:i');
                    
                    // if($timeIn){
                    //     $activeWorksheet->setCellValue($column.$row, 1);// $timeIn." \n ".$timeOut
                    // }

                    $presentValue = '1';

                    $activeWorksheet->setCellValue($column.$row, 1);

                    if($attendance->status == 'ABSENT'){
                        $activeWorksheet->setCellValue($column.$row, 'A');

                        $activeWorksheet->getStyle($column.$row)
                            ->getFont()
                            ->getColor()
                        ->setARGB('ffff0000');

                        $activeWorksheet->getStyle($column.$row)
                        ->getFill()->setFillType(Fill::FILL_NONE);
                    }  
                    else{

                        
                        if($attendance->time_out == null || $attendance->time_out == '00:00:00' ){
                            $presentValue = '0,5';
                        }
                        

                        $activeWorksheet->setCellValue($column.$row, $presentValue);
                    }
                    //$activeWorksheet->setCellValue($column.$row, $timeIn.chr(10).$timeOut);// $timeIn." \n ".$timeOut
                    
                    
                    // if($attendance->time_late){
                    //     $activeWorksheet->getStyle($column.$row)
                    //         ->getFont()
                    //         ->getColor()
                    //     ->setARGB('ffd74e51');
                    // }
                    
                }else{

                    $activeWorksheet->setCellValue($column.$row, '');

                    // if($employeeItem->weekday_off){
                    //     if(str_contains($employeeItem->weekday_off,$weekdayIndex)){
                            
                    //     }else{
                    //         $activeWorksheet->setCellValue($column.$row, '!');
                            
                    //         $activeWorksheet->getStyle($column.$row)
                    //             ->getFill()
                    //             ->setFillType(Fill::FILL_SOLID)
                    //             ->getStartColor()
                    //         ->setARGB('ffffcb35');
                    //     }
                    // }
                    //$activeWorksheet->setCellValue($column.$row, $employeeItem->id.' '.$newAddDate->toDateString());
                    

                }
                
                $employeeLeave = EmployeeLeaveRequest::where('employee_id',$employeeItem->id)
                    ->where('status','APPROVED')
                    ->where('start_date','<=',$newAddDate->toDateString())
                    ->where('end_date','>=',$newAddDate->toDateString())
                ->first();

                if($employeeLeave){
                    $leaveType = '';

                    if($employeeLeave->leave_type == 'SICK'){
                        $leaveType = 'S';
                        
                        $activeWorksheet->getStyle($column.$row)
                            ->getFill()
                            ->setFillType(Fill::FILL_SOLID)
                            ->getStartColor()
                        ->setARGB('ffffcb35');
                    }

                    if($employeeLeave->leave_type == 'ANNUAL_LEAVE'){
                        $leaveType = 'C';

                        
                    }
                    
                    $activeWorksheet->setCellValue($column.$row, $leaveType);
                }


                $hireDate = Carbon::parse($employeeItem->hire_date);
                $yearHireDate = Carbon::parse($employeeItem->hire_date)->format('Y');
                $monthHireDate = Carbon::parse($employeeItem->hire_date)->format('n');
                $dayHireDate = $hireDate->day;
                
                if($i+1 == ($dayHireDate-1) && $month == $monthHireDate && $yearHireDate == date('Y') ){
                    $activeWorksheet->getStyle('X'.$row)
                        ->getFill()
                        ->setFillType(Fill::FILL_SOLID)
                        ->getStartColor()
                    ->setARGB('ff00ff00');

                    $activeWorksheet->setCellValue('X'.$row, __('attendance_tracking.export.new_employee'));

                    $activeWorksheet->mergeCells('X'.$row.':'.$column.$row);
                }


                
            }
            
            
            
            $row++;
            $no++;
        }

        $dataStyle = [
            'borders' => [
                'allBorders' => [
                    'borderStyle' => Border::BORDER_THIN,
                ],
            ],
        ];

        $lastColumn = Coordinate::stringFromColumnIndex(23 + $daysInMonth);
        $activeWorksheet->getStyle('A2:'.$lastColumn.($row-1))->applyFromArray($dataStyle);

        $activeWorksheet->getStyle('A2:'.$lastColumn.($row-1))
            ->getAlignment()
            ->setHorizontal(Alignment::HORIZONTAL_CENTER)
        ->setVertical(Alignment::VERTICAL_CENTER);
        
        $activeWorksheet->getStyle('W4:'.$lastColumn.($row-1))
            ->getAlignment()
            ->setWrapText(true)
            ->setHorizontal(Alignment::HORIZONTAL_CENTER)
        ->setVertical(Alignment::VERTICAL_CENTER);

        // Mengatur lebar kolom agar otomatis
        foreach (range('A', 'J') as $column) {
            $activeWorksheet->getColumnDimension($column)->setAutoSize(true);
        }
 
        $fileName = __('attendance_tracking.export.filename').' '.$monthFull.' '.$year.'.xlsx';
        $tempFileName = tempnam(sys_get_temp_dir(), $fileName);

        $writer = new Xlsx($spreadsheet);
        $writer->save($tempFileName);

        return response()->download($tempFileName,$fileName)->deleteFileAfterSend(true);

    }

    public function editEmployeeAttendance(Request $request){

        try{

            DB::beginTransaction();
            
            $request->validate([
                'employee_id' => 'required|integer',
                'attendance_date' => 'required',
                'attendance_date' => 'required|date'
            ]);

            $userRole = auth()->user()->user_role;

            if(!in_array($userRole,['ADMINISTRATOR','HR_MANAGER'])){
                throw new \Exception(__('attendance_tracking.messages.only_hr_manager'));
            }

            $userId = auth()->user()->id;
            $employeeId = $request->employee_id;
            $employee = Employee::with('shift')->where('id', $employeeId)->first();

            $statusAttendance = $request->attendance_status;
            $timeIn = '00:00:00';
            $timeOut = null;
            $timeLate = '00:00:00';

            if($employee){
                $shift = $employee->shift;

                if($shift){
                                      

                    if($request->attendance_time_in){
                        $shiftStartTime = Carbon::parse($shift->time_start);
                        $timeStart = Carbon::parse($request->attendance_time_in);

                        if($timeStart > $shiftStartTime){
                            $timeLate = $timeStart->diff($shiftStartTime)->format('%H:%I:%S');
                        }
                        
                    }
                    
                    

                }
            }

            if($request->attendance_time_in){
                $timeIn =Carbon::parse($request->attendance_time_in)->format('H:i');
            }
            
            if($request->attendance_time_out){
                $timeOut = Carbon::parse($request->attendance_time_out)->format('H:i');
            }
            

            if($statusAttendance =='ABSENT'){
                $timeIn = '00:00:00';
                $timeOut = '';
            }

            $note = $request->attendance_note;

            $dateAttendance = $request->attendance_date;
            

            $attendance = Attendance::where('employee_id', $employeeId)
                ->where('date_attendance', $dateAttendance)
            ->first();

            

            

            if($attendance){

                Attendance::where('employee_id', $employeeId)
                    ->where('date_attendance', $dateAttendance)
                    ->update([
                        'time_in' => $timeIn,
                        'time_out' => $timeOut,
                        'time_late' => $timeLate,
                        'note' => $note,
                        'status' => $statusAttendance,
                        'updated_by' => $userId
                ]);


            }else{
                

                $attendanceNew = Attendance::create([
                    'employee_id' => $employeeId,
                    'date_attendance' => $dateAttendance,
                    'time_in' => $timeIn,
                    'time_out' => $timeOut,
                    'type_attendance' => 'CHECK_IN',
                    'shift_time_start' => $employee->shift->time_start,
                    'shift_time_end' => $employee->shift->time_end,
                    'note' => $note,
                    'status' => $statusAttendance,
                    'image' => '',
                    'time_late' => $timeLate,
                    'created_by' => $userId,
                    'updated_by' => $userId
                ]);

            }
            

            $attendanceData = Attendance::where('employee_id', $employeeId)
                ->where('date_attendance', $dateAttendance)
            ->first();
            

            DB::commit();

            return response()->json([
                'code' => 200,
                'status' => 'success',
                'data' => [
                    'attendance' => $attendanceData
                ],
                'message' => __('attendance_tracking.messages.attendance_updated')
            ]);

        }catch (\Exception $e) {

            DB::rollBack();
            
            return response()->json([
                'code' => 500,
                'status' => 'error',
                'data' => [],
                'message' => $e->getMessage()
            ], 500);
        }
    }

}
