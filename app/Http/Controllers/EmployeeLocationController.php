<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Attendance;
use App\Models\Employee;
use App\Models\EmployeeLocation;
use Illuminate\Support\Facades\Auth;
use Carbon\Carbon;

class EmployeeLocationController extends Controller
{
    private function isCheckedInWithoutCheckout(Employee $employee): bool
    {
        $attendance = Attendance::where('employee_id', $employee->id)
            ->whereDate('date_attendance', Carbon::today()->toDateString())
            ->whereNotNull('time_in')
            ->first();

        if (!$attendance) {
            return false;
        }

        $timeOutStr = is_string($attendance->time_out)
            ? trim($attendance->time_out)
            : (string) $attendance->time_out;

        if (strpos($timeOutStr, ' ') !== false) {
            $timeOutStr = explode(' ', $timeOutStr)[1];
        }

        return $timeOutStr === '' || $timeOutStr === '00:00:00' || $timeOutStr === '00:00';
    }

    private function persistLocation(Request $request)
    {
        $employee = Employee::where('user_id', Auth::id())->firstOrFail();

        if (!$this->isCheckedInWithoutCheckout($employee)) {
            return response()->json([
                'code' => 403,
                'status' => 'error',
                'message' => 'Employee has not checked in',
            ], 403);
        }

        $validated = $request->validate([
            'latitude' => 'required|numeric|between:-90,90',
            'longitude' => 'required|numeric|between:-180,180',
            'accuracy' => 'nullable|numeric',
            'tracked_at' => 'required|date',
        ]);

        try {
            $trackedAt = Carbon::parse($validated['tracked_at'])->format('Y-m-d H:i:s');
        } catch (\Exception $e) {
            $trackedAt = Carbon::now()->format('Y-m-d H:i:s');
        }

        $location = EmployeeLocation::updateOrCreate(
            ['employee_id' => $employee->id],
            [
                'latitude' => $validated['latitude'],
                'longitude' => $validated['longitude'],
                'accuracy' => $validated['accuracy'] ?? null,
                'tracked_at' => $trackedAt,
            ]
        );

        return response()->json([
            'code' => 200,
            'status' => 'success',
            'data' => $location,
        ]);
    }

    public function store(Request $request)
    {
        return $this->persistLocation($request);
    }

    public function update(Request $request)
    {
        return $this->persistLocation($request);
    }
}