<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Employee;
use App\Models\EmployeeLocation;
use Illuminate\Support\Facades\Auth;
use Carbon\Carbon;

class EmployeeLocationController extends Controller
{
    private function currentEmployee(): ?Employee
    {
        $user = Auth::user();

        if (!$user) {
            return null;
        }

        $employee = Employee::where('user_id', $user->id)->first();

        if ($employee || !$user->email) {
            return $employee;
        }

        $normalizedEmail = strtolower(trim((string) $user->email));

        $emailMatches = Employee::where(function ($query) use ($normalizedEmail) {
            $query->whereRaw('LOWER(TRIM(email)) = ?', [$normalizedEmail])
                ->orWhereRaw('LOWER(TRIM(email_work)) = ?', [$normalizedEmail]);
        })->limit(2)->get();

        return $emailMatches->count() === 1
            ? $emailMatches->first()
            : null;
    }

    public function status()
    {
        $employee = $this->currentEmployee();

        return response()->json([
            'code' => 200,
            'status' => 'success',
            'tracking' => (bool) $employee,
            'employee_id' => $employee?->id,
            'reason' => $employee ? null : 'employee_not_linked',
        ]);
    }

    private function persistLocation(Request $request)
    {
        $employee = $this->currentEmployee();

        if (!$employee) {
            return response()->json([
                'code' => 422,
                'status' => 'error',
                'message' => 'Akun user belum terhubung ke data employee.',
                'reason' => 'employee_not_linked',
            ], 422);
        }

        $validated = $request->validate([
            'latitude' => 'required|numeric|between:-90,90',
            'longitude' => 'required|numeric|between:-180,180',
            'accuracy' => 'nullable|numeric',
            'tracked_at' => 'nullable|date',
        ]);

        try {
            $trackedAt = isset($validated['tracked_at'])
                ? Carbon::parse($validated['tracked_at'])->setTimezone(config('app.timezone'))
                : Carbon::now();
        } catch (\Exception $e) {
            $trackedAt = Carbon::now();
        }

        $location = EmployeeLocation::updateOrCreate(
            ['employee_id' => $employee->id],
            [
                'latitude' => $validated['latitude'],
                'longitude' => $validated['longitude'],
                'accuracy' => $validated['accuracy'] ?? null,
                'tracked_at' => $trackedAt->format('Y-m-d H:i:s'),
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
