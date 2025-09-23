<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

use App\Models\User;
use App\Models\Employee;
use App\Models\Department;
use App\Models\Division;
use App\Models\Job;

class TeamsController extends Controller
{

    public function showTeamsPage()
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
            'employees.profile_picture', // new unified avatar field
            'users.photo as user_photo', // fallback legacy user photo
            'job_list.job_name'
        )
        ->join('job_list','employees.job_id','=','job_list.id')
        ->join('users','employees.user_id','=','users.id')
        ->where('employees.status',"ACTIVE")
        ->where('users.user_type','<>',"ADMINISTRATOR")
        ->where('employees.department_id',$currentEmployee->department_id)
        ->get();

        $department = Department::where('status',"ACTIVE")->get();
        $division = Division::where('status',"ACTIVE")->where('department_id',$currentEmployee->department_id)->get();
        $job = Job::where('status',"ACTIVE")->get();

        return view('teams.teams',[
            'employee' => $employee,
            'department' => $department,
            'division' => $division,
            'job' => $job
        ]);
    }

    public function getTeamsDetail(Request $request){
        

        $idEmployee = 0;

        if(isset($request->ID_EMPLOYEE)){
            $idEmployee = $request->ID_EMPLOYEE;
        }

        $employee = Employee::with('division', 'department', 'job','grade','user')
            ->where('status',"ACTIVE")
            ->where('id', $idEmployee)
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

