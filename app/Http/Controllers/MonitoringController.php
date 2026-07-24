<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Carbon\Carbon;
use App\Models\AttendanceTracking;
use App\Models\Division;
use App\Models\Employee;
use App\Models\EmployeeLocation;
use App\Models\Partner;
use App\Models\Department;

class MonitoringController extends Controller
{
    public function showMonitoringPage()
    {
        return view('monitoring.monitoring');
    }

    public function getMonitoringData(Request $request)
    {
        $user = auth()->user();
        $currentEmployee = Employee::where('user_id', $user->id)->first();
        $userType = strtoupper((string) ($user->user_type ?? ''));

        if (!in_array($userType, ['SUPERADMIN', 'ADMINISTRATOR'])) {
            abort(403);
        }

        $employeeQuery = Employee::with(['division', 'job', 'partner', 'department'])
            ->where('status', 'ACTIVE')
            ->whereHas('user', function ($query) {
                $query->whereNotIn('user_role', ['GENERAL_MANAGER', 'CEO'])
                    ->whereNotIn('user_type', ['ADMINISTRATOR']);
            });

        if ($userType === 'ADMINISTRATOR') {
            if (!$currentEmployee) {
                return $this->emptyResponse();
            }

            $employeeQuery->where('department_id', $currentEmployee->department_id)
                ->where('id', '!=', $currentEmployee->id);
        }

        if ($userType === 'SUPERADMIN' && $currentEmployee) {
            $employeeQuery->where('id', '!=', $currentEmployee->id);
        }

        $employees = $employeeQuery->get()->map(function ($employee) {
            return [
                'id' => $employee->id,
                'name' => $employee->name,
                'partner_id' => $employee->partner_id,
                'partner_name' => optional($employee->partner)->partner_name,
                'division_id' => $employee->division_id,
                'division_name' => optional($employee->division)->name_division,
                'job_name' => optional($employee->job)->job_name,
                'department_id' => $employee->department_id,
                'department_name' => optional($employee->department)->name_department,
            ];
        });

        $departmentIds = $employees->pluck('department_id')->filter()->unique()->values();
        $partnerIds = $employees->pluck('partner_id')->filter()->unique()->values();
        $divisionIds = $employees->pluck('division_id')->filter()->unique()->values();

        $departments = Department::whereIn('id', $departmentIds)
            ->orderBy('name_department')
            ->get(['id', 'name_department'])
            ->map(function ($department) {
                return [
                    'id' => $department->id,
                    'name' => $department->name_department,
                ];
            })
            ->values();

        $partners = Partner::whereIn('id', $partnerIds)
            ->orderBy('partner_name')
            ->get(['id', 'partner_name', 'department_id'])
            ->map(function ($partner) {
                return [
                    'id' => $partner->id,
                    'name' => $partner->partner_name,
                    'department_id' => $partner->department_id,
                ];
            })
            ->values();

        $divisions = Division::whereIn('id', $divisionIds)
            ->orderBy('name_division')
            ->get(['id', 'name_division', 'department_id', 'partner_id'])
            ->map(function ($division) {
                return [
                    'id' => $division->id,
                    'name' => $division->name_division,
                    'department_id' => $division->department_id,
                    'partner_id' => $division->partner_id,
                ];
            })
            ->values();

        $employeeIds = $employees->pluck('id')->toArray();

        if (empty($employeeIds)) {
            return $this->emptyResponse($divisions, $employees, $departments, $partners, $userType);
        }

        $today = Carbon::today();

        $trackingRecords = AttendanceTracking::select(
            'attendance_trackings.id',
            'attendance_trackings.location',
            'attendance_trackings.date_time',
            'attendance_trackings.type',
            'attendance_trackings.image',
            'attendances.employee_id'
        )
            ->join('attendances', 'attendance_trackings.attendance_id', '=', 'attendances.id')
            ->whereIn('attendance_trackings.type', ['check_in', 'check_out'])
            ->whereDate('attendance_trackings.date_time', $today)
            ->whereIn('attendances.employee_id', $employeeIds)
            ->orderBy('attendance_trackings.date_time')
            ->get()
            ->values();

        $checkinCounterByEmployee = [];
        $latestStatusByEmployee = [];

        $points = $trackingRecords->map(function ($record) use (&$checkinCounterByEmployee, &$latestStatusByEmployee) {
            if (!$record->location || strpos($record->location, ',') === false) {
                return null;
            }

            [$lat, $lng] = array_map('trim', explode(',', $record->location, 2));

            if (!is_numeric($lat) || !is_numeric($lng)) {
                return null;
            }

            $employeeId = (int) $record->employee_id;
            $checkinCounterByEmployee[$employeeId] = $checkinCounterByEmployee[$employeeId] ?? 0;

            $pointType = 'checkpoint';
            if ($record->type === 'check_out') {
                $pointType = 'check_out';
            } else {
                $checkinCounterByEmployee[$employeeId]++;
                $pointType = $checkinCounterByEmployee[$employeeId] === 1 ? 'check_in' : 'checkpoint';
            }

            $latestStatusByEmployee[$employeeId] = $record->type;

            $firstImage = null;
            if (is_array($record->image) && isset($record->image[0])) {
                $firstImage = $record->image[0];
            }

            if ($firstImage && !preg_match('/^(https?:)?\/\//i', $firstImage)) {
                $firstImage = asset(ltrim($firstImage, '/'));
            }

            return [
                'id' => (int) $record->id,
                'employee_id' => $employeeId,
                'lat' => (float) $lat,
                'lng' => (float) $lng,
                'type' => $pointType,
                'source_type' => $record->type,
                'date_time' => optional($record->date_time)->toDateTimeString(),
                'time' => optional($record->date_time)->format('H:i'),
                'image_url' => $firstImage,
                'is_live' => false,
            ];
        })->filter()->values();

        $locations = EmployeeLocation::whereIn('employee_id', $employeeIds)
            ->get(['id', 'employee_id', 'latitude', 'longitude', 'accuracy', 'tracked_at'])
            ->values();

        foreach ($locations as $location) {
            $employeeId = (int) $location->employee_id;
            $latestStatus = $latestStatusByEmployee[$employeeId] ?? null;

            if ($latestStatus === 'check_out') {
                continue;
            }

            if (!is_numeric($location->latitude) || !is_numeric($location->longitude)) {
                continue;
            }

            $points->push([
                'id' => 'live_' . $location->id,
                'employee_id' => $employeeId,
                'lat' => (float) $location->latitude,
                'lng' => (float) $location->longitude,
                'type' => 'checkpoint',
                'source_type' => 'live',
                'date_time' => optional($location->tracked_at)->toDateTimeString(),
                'time' => optional($location->tracked_at)->format('H:i'),
                'image_url' => null,
                'is_live' => true,
            ]);
        }

        $points = $points->sortBy(function ($point) {
            return strtotime($point['date_time'] ?? '') ?: 0;
        })->values();

        return response()->json([
            'code' => 200,
            'status' => 'success',
            'data' => [
                'user_type' => $userType,
                'departments' => $departments,
                'partners' => $partners,
                'divisions' => $divisions,
                'employees' => $employees,
                'checkins' => $points,
                'points' => $points,
            ],
        ]);
    }

    private function emptyResponse($divisions = [], $employees = [], $departments = [], $partners = [], $userType = '')
    {
        return response()->json([
            'code' => 200,
            'status' => 'success',
            'data' => [
                'user_type' => $userType,
                'departments' => $departments,
                'partners' => $partners,
                'divisions' => $divisions,
                'employees' => $employees,
                'checkins' => [],
                'points' => [],
            ],
        ]);
    }
}