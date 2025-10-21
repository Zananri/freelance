<?php

namespace App\Helpers;

use App\Models\EmployeeActivity;
use App\Models\Employee;

class ActivityHelper
{
    /**
     * Record an employee activity safely.
     *
     * $data keys: employee_id, menu, activity, description, date_time_activity, status
     */
    public static function record(array $data)
    {
        try {
            $employeeId = $data['employee_id'] ?? null;

            // If employee_id not provided but user_id given, try to resolve (not used here)
            if (!$employeeId && isset($data['user_id'])) {
                $emp = Employee::where('user_id', $data['user_id'])->first();
                $employeeId = $emp?->id;
            }

            EmployeeActivity::create([
                'employee_id' => $employeeId,
                'menu' => $data['menu'] ?? null,
                'activity' => $data['activity'] ?? null,
                'description' => $data['description'] ?? null,
                'date_time_activity' => $data['date_time_activity'] ?? now(),
                'status' => $data['status'] ?? 'ACTIVE'
            ]);
        } catch (\Exception $e) {
            // Log and continue; do not interrupt page rendering
            \Log::error('Failed to record employee activity: ' . $e->getMessage());
        }
    }
}
