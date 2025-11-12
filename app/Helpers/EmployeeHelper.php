<?php

namespace App\Helpers;

use App\Models\Employee;

class EmployeeHelper
{
    public static function EmployeeActiveIds(){
        $user = auth()->user();
        $userId = auth()->user()->id;
        
        $currentEmployee = Employee::where('user_id', $userId)->first();
        
        $userType = strtoupper((string) ($user->user_type ?? ''));
        $userRole = strtoupper((string) ($user->user_role ?? ''));

        
        $employee = Employee::select('employees.id')
            ->join('users','employees.user_id','=','users.id')
        ->where('employees.status',"ACTIVE");

        if(in_array($userType, ['ADMINISTRATOR'])){
            //show all departments
        }
        elseif (in_array($userType, ['ADMINISTRATOR','MANAGEMENT']) && in_array($userRole, ['ADMINISTRATOR','GENERAL_MANAGER', 'CEO','HR_MANAGER'])) {
            //show all departments
        }else{
            $employee = $employee->where('employees.department_id',$currentEmployee->department_id);
        }

        $employee = $employee->whereNotIn('users.user_role',["GENERAL_MANAGER","CEO"])
            ->whereNotIn('users.user_type',["ADMINISTRATOR"])
        ->get();

        return $employee->pluck('id');
    
    }
    
}