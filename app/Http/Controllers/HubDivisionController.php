<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Helpers\ActivityHelper;
use App\Models\Employee;

class HubDivisionController extends Controller
{
    public function showHubDivisionPage()
    {
        $userId = auth()->user()->id;

        $currentEmployee = Employee::where('user_id', $userId)->first();

        $employee = Employee::select(
            'employees.id',
            'employees.department_id',
            'employees.division_id',
            'employees.name',
            'employees.status',
            'employees.user_id',
            'employees.photo',
            'employees.profile_picture',
            'users.photo as user_photo',
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
        
        return view('hub_division.hub_division',
            [
                'employee' => $employee,
                'current_employee' => $currentEmployee
            ]
        );
    }
}
