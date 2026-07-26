<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

use App\Models\User;
use App\Models\Employee;
use App\Models\Department;
use App\Models\Division;
use App\Models\Job;
use App\Helpers\ActivityHelper;

class TeamsController extends Controller
{

    public function showTeamsPage()
    {
        $user = auth()->user();
        $userId = $user->id;
        $isSuperadmin = strtoupper((string) ($user->user_type ?? '')) === 'SUPERADMIN';

        $currentEmployee = Employee::where('user_id', $userId)->first();


        $employee = Employee::select(
            'employees.id',
            'employees.department_id',
            'employees.division_id',
            'employees.name',
            'employees.status',
            'employees.user_id',
            'employees.photo',
            'employees.profile_picture', // new unified avatar field
            'users.photo as user_photo', // fallback legacy user photo
            'job_list.job_name'
        )
        ->join('job_list','employees.job_id','=','job_list.id')
        ->join('users','employees.user_id','=','users.id')
        ->where('employees.status',"ACTIVE")
        ->where('users.user_type','<>',"ADMINISTRATOR")
        ->when(!$isSuperadmin, fn ($query) => $query->where('employees.department_id', $currentEmployee?->department_id ?? 0))
        ->get();

        $department = Department::where('status',"ACTIVE")
            ->when(!$isSuperadmin, fn ($query) => $query->where('id', $currentEmployee?->department_id ?? 0))
            ->get();
        $division = Division::where('status',"ACTIVE")
            ->when(!$isSuperadmin, fn ($query) => $query->where('department_id', $currentEmployee?->department_id ?? 0))
            ->get();
        $job = Job::where('status',"ACTIVE")->get();

        try {
            $user = auth()->user();
            $employeeId = $user && $user->employee ? $user->employee->id : null;
            ActivityHelper::record([
                'employee_id' => $employeeId,
                'menu' => 'TEAMS',
                'activity' => 'VIEW_PAGE',
                'description' => ($user?->employee?->name ?? 'Unknown') . ' View page teams',
            ]);
        } catch (\Throwable $_) {}

        return view('teams.teams',[
            'employee' => $employee,
            'department' => $department,
            'division' => $division,
            'job' => $job
        ]);
    }

    public function getTeamsDetail(Request $request){
        $user = auth()->user();
        $currentEmployee = $user?->employee;
        $isSuperadmin = strtoupper((string) ($user?->user_type ?? '')) === 'SUPERADMIN';

        $idEmployee = 0;

        if(isset($request->ID_EMPLOYEE)){
            $idEmployee = $request->ID_EMPLOYEE;
        }

        $employee = Employee::with('division', 'department', 'job','grade','user')
            ->where('status',"ACTIVE")
            ->where('id', $idEmployee)
            ->when(!$isSuperadmin, fn ($query) => $query->where('department_id', $currentEmployee?->department_id ?? 0))
            ->first();

        if(!$employee){
            return response()->json([
                'code' => 406,
                'status' => "error",
                'message'=> 'Employee not found '.$idEmployee
            ], 406);
        }

        $data['employee'] = $employee;

        return response()->json([
            'code' => 200,
            'status' => 'success',
            'data'  => $data,
            'message' => 'success get detail employee'
        ]);
    }

}
