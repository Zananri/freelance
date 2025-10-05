<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

use Carbon\Carbon;

use App\Models\Employee;
use App\Models\EmployeeLeave;
use App\Models\EmployeeLeaveRequest;


class EmployeeTimeOffController extends Controller
{
    public function allRequest(Request $request){

        $user = auth()->user();
        $employee = Employee::where('user_id', $user->id)->first();

        $employeeLeaveRequest = EmployeeLeaveRequest::where('employee_id',$employee->id)
            ->whereIn('status',['REQUEST','APPROVED','REJECTED'])
            ->orderBy('created_at','desc')
        ->get();


        return response()->json([
            'code' => 200,
            'status' => 'success',
            'data' => [
                'employeeLeaveRequest' => $employeeLeaveRequest
            ],
            'message' => 'All request time off'
        ]);
    }

    public function submitNewRequest(Request $request){

        try{

            DB::beginTransaction();
            
            $request->validate([
                'leave_type' => 'required',
                'description' => 'required',

                'start_date' => 'required|date',
                'end_date' => 'required|date|after_or_equal:start_date',

                'file_1' => 'required|file|mimes:pdf,doc,docx,jpg,jpeg,png,gif|max:10048',
                'file_2' => 'nullable|file|mimes:pdf,doc,docx,jpg,jpeg,png,gif|max:10048',
            ]);


            $user = auth()->user();

            $now = Carbon::now();
            $today = Carbon::today()->toDateString();

            $employee = Employee::with('division', 'department', 'job','grade','shift',)->where('user_id', $user->id)->first();
            $employeeLeave = EmployeeLeave::where('employee_id',$employee->id)->where('year',date('Y'))->first();
            
            $startDate = Carbon::parse($request->input('start_date'));
            $endDate = Carbon::parse($request->input('end_date'));

            $dayAmount = $startDate->diffInDays($endDate) + 1;

            if($request->leave_type == 'ANNUAL_LEAVE' &&  $dayAmount > $employeeLeave->remaining_annual_leave){
                throw new \Exception('Annual leave quota is not enough, remaining annual leave is '.$employeeLeave->remaining_annual_leave);
            }

            $file1 = '';
            $file2 = '';

            $destinationPath = public_path('file/leave_request');

            if (!file_exists($destinationPath)) { mkdir($destinationPath, 0777, true); }

            if ($request->hasFile('file_1')) {

                $reqFile1 = $request->file('file_1');
                $file1Extension = $reqFile1->getClientOriginalExtension();
                $file1Name = 'LEAVE_REQUEST_'.$employee->id.'_'.time().'.'.$file1Extension;

                $reqFile1->move($destinationPath, $file1Name);

                $file1 = 'file/leave_request/'.$file1Name;
            }

            if ($request->hasFile('file_2')) {

                $reqFile2 = $request->file('file_2');
                $file2Extension = $reqFile2->getClientOriginalExtension();
                $file2Name = 'LEAVE_REQUEST_'.$employee->id.'_'.time().'_2.'.$file2Extension;

                $reqFile2->move($destinationPath, $file2Name);

                $file2 = 'file/leave_request/'.$file2Name;
            }
            

            //throw new \Exception('File 1 '.$file1.' '.'File 2'.$file2);

            //employee_id leave_type reason start_date end_date day_amount file_1 file_2 status created_by updated_by 



            
            $leaveRequest = new EmployeeLeaveRequest();

                $leaveRequest->employee_id = $employee->id;
                $leaveRequest->leave_type = $request->leave_type;
                $leaveRequest->reason = $request->description;
                $leaveRequest->start_date = $startDate->toDateString();
                $leaveRequest->end_date = $endDate->toDateString();
                $leaveRequest->day_amount = $dayAmount;
                $leaveRequest->file_1 = $file1;
                $leaveRequest->file_2 = $file2;
                $leaveRequest->status = 'REQUEST';
                $leaveRequest->created_by = $user->id;
                $leaveRequest->updated_by = $user->id;

            $leaveRequest->save();



            //leave_type start_date end_date description file_pdf file_photo

            DB::commit();

            return response()->json([
                'code' => 200,
                'status' => 'success',
                'data' => [],
                'message' => 'Request time off successfully'
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

    public function editTimeOff(Request $request){

        try{

            DB::beginTransaction();
            
            $request->validate([
                'id_time_off' => 'required|integer',
                'leave_type' => 'required',
                'description' => 'required',

                'start_date' => 'required|date',
                'end_date' => 'required|date|after_or_equal:start_date',

                'file_1' => 'nullable|file|mimes:pdf,doc,docx,jpg,jpeg,png,gif|max:10048',
                'file_2' => 'nullable|file|mimes:pdf,doc,docx,jpg,jpeg,png,gif|max:10048',
            ]);


            $user = auth()->user();

            $employee = Employee::with('division', 'department', 'job','grade','shift',)->where('user_id', $user->id)->first();
            $employeeLeave = EmployeeLeave::where('employee_id',$employee->id)->where('year',date('Y'))->first();

            $employeeLeaveRequest = EmployeeLeaveRequest::where('id', $request->input('id_time_off'))
                ->where('employee_id',$employee->id)
            ->first();

            if(!$employeeLeaveRequest){
                throw new \Exception('Time off request not found');
            }
            
            if($employeeLeaveRequest->status != 'REQUEST' ){
                throw new \Exception('Time off only can be edit when status is REQUEST');
            }
            
            $startDate = Carbon::parse($request->input('start_date'));
            $endDate = Carbon::parse($request->input('end_date'));

            $dayAmount = $startDate->diffInDays($endDate) + 1;

            
            if($request->leave_type == 'ANNUAL_LEAVE' &&  $dayAmount > $employeeLeave->remaining_annual_leave){
                throw new \Exception('Annual leave quota is not enough');
            }

            $file1 = $employeeLeaveRequest->file_1;
            $file2 = $employeeLeaveRequest->file_2;

            if(!isset($request->old_file_1)){
                $file1 = '';

                $oldFile1 = public_path($employeeLeaveRequest->file_1);
                if (file_exists($oldFile1)) { @unlink($oldFile1); }
            }

            if(!isset($request->old_file_2)){
                $file2 = '';

                $oldFile2 = public_path($employeeLeaveRequest->file_2);
                if (file_exists($oldFile2)) { @unlink($oldFile2); }
            }
            

            $destinationPath = public_path('file/leave_request');

            if (!file_exists($destinationPath)) { mkdir($destinationPath, 0777, true); }

            if ($request->hasFile('file_1')) {

                $reqFile1 = $request->file('file_1');
                $file1Extension = $reqFile1->getClientOriginalExtension();
                $file1Name = 'LEAVE_REQUEST_'.$employee->id.'_'.time().'.'.$file1Extension;

                $reqFile1->move($destinationPath, $file1Name);

                $oldPath1 = public_path($file1);

                if (file_exists($oldPath1)) { @unlink($oldPath1); }

                $file1 = 'file/leave_request/'.$file1Name;


            }

            if ($request->hasFile('file_2')) {

                $reqFile2 = $request->file('file_2');
                $file2Extension = $reqFile2->getClientOriginalExtension();
                $file2Name = 'LEAVE_REQUEST_'.$employee->id.'_'.time().'_2.'.$file2Extension;

                $reqFile2->move($destinationPath, $file2Name);

                $oldPath2 = public_path($file2);
                
                if (file_exists($oldPath2)) { @unlink($oldPath2); }

                $file2 = 'file/leave_request/'.$file2Name;
            }

            //throw new \Exception('File 1 '.$file1.' '.'File 2'.$file2);
            
            $employeeLeaveRequest->leave_type = $request->leave_type;
            $employeeLeaveRequest->reason = $request->description;
            $employeeLeaveRequest->start_date = $startDate->toDateString();
            $employeeLeaveRequest->end_date = $endDate->toDateString();
            $employeeLeaveRequest->day_amount = $dayAmount;
            $employeeLeaveRequest->file_1 = $file1;
            $employeeLeaveRequest->file_2 = $file2;
            $employeeLeaveRequest->updated_by = $user->id;

            $employeeLeaveRequest->save();

            DB::commit();

            return response()->json([
                'code' => 200,
                'status' => 'success',
                'data' => [],
                'message' => 'Edit time off successfully'
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

    public function deleteTimeOff(Request $request){

        try{

            DB::beginTransaction();
            
            $request->validate([
                'id_time_off' => 'required|integer'
            ]);


            $user = auth()->user();

            $employee = Employee::with('division', 'department', 'job','grade','shift',)->where('user_id', $user->id)->first();
            $employeeLeave = EmployeeLeave::where('employee_id',$employee->id)->where('year',date('Y'))->first();

            $employeeLeaveRequest = EmployeeLeaveRequest::where('id', $request->input('id_time_off'))
                ->where('employee_id',$employee->id)
            ->first();

            if(!$employeeLeaveRequest){
                throw new \Exception('Time off request not found');
            }
            
            if($employeeLeaveRequest->status != 'REQUEST' ){
                throw new \Exception('Time off only can be delete when status is REQUEST');
            }
            
            $employeeLeaveRequest->status = 'DELETED';
            $employeeLeaveRequest->deleted_by = $user->id;
            $employeeLeaveRequest->save();

            DB::commit();

            return response()->json([
                'code' => 200,
                'status' => 'success',
                'data' => [],
                'message' => 'Delete time off successfully'
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
