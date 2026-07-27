<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Employee;
use App\Models\EmployeeLocation;
use Illuminate\Support\Facades\Auth;
use Carbon\Carbon;

class EmployeeLocationController extends Controller
{
    public function status()
    {
        $employee = Employee::where('user_id', Auth::id())->first();

        return response()->json([
            'code' => 200,
            'status' => 'success',
            'tracking' => (bool) $employee,
        ]);
    }

    private function persistLocation(Request $request)
    {
        $employee = Employee::where('user_id', Auth::id())->firstOrFail();

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
