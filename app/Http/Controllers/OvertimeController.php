<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

use Carbon\Carbon;

use App\Models\User;
use App\Models\Employee;
use App\Models\EmployeeOvertime;
use App\Helpers\ActivityHelper;

class OvertimeController extends Controller
{
    public function showOvertimePage()
    {
        $user = auth()->user();        
        $currentEmployee = Employee::where('user_id', $user->id)->first();
        
        $userType = strtoupper((string) ($user->user_type ?? ''));
        $userRole = strtoupper((string) ($user->user_role ?? ''));

        $employee = Employee::select('employees.id','employees.user_id','employees.department_id','employees.division_id','employees.name','employees.status','employees.photo',
            'job_list.job_name'
        )
        ->join('job_list','employees.job_id','=','job_list.id')
        ->join('users','employees.user_id','=','users.id')
        ->where('employees.status',"ACTIVE");

        if(in_array($userType, ['SUPERADMIN','ADMINISTRATOR']) && in_array($userRole, ['ADMINISTRATOR','GENERAL_MANAGER', 'CEO','HR_MANAGER'])) {
            //show all
        }else{
            $employee = $employee->where('employees.department_id',$currentEmployee->department_id);
        }

        $employee = $employee->whereNotIn('users.user_role',["GENERAL_MANAGER","CEO"])
        ->whereNotIn('users.user_type',["ADMINISTRATOR","SUPERADMIN"])
        ->get();

        return view('overtime.overtime',[
            'employee' => $employee
        ]);
    }


    public function employeeOvertimeRequest(Request $request)
    {
        $user = auth()->user();        
        $currentEmployee = Employee::where('user_id', $user->id)->first();
        
        $userType = strtoupper((string) ($user->user_type ?? ''));
        $userRole = strtoupper((string) ($user->user_role ?? ''));

        $today = Carbon::today()->toDateString();

        $searchQuery = '';


        if(isset($request->SEARCH_QUERY)){
            $searchQuery = $request->SEARCH_QUERY;
        }

        
        $employeeIds = Employee::select('employees.id')
            ->join('users','employees.user_id','=','users.id')
        ->where('employees.status',"ACTIVE");
        
        if(in_array($userType, ['SUPERADMIN','ADMINISTRATOR']) && in_array($userRole, ['ADMINISTRATOR','GENERAL_MANAGER', 'CEO','HR_MANAGER'])) {
            //show all
        }else{
            $employeeIds = $employeeIds->where('employees.department_id',$currentEmployee->department_id);
        }

        $employeeIds = $employeeIds->whereNotIn('users.user_role',["GENERAL_MANAGER","CEO"])
            ->whereNotIn('users.user_type',["ADMINISTRATOR","SUPERADMIN"])
            ->orderBy('id','DESC')
        ->pluck('id');

        $employeeOvertime = EmployeeOvertime::with('employee')
            ->whereIn('employee_id',$employeeIds)
            ->where('date_overtime','<',$today)
            ->where('status','<>','DELETED');
        
        if(isset($searchQuery)){
            $employeeOvertime = $employeeOvertime->where(function($query) use ($searchQuery){
                    $query->where('status','like','%'.$searchQuery.'%');
                    $query->orWhere('date_overtime','like','%'.$searchQuery.'%');
                    $query->orWhere('description','like','%'.$searchQuery.'%');
                    $query->orWhereHas('employee', function ($q3) use ($searchQuery) {
                        $q3->where('name', 'like', '%' . $searchQuery . '%');
                    });
                });
 
        }
            
        
        $employeeOvertime = $employeeOvertime->orderBy('id','DESC')->get();


        return response()->json([
                'code' => 200,
                'status' => 'success',
                'data' => [
                    'employee_overtime' => $employeeOvertime
                ],
                'message' => 'Get employee overtime successfully'
        ]);
    }
    

    
    public function employeeOvertimeByMonth(Request $request)
    {
        $user = auth()->user();        
        $currentEmployee = Employee::where('user_id', $user->id)->first();
        
        $userType = strtoupper((string) ($user->user_type ?? ''));
        $userRole = strtoupper((string) ($user->user_role ?? ''));

        $year = Carbon::today()->format('Y');
        $month = Carbon::today()->format('m');
        $page = (int)($request->PAGE ?? 1);
        $perPage = 10;

        if(isset($request->YEAR)){
            $year = $request->YEAR;
        }

        if(isset($request->MONTH)){
            $month = $request->MONTH;
        }

        $employeeQuery = Employee::select('employees.id','employees.name','employees.photo','employees.department_id','employees.division_id')
            ->join('users','employees.user_id','=','users.id')
            ->where('employees.status',"ACTIVE")
            ->whereNotIn('users.user_role',["GENERAL_MANAGER","CEO"])
            ->whereNotIn('users.user_type',["ADMINISTRATOR","SUPERADMIN"])
            ->orderBy('employees.id','DESC');

        if(!in_array($userType, ['SUPERADMIN','ADMINISTRATOR']) || !in_array($userRole, ['ADMINISTRATOR','GENERAL_MANAGER', 'CEO','HR_MANAGER'])) {
            $employeeQuery = $employeeQuery->where('employees.department_id',$currentEmployee->department_id);
        }

        $totalEmployees = $employeeQuery->count();
        $employeeIds = $employeeQuery->pluck('employees.id');
        $employees = $employeeQuery->skip(($page - 1) * $perPage)->take($perPage)->get();

        if($month === 'all'){
            $firstDayOfMonth = Carbon::create($year, 1, 1)->startOfYear()->toDateString();
            $lastDayOfMonth = Carbon::create($year, 12, 1)->endOfYear()->toDateString();
        } else {
            $firstDayOfMonth = Carbon::create($year, $month, 1)->startOfMonth()->toDateString();
            $lastDayOfMonth = Carbon::create($year, $month, 1)->endOfMonth()->toDateString();
        }

        $employeeTotalOvertime = Employee::select('employees.id',
            DB::raw('(SELECT COALESCE(SUM(TIME_TO_SEC(total_overtime)),0) FROM employee_overtimes WHERE employee_id = employees.id AND date_overtime >= "'.$firstDayOfMonth.'" AND date_overtime <= "'.$lastDayOfMonth.'" AND status = "APPROVED") AS total_hours'),
            DB::raw('(SELECT COALESCE(COUNT(employee_id),0) FROM employee_overtimes WHERE employee_id = employees.id AND date_overtime >= "'.$firstDayOfMonth.'" AND date_overtime <= "'.$lastDayOfMonth.'" AND status = "APPROVED") AS total_days')
        )
        ->whereIn('employees.id',$employeeIds->toArray())
        ->get();

        $lastPage = max(1, (int)ceil($totalEmployees / $perPage));

        return response()->json([
                'code' => 200,
                'status' => 'success',
                'data' => [
                    'employees' => $employees,
                    'total_overtime' => $employeeTotalOvertime,
                    'pagination' => [
                        'current_page' => $page,
                        'last_page' => $lastPage,
                        'total' => $totalEmployees,
                        'per_page' => $perPage,
                        'from' => ($page - 1) * $perPage + 1,
                        'to' => min($page * $perPage, $totalEmployees),
                    ]
                ],
                'message' => 'Get employee overtime successfully'
        ]);
    }

    public function approveEmployeeOvertimeRequest(Request $request){

        try{

            DB::beginTransaction();
            
            $request->validate([
                'overtime_id' => 'required|integer',
                'employee_id' => 'required|integer',
            ]);

            $userId = auth()->user()->id;
            $employeeId = $request->employee_id;
            $overtimeId = $request->overtime_id;

            $employeeOvertime = EmployeeOvertime::where('id', $overtimeId)
                ->where('employee_id',$employeeId)
            ->first();

            if(!$employeeOvertime){
                throw new \Exception('Overtime request not found');
            }

            $note = '';
            if(isset($request->note)){
                $note = $request->note;
            }
            
            
            if(!in_array($employeeOvertime->status,['REQUEST','REQUEST_SUBMIT','REJECTED']) ){
                throw new \Exception('Overtime cannot be approve, status already '.$employeeOvertime->status);
            }
            
            $employeeOvertime->status = 'APPROVED';
            $employeeOvertime->approve_by = $userId;
            $employeeOvertime->approve_at = Carbon::now();
            $employeeOvertime->reject_note = $note;
            $employeeOvertime->save();

            DB::commit();

            try {
                ActivityHelper::record([
                    'employee_id' => $employeeOvertime?->employee_id,
                    'menu' => 'ATTENDANCE',
                    'activity' => 'OVERTIME_APPROVE',
                    'description' => 'Overtime request approved by user_id ' . $userId,
                    'date_time_activity' => Carbon::now(),
                ]);
            } catch (\Throwable $_) {}

            return response()->json([
                'code' => 200,
                'status' => 'success',
                'data' => [],
                'message' => 'Approve overtime request successfully'
            ]);

        }catch (\Exception $e) {

            DB::rollBack();
            
            return response()->json([
                'code' => 500,
                'status' => 'error',
                'data' => [],
                'message' => $e->getMessage()
            ], 500);
        }
    }

    public function rejectEmployeeOvertimeRequest(Request $request){

        try{

            DB::beginTransaction();
            
            $request->validate([
                'overtime_id' => 'required|integer',
                'employee_id' => 'required|integer',
                'note' => 'required',
            ]);

            $userId = auth()->user()->id;
            $employeeId = $request->employee_id;
            $overtimeId = $request->overtime_id;

            $employeeOvertime = EmployeeOvertime::where('id', $overtimeId)
                ->where('employee_id',$employeeId)
            ->first();

            if(!$employeeOvertime){
                throw new \Exception('Overtime request not found');
            }

            $note = '';
            if(isset($request->note)){
                $note = $request->note;
            }
            
            
            $employeeOvertime->status = 'REJECTED';
            $employeeOvertime->reject_by = $userId;
            $employeeOvertime->reject_at = Carbon::now();
            $employeeOvertime->reject_note = $note;
            $employeeOvertime->save();

            DB::commit();

            try {
                ActivityHelper::record([
                    'employee_id' => $employeeOvertime?->employee_id,
                    'menu' => 'ATTENDANCE',
                    'activity' => 'OVERTIME_REJECT',
                    'description' => 'Overtime request rejected by user_id ' . $userId,
                    'date_time_activity' => Carbon::now(),
                ]);
            } catch (\Throwable $_) {}

            return response()->json([
                'code' => 200,
                'status' => 'success',
                'data' => [],
                'message' => 'Reject overtime request successfully'
            ]);

        }catch (\Exception $e) {

            DB::rollBack();
            
            return response()->json([
                'code' => 500,
                'status' => 'error',
                'data' => [],
                'message' => $e->getMessage()
            ], 500);
        }
    }

}
