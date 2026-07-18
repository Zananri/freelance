<?php

namespace App\Http\Controllers;

use Carbon\Carbon;
use Illuminate\Http\Request;

use App\Models\Division;
use App\Models\Department;
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

    public function dashboard()
    {
        $user = auth()->user();

        // 'user_type' => 'required|string|in:ADMINISTRATOR,REGULAR,MANAGEMENT',
        // 'user_role' => 'required|string|in:CEO,GENERAL_MANAGER,MANAGER,LEADER,HR_MANAGER,FINANCE_MANAGER,EMPLOYEE',

        if (in_array($user->user_type, ['REGULAR']) && in_array($user->user_role, ['EMPLOYEE'])) {
            return $this->dashboard_employee();
        } else {
            return $this->dashboard_management();
        }
    }

    public function dashboard_management()
    {
        $userId = auth()->user()->id;
        $userType = strtoupper((string) (auth()->user()->user_type ?? ''));

        $currentEmployee = Employee::where('user_id', $userId)->first();

        // Department & division options for the monitoring widget filter.
        // SUPERADMIN can monitor every department/division company-wide.
        // Everyone else (e.g. ADMINISTRATOR) is scoped to their own department only.
        if ($userType === 'SUPERADMIN') {
            $widgetDepartments = Department::orderBy('name_department')
                ->get(['id', 'name_department']);

            $widgetDivisions = Division::orderBy('name_division')
                ->get(['id', 'name_division', 'department_id']);
        } else {
            $widgetDepartments = Department::where('id', $currentEmployee->department_id)
                ->orderBy('name_department')
                ->get(['id', 'name_department']);

            $widgetDivisions = Division::where('department_id', $currentEmployee->department_id)
                ->orderBy('name_division')
                ->get(['id', 'name_division', 'department_id']);
        }

        // record activity
        try {
            ActivityHelper::record([
                'employee_id' => $currentEmployee?->id,
                'menu' => 'DASHBOARD',
                'activity' => 'VIEW_PAGE',
                'description' => ($currentEmployee?->name ?? 'Unknown') . ' View page dashboard (management)',
            ]);
        } catch (\Throwable $_) {
        }

        return view('dashboard_management', [
            'current_employee' => $currentEmployee,
            'widget_departments' => $widgetDepartments,
            'widget_divisions' => $widgetDivisions,
        ]);
    }

    public function dashboardMonitoringWidget(Request $request)
    {
        $user = auth()->user();
        $userId = $user->id;
        $userType = strtoupper((string) ($user->user_type ?? ''));
        $currentEmployee = Employee::where('user_id', $userId)->first();

        if (!$currentEmployee) {
            return response()->json([
                'code' => 200,
                'status' => 'success',
                'data' => ['employees' => [], 'checkins' => []],
            ]);
        }

        $query = Employee::with(['division', 'department', 'job'])
            ->where('status', 'ACTIVE')
            ->where('id', '!=', $currentEmployee->id)
            ->whereHas('user', function ($q) {
                $q->whereNotIn('user_role', ['GENERAL_MANAGER', 'CEO'])
                    ->whereNotIn('user_type', ['ADMINISTRATOR', 'SUPERADMIN']);
            });

        if ($userType !== 'SUPERADMIN') {
            $query->where('department_id', $currentEmployee->department_id);
        }

        if ($request->department_id && $request->department_id !== 'all') {
            $query->where('department_id', $request->department_id);
        }

        if ($request->division_id && $request->division_id !== 'all') {
            $query->where('division_id', $request->division_id);
        }

        if ($request->job_id && $request->job_id !== 'all') {
            $query->where('job_id', $request->job_id);
        }

        $employees = $query->orderBy('name')->limit(20)->get();

        $employeeIds = $employees->pluck('id')->toArray();
        $today = Carbon::today();

        $checkins = collect();

        if (!empty($employeeIds)) {
            $checkins = AttendanceTracking::select(
                'attendance_trackings.location',
                'attendance_trackings.date_time',
                'attendance_trackings.type',
                'attendances.employee_id'
            )
                ->join('attendances', 'attendance_trackings.attendance_id', '=', 'attendances.id')
                ->whereIn('attendance_trackings.type', ['check_in', 'check_out'])
                ->whereDate('attendance_trackings.date_time', $today)
                ->whereIn('attendances.employee_id', $employeeIds)
                ->orderBy('attendance_trackings.date_time', 'desc')
                ->get()
                ->map(function ($record) {
                    // Guard against empty/malformed location values (e.g. missing GPS data)
                    if (empty($record->location) || strpos($record->location, ',') === false) {
                        return null;
                    }

                    [$lat, $lng] = array_map('trim', explode(',', $record->location, 2));

                    if (!is_numeric($lat) || !is_numeric($lng)) {
                        return null;
                    }

                    return [
                        'employee_id' => (int) $record->employee_id,
                        'lat' => (float) $lat,
                        'lng' => (float) $lng,
                        'type' => $record->type,
                        'time' => optional($record->date_time)->format('H:i'),
                        'date_time' => optional($record->date_time)->toDateTimeString(),
                    ];
                })
                ->filter()
                ->values();
        }

        $checkedInEmployeeIds = $checkins
            ->where('type_attendance', 'check_in')
            ->pluck('employee_id')
            ->toArray();

        $employees = $employees->map(function ($employee) use ($checkins, $checkedInEmployeeIds) {
            $lastCheckin = $checkins
                ->where('employee_id', $employee->id)
                ->where('type_attendance', 'check_in')
                ->first();

            $lastCheckout = $checkins
                ->where('employee_id', $employee->id)
                ->where('type_attendance', 'check_out')
                ->first();

            return [
                'id' => $employee->id,
                'name' => $employee->name,
                'department_id' => $employee->department_id,
                'department_name' => optional($employee->department)->name_department,
                'division_id' => $employee->division_id,
                'division_name' => optional($employee->division)->name_division,
                'job_id' => $employee->job_id,
                'job_name' => optional($employee->job)->job_name,
                'checked_in' => in_array($employee->id, $checkedInEmployeeIds),
                'checkin_time' => $lastCheckin['time'] ?? null,
                'checkout_time' => $lastCheckout['time'] ?? null,
            ];
        })->values();

        return response()->json([
            'code' => 200,
            'status' => 'success',
            'data' => [
                'employees' => $employees,
                'checkins' => $checkins,
            ],
        ]);
    }

    public function dashboard_employee()
    {
        $user = auth()->user();

        $now = Carbon::now();
        $today = Carbon::today()->toDateString();
        $yesterday = Carbon::today()->subDays(1)->toDateString();
        $tomorow = Carbon::today()->addDay()->toDateString();

        // $now = Carbon::parse('2025-09-07 01:15:00');
        // $today = Carbon::parse('2025-09-07')->toDateString();
        // $yesterday = Carbon::parse('2025-09-06')->toDateString();

        $employee = Employee::with('division', 'department', 'job', 'grade', 'shift')->where('user_id', $user->id)->first();

        $office = Office::where('id', $employee->office)->first();

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

        $rangeStart = Carbon::parse($today . ' ' . $employee->shift->time_start)->subHours(2);
        $rangeEnd = Carbon::parse($today . ' ' . $employee->shift->time_end)->addHours(3);

        $timeStart = Carbon::parse($employee->shift->time_start);
        $timeEnd = Carbon::parse($employee->shift->time_end);

        if ($timeEnd < $timeStart) {
            $rangeStart = Carbon::parse($today . ' ' . $employee->shift->time_start)->subHours(2);
            $rangeEnd = Carbon::parse($tomorow . ' ' . $employee->shift->time_end)->addHours(3);
        }

        if ($employeeShiftToday) {

            $rangeStart = Carbon::parse($today . ' ' . $employeeShiftToday->shift->time_start)->subHours(2);
            $rangeEnd = Carbon::parse($today . ' ' . $employeeShiftToday->shift->time_end)->addHours(3);

            $timeStart = Carbon::parse($today . ' ' . $employeeShiftToday->shift->time_start);
            $timeEnd = Carbon::parse($today . ' ' . $employeeShiftToday->shift->time_end);


            if ($timeEnd < $timeStart) {
                $rangeStart = Carbon::parse($today . ' ' . $employeeShiftToday->shift->time_start)->subHours(2);
                $rangeEnd = Carbon::parse($tomorow . ' ' . $employeeShiftToday->shift->time_end)->addHours(3);
            }
        }


        if ($employeeShiftYesterday) {


            $checkTimeStart = Carbon::parse($yesterday . ' ' . $employeeShiftYesterday->shift->time_start);
            $checkTimeEnd = Carbon::parse($yesterday . ' ' . $employeeShiftYesterday->shift->time_end);




            if ($checkTimeEnd < $checkTimeStart) {


                $checkRangeStart = Carbon::parse($yesterday . ' ' . $employeeShiftYesterday->shift->time_start)->subHours(2);
                $checkRangeEnd = Carbon::parse($today . ' ' . $employeeShiftYesterday->shift->time_end)->addHours(3);

                if ($now <= $checkRangeEnd && $now >= $checkRangeStart) {

                    $timeStart = Carbon::parse($yesterday . ' ' . $employeeShiftYesterday->shift->time_start);
                    $timeEnd = Carbon::parse($today . ' ' . $employeeShiftYesterday->shift->time_end);

                    $rangeStart = Carbon::parse($yesterday . ' ' . $employeeShiftYesterday->shift->time_start)->subHours(2);
                    $rangeEnd = Carbon::parse($today . ' ' . $employeeShiftYesterday->shift->time_end)->addHours(3);
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


        $attendanceTrackingCheckins = collect();
        $atendanceTrackingCheckout = null;

        if ($attendance) {

            $attendanceTimeIn = Carbon::parse($attendance->time_in);

            if ($attendanceTimeIn > $timeStart) {
                $isLate = 'islate';
            }

            $attendanceTrackingCheckins = AttendanceTracking::where('attendance_id', $attendance->id)
                ->where('type', 'check_in')
                ->orderBy('created_at')
                ->get();

            $atendanceTrackingCheckout = AttendanceTracking::where('attendance_id', $attendance->id)
                ->where('type', 'check_out')
                ->first();



            if ($attendance->time_in) {
                $timeIn = Carbon::parse($attendance->time_in)->format('H:i');
            }

            if ($attendance->time_out) {
                $timeOutStr = is_string($attendance->time_out)
                    ? trim($attendance->time_out)
                    : (string)$attendance->time_out;

                if (strpos($timeOutStr, ' ') !== false) {
                    // Format: YYYY-MM-DD HH:MM:SS
                    $timeOutStr = explode(' ', $timeOutStr)[1];
                }

                if ($timeOutStr !== '00:00:00' && $timeOutStr !== '00:00') {
                    $timeOut = Carbon::parse($attendance->time_out)->format('H:i');
                }
            }

            if ($attendance->time_in && $attendance->time_out) {
                $timeOutStr = is_string($attendance->time_out)
                    ? trim($attendance->time_out)
                    : (string)$attendance->time_out;

                if (strpos($timeOutStr, ' ') !== false) {
                    $timeOutStr = explode(' ', $timeOutStr)[1];
                }

                if ($timeOutStr !== '00:00:00' && $timeOutStr !== '00:00') {
                    $totalWorkHour = Carbon::parse($attendance->time_in)->diffInHours(Carbon::parse($attendance->time_out));
                }
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
        } catch (\Throwable $_) {
        }

        return view('dashboard', compact(
            'employee',
            'office',
            'attendance',
            'employeeShift',
            'todayDate',
            'isLate',
            'timeIn',
            'timeOut',
            'attendanceTrackingCheckins',
            'atendanceTrackingCheckout'
        ));
    }
}


