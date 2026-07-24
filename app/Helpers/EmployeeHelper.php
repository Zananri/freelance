<?php

namespace App\Helpers;

use App\Models\Employee;

class EmployeeHelper
{
    public static function EmployeeActiveIds()
    {
        $user = auth()->user();
        if (!$user) {
            return collect();
        }
        
        $userId = $user->id;
        $currentEmployee = Employee::where('user_id', $userId)->first();
        
        $userType = strtoupper((string) ($user->user_type ?? ''));
        $userRole = strtoupper((string) ($user->user_role ?? ''));

        $employeeQuery = Employee::select('employees.id')
            ->join('users', 'employees.user_id', '=', 'users.id')
            ->where('employees.status', "ACTIVE")
            ->where('employees.user_id', '!=', $userId);

        $hasGlobalAccess = in_array($userType, ['ADMINISTRATOR', 'SUPERADMIN']) || 
                           in_array($userRole, ['ADMINISTRATOR', 'GENERAL_MANAGER', 'CEO', 'HR_MANAGER']);

        if (!$hasGlobalAccess) {
            if ($currentEmployee) {
                $employeeQuery->where('employees.department_id', $currentEmployee->department_id);
            }
        }

        $employeeQuery->whereNotIn('users.user_role', ["GENERAL_MANAGER", "CEO", "ADMINISTRATOR", "SUPERADMIN"])
                      ->whereNotIn('users.user_type', ["ADMINISTRATOR", "SUPERADMIN"]);

        return $employeeQuery->get()->pluck('id');
    }
}