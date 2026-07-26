<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

use Carbon\Carbon;

use App\Models\User;
use App\Models\Employee;
use App\Models\EmployeeLeave;
use App\Models\EmployeeLeaveRequest;

class LeaveController extends Controller
{
    public function showLeavePage()
    {
        return view('leave.leave');
    }

    public function getEmployeeLeaveByYear(Request $request)
    {
        $user = auth()->user();
        $userId = auth()->user()->id;
        
        $currentEmployee = Employee::where('user_id', $userId)->first();
        
        $userType = strtoupper((string) ($user->user_type ?? ''));
        $userRole = strtoupper((string) ($user->user_role ?? ''));

        $year = Carbon::today()->format('Y');

        if(isset($request->YEAR)){
            $year = $request->YEAR;
        }

        $search = trim((string) $request->input('search', ''));
        $perPage = min(max((int) $request->input('per_page', 10), 1), 100);

        $employee = Employee::select(
                'employees.id',
                'employees.name',
                'employees.photo',
                'employees.department_id',
                'employees.division_id'
            )
            ->join('users','employees.user_id','=','users.id')
            ->where('employees.status',"ACTIVE");

        if ($userType !== 'SUPERADMIN') {
            $employee->where('employees.department_id', $currentEmployee?->department_id ?? 0);
        }

        if ($search !== '') {
            $employee->where('employees.name', 'like', '%' . $search . '%');
        }

        $employee = $employee
            ->whereNotIn('users.user_role', ["ADMINISTRATOR", "SUPERADMIN"])
            ->whereNotIn('users.user_type', ["ADMINISTRATOR", "SUPERADMIN"])
            ->orderBy('employees.name')
            ->paginate($perPage);

        $employeeLave = EmployeeLeave::where('year',$year)
            ->whereIn('employee_id',$employee->getCollection()->pluck('id'))
            ->get();

        return response()->json([
                'code' => 200,
                'status' => 'success',
                'data' => [
                    'employees' => $employee->items(),
                    'leaves' => $employeeLave,
                    'pagination' => [
                        'current_page' => $employee->currentPage(),
                        'last_page' => $employee->lastPage(),
                        'per_page' => $employee->perPage(),
                        'total' => $employee->total(),
                        'from' => $employee->firstItem(),
                        'to' => $employee->lastItem(),
                    ],
                ],
                'message' => 'Get employee leave successfully'
        ]);
    }

    public function allEmployeeLeaveRequest(Request $request){

        $user = auth()->user();
        $userId = auth()->user()->id;
        
        $currentEmployee = Employee::where('user_id', $userId)->first();
        
        $userType = strtoupper((string) ($user->user_type ?? ''));
        $userRole = strtoupper((string) ($user->user_role ?? ''));

        $qrySearch = '';

        if(isset($request->SEARCH_QUERY_LEAVE_REQUEST)){
            $qrySearch = $request->SEARCH_QUERY_LEAVE_REQUEST;
        }

        $employeeActive = Employee::select('employees.id')
            ->join('users','employees.user_id','=','users.id')
            ->whereIn('employees.status',["ACTIVE","RESIGN"]);

        if ($userType !== 'SUPERADMIN') {
            $employeeActive->where('employees.department_id', $currentEmployee?->department_id ?? 0);
        }

        $employeeActive = $employeeActive
            ->whereNotIn('users.user_role', ["ADMINISTRATOR", "SUPERADMIN"])
            ->whereNotIn('users.user_type', ["ADMINISTRATOR", "SUPERADMIN"])
            ->get();

        $employeeLeaveRequest = EmployeeLeaveRequest::with('employee')
            ->whereIn('employee_id',$employeeActive->pluck('id'))
            ->whereIn('status',['REQUEST','APPROVED','REJECTED']);

        if($qrySearch <> ''){

            $employeeLeaveRequest = $employeeLeaveRequest->where(function($query) use ($qrySearch){
                $query->where('reason','like','%'.$qrySearch.'%');
                $query->orWhere('reject_reason','like','%'.$qrySearch.'%');
                $query->orWhere('day_amount','like','%'.$qrySearch.'%');
                $query->orWhere('start_date','like','%'.$qrySearch.'%');
                $query->orWhere('end_date','like','%'.$qrySearch.'%');
                $query->orWhere('leave_type','like','%'.$qrySearch.'%');
                $query->orWhereHas('employee',function($query) use ($qrySearch) {
                    $query->where('name', 'like', '%' . $qrySearch . '%');
                });
                //->orWhere('category','like','%'.$searchText.'%');
            });
            

        }

        $employeeLeaveRequest = $employeeLeaveRequest->orderBy('end_date','desc')
        ->paginate(min(max((int) $request->input('per_page', 10), 1), 100));
    
        
        return response()->json([
            'code' => 200,
            'status' => 'success',
            'data' => [
                'employeeLeaveRequest' => $employeeLeaveRequest
            ],
            'message' => 'All request time off'
        ]);
    }

    public function editEmployeeLeaveByYear(Request $request){

        try{

            DB::beginTransaction();
            
            $request->validate([
                'year' => 'required|integer',
                'id_employee' => 'required|integer',
                'annual_leave' => 'required|integer|min:0',
            ]);

            $userId = auth()->user()->id;
            $employeeId = $request->id_employee;
            $yearLeave = $request->year;
            $annualLeave = $request->annual_leave;

            $employeeLeave = EmployeeLeave::where('employee_id',$employeeId)->where('year',$yearLeave)->first();

            if(!$employeeLeave){

                $newEmployeeLeave = new EmployeeLeave();
                $newEmployeeLeave->employee_id = $employeeId;
                $newEmployeeLeave->year = $yearLeave;
                $newEmployeeLeave->annual_leave = $annualLeave;
                $newEmployeeLeave->remaining_annual_leave = $annualLeave;
                $newEmployeeLeave->created_by = $userId;
                $newEmployeeLeave->save();
                
            }else{
                
                $remainingAnnualLeave = $employeeLeave->remaining_annual_leave;
                
                if($annualLeave > $employeeLeave->annual_leave){
                    $remainingAnnualLeave = $employeeLeave->remaining_annual_leave + ($annualLeave - $employeeLeave->annual_leave);
                }
                
                if($annualLeave < $employeeLeave->annual_leave){
                    $remainingAnnualLeave = $employeeLeave->remaining_annual_leave - ($employeeLeave->annual_leave - $annualLeave);
                }

                $employeeLeave->annual_leave = $annualLeave;
                $employeeLeave->remaining_annual_leave = $remainingAnnualLeave;

                $employeeLeave->save();
            }
 
            DB::commit();

            return response()->json([
                'code' => 200,
                'status' => 'success',
                'data' => [],
                'message' => 'Edit leave request successfully'
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
    
    public function approveEmployeeLeaveRequest(Request $request){

        try{

            DB::beginTransaction();
            
            $request->validate([
                'id_leave_request' => 'required|integer',
                'id_employee' => 'required|integer',
            ]);

            $userId = auth()->user()->id;
            $employeeId = $request->id_employee;
            $leaveRequestId = $request->id_leave_request;

            $employeeLeaveRequest = EmployeeLeaveRequest::where('id', $leaveRequestId)
                ->where('employee_id',$employeeId)
            ->first();

            if(!$employeeLeaveRequest){
                throw new \Exception('Leave request not found');
            }

            $yearLeave = Carbon::parse($employeeLeaveRequest->start_date)->format('Y');

            $employeeLeave = EmployeeLeave::where('employee_id',$employeeId)->where('year',$yearLeave)->first();

            if(!$employeeLeave){
                EmployeeLeave::updateOrCreate(
                    [
                        'employee_id' => $employeeId,
                        'year' => $yearLeave,
                    ],
                    [
                        'annual_leave' => 0,
                        'remaining_annual_leave' => 0,
                        'sick' => 0,
                        'created_by' => $userId,
                    ]
                );

                $employeeLeave = EmployeeLeave::where('employee_id',$employeeId)->where('year',$yearLeave)->first();
            }



            if($employeeLeaveRequest->leave_type == 'ANNUAL_LEAVE'){

                if(!$employeeLeave){
                    throw new \Exception('Employee did not have quota leave');
                }
                
                if($employeeLeave->remaining_annual_leave < $employeeLeaveRequest->day_amount){
                    throw new \Exception('Annual leave quota is not enough');
                }

                $employeeLeave->remaining_annual_leave = $employeeLeave->remaining_annual_leave - $employeeLeaveRequest->day_amount;
                $employeeLeave->save();
            }



            if($employeeLeaveRequest->leave_type == 'SICK'){
                $employeeLeave->sick = $employeeLeave->sick + $employeeLeaveRequest->day_amount;
                $employeeLeave->save();
            }

            
            if(!in_array($employeeLeaveRequest->status,['REQUEST','REJECTED']) ){
                throw new \Exception('Time off only can be approve when status is REQUEST');
            }
            
            $employeeLeaveRequest->status = 'APPROVED';
            $employeeLeaveRequest->updated_by = $userId;
            $employeeLeaveRequest->save();

            DB::commit();

            return response()->json([
                'code' => 200,
                'status' => 'success',
                'data' => [],
                'message' => 'Approve leave request successfully'
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

    public function rejectEmployeeLeaveRequest(Request $request){

        try{

            DB::beginTransaction();
            
            $request->validate([
                'id_leave_request' => 'required|integer',
                'id_employee' => 'required|integer',
                'reject_reason' => 'required',
            ]);


            $userId = auth()->user()->id;
            $employeeId = $request->id_employee;
            $leaveRequestId = $request->id_leave_request;
             

            $employeeLeaveRequest = EmployeeLeaveRequest::where('id', $leaveRequestId)
                ->where('employee_id',$employeeId)
            ->first();

            if(!$employeeLeaveRequest){
                throw new \Exception('Time off request not found');
            }

            $employeeLeaveRequest->	reject_reason = $request->reject_reason;
            $employeeLeaveRequest->status = 'REJECTED';
            $employeeLeaveRequest->updated_by = $userId;
            $employeeLeaveRequest->save();

            DB::commit();

            return response()->json([
                'code' => 200,
                'status' => 'success',
                'data' => [],
                'message' => 'Reject leave request successfully'
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
