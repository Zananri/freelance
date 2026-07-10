<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Carbon\Carbon;
use App\Models\Attendance;
use App\Models\AttendanceTracking;
use App\Models\Division;
use App\Models\Employee;

class MonitoringController extends Controller
{
    public function showMonitoringPage() {
        return view('monitoring.monitoring');
    }

    public function getMonitoringData(Request $request)
    {
        $user = auth()->user();
        $currentEmployee = Employee::where('user_id', $user->id)->first();
        $userType = strtoupper((string) ($user->user_type ?? ''));

        $employeeQuery = Employee::with(['division', 'job'])
            ->where('status', 'ACTIVE')
            ->whereHas('user', function ($query) {
                $query->whereNotIn('user_role', ['GENERAL_MANAGER', 'CEO'])
                    ->whereNotIn('user_type', ['ADMINISTRATOR']);
            });

        if ($currentEmployee) {
            if ($userType !== 'SUPERADMIN') {
                $employeeQuery->where('department_id', $currentEmployee->department_id);
            }

            $employeeQuery->where('id', '!=', $currentEmployee->id);
        } else {
            $employeeQuery->whereRaw('0 = 1');
        }

        $employees = $employeeQuery->get()->map(function ($employee) {
            return [
                'id' => $employee->id,
                'name' => $employee->name,
                'division_id' => $employee->division_id,
                'division_name' => optional($employee->division)->name_division,
                'job_name' => optional($employee->job)->job_name,
                'department_id' => $employee->department_id,
            ];
        });

        $divisionIds = $employees->pluck('division_id')->filter()->unique()->values();
        $divisions = Division::with('department')
            ->whereIn('id', $divisionIds)
            ->get(['id', 'name_division', 'department_id'])
            ->map(function ($division) {
                return [
                    'id' => $division->id,
                    'name' => $division->name_division,
                    'department' => $division->department?->name_department,
                ];
            });

        $employeeIds = $employees->pluck('id')->toArray();
        $today = Carbon::today();

        $checkins = AttendanceTracking::select('attendance_trackings.location', 'attendance_trackings.date_time', 'attendances.employee_id')
            ->join('attendances', 'attendance_trackings.attendance_id', '=', 'attendances.id')
            ->where('attendance_trackings.type', 'check_in')
            ->whereDate('attendance_trackings.date_time', $today)
            ->whereIn('attendances.employee_id', $employeeIds)
            ->orderBy('attendance_trackings.date_time', 'desc')
            ->get()
            ->groupBy('employee_id')
            ->map(function ($records, $employeeId) {
                $record = $records->first();
                [$lat, $lng] = array_map('trim', explode(',', $record->location));

                if (!is_numeric($lat) || !is_numeric($lng)) {
                    return null;
                }

                return [
                    'employee_id' => (int) $employeeId,
                    'lat' => (float) $lat,
                    'lng' => (float) $lng,
                    'date_time' => optional($record->date_time)->toDateTimeString(),
                ];
            })
            ->filter()
            ->values();

        return response()->json([
            'code' => 200,
            'status' => 'success',
            'data' => [
                'divisions' => $divisions,
                'employees' => $employees,
                'checkins' => $checkins,
            ],
        ]);
    }
}
