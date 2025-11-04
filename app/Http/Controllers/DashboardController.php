<?php

namespace App\Http\Controllers;

use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

use App\Models\Division;
use App\Models\Office;
use App\Models\Employee;
use App\Models\Attendance;
use App\Models\AttendanceTracking;
use App\Models\EmployeeShift;
use App\Models\Project;
use App\Models\ProjectAssignment;
use App\Helpers\ActivityHelper;

class DashboardController extends Controller
{
    public function biDashboardMtd(){

        $userId = auth()->user()->id;

        $employee = Employee::where('user_id',$userId)->first();
        
        if($employee->department_id != 3){
            return redirect('dashboard');
        }

        if($employee->division_id != 26){
            return redirect('dashboard');
        }

        return view('bi_dashboard_mtd');
    }
    
    public function biDashboard(){
        return view('bi_dashboard');
    }
    
    public function dashboard()
    {
        $user = auth()->user();

        // 'user_type' => 'required|string|in:ADMINISTRATOR,REGULAR,MANAGEMENT',
        // 'user_role' => 'required|string|in:CEO,GENERAL_MANAGER,MANAGER,LEADER,HR_MANAGER,FINANCE_MANAGER,EMPLOYEE',

        if(in_array($user->user_type,['REGULAR']) && in_array($user->user_role,['EMPLOYEE'])){
            return $this->dashboard_employee();
        }else{
            return $this->dashboard_management();
        }
    }

    public function dashboard_management(){
        $userId = auth()->user()->id;

        $currentEmployee = Employee::where('user_id', $userId)->first();

        $employeeId = Employee::select(
            'employees.id',
        )
        ->join('users','employees.user_id','=','users.id')
        ->where('employees.status',"ACTIVE")
        ->where('users.user_type','<>',"ADMINISTRATOR")
        ->where('employees.department_id',$currentEmployee->department_id)
        ->pluck('id');
        

        $employee = Employee::select(
            'employees.id',
            'employees.department_id',
            'employees.division_id',
            'employees.name',
            'employees.status',
            'employees.user_id',
            'employees.photo',
            'employees.profile_picture', // new unified avatar field
            'users.photo as user_photo', // fallback legacy user photo
            'job_list.job_name',
            'divisions.name_division'
        )
        ->join('job_list','employees.job_id','=','job_list.id')
        ->join('users','employees.user_id','=','users.id')
        ->join('divisions','employees.division_id','=','divisions.id')
        ->where('employees.status',"ACTIVE")
        ->where('users.user_type','<>',"ADMINISTRATOR")
        ->where('employees.department_id',$currentEmployee->department_id)
        ->get();
        
        
        $arrOtheDivision = ["Management","Personal Assistant","Cleaning Service","Security"];

        $totalEmployee = Employee::select('employees.id')
        ->join('users','employees.user_id','=','users.id')
        ->join('divisions','employees.division_id','=','divisions.id')
        ->where('employees.status',"ACTIVE")
        ->where('users.user_type','<>',"ADMINISTRATOR")
        ->whereNotIn('divisions.name_division',$arrOtheDivision)
        ->where('employees.department_id',$currentEmployee->department_id)
        ->count();


        $divisionTotal = Division::select('id','name_division',
            DB::raw('(SELECT COUNT(employees.id) FROM employees 
                    WHERE employees.id IN ('.$employeeId->implode(',').') AND employees.department_id = divisions.department_id AND employees.division_id = divisions.id) as total_employee')
        )
        ->where('department_id',$currentEmployee->department_id)
        ->where('status',"ACTIVE")
        ->whereNotIn('name_division',$arrOtheDivision)
        ->get();

        $projectAssignEmployeeIds = ProjectAssignment::whereIn('employee_id',$employeeId)->pluck('project_id');

        $project = Project::select('projects.*',
            DB::raw('(SELECT COUNT(tasks.id) FROM tasks WHERE tasks.project_id = projects.id AND tasks.status NOT IN ("CANCELED","DELETED")) as total_task')
            // ,
            // DB::raw('
            //         (SELECT JSON_PRETTY( JSON_OBJECT(
            //             "employee_id",project_assignments.employee_id,
            //             "role",project_assignments.role
            //             )
            //         ) as project_assignt_employee
            //     FROM project_assignments WHERE project_assignments.project_id = projects.id) as project_assignment'),
            
            )
            ->whereIn('id',$projectAssignEmployeeIds)
            ->where('status',"ACTIVE")
            ->orderBy('id','desc')
        ->get();

        // record activity
        try {
            ActivityHelper::record([
                'employee_id' => $currentEmployee?->id,
                'menu' => 'DASHBOARD',
                'activity' => 'VIEW_PAGE',
                'description' => ($currentEmployee?->name ?? 'Unknown') . ' View page dashboard (management)',
            ]);
        } catch (\Throwable $_) {}

        return view('dashboard_management',
            [
                'employee' => $employee,
                'current_employee' => $currentEmployee,
                'total_employee' => $totalEmployee,
                'division_total' => $divisionTotal,
                'project' => $project
            ]
        );

    }

    public function dashboard_employee(){
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
        


        try {
            ActivityHelper::record([
                'employee_id' => $employee?->id,
                'menu' => 'DASHBOARD',
                'activity' => 'VIEW_PAGE',
                'description' => ($employee?->name ?? 'Unknown') . ' View page dashboard',
            ]);
        } catch (\Throwable $_) {}

        return view('dashboard', compact('employee','office', 'attendance','employeeShift','todayDate','isLate','timeIn','timeOut','atendanceTrackingCheckin','atendanceTrackingCheckout'));
    
    }

    // Add activity logging for dashboard_employee views is done above where view is returned


    // 'Present'

    // 'Absent'

    // 'Leave'

    // 'Holiday'

    // 'Half-Day'

    // 'Remote Work'
}
