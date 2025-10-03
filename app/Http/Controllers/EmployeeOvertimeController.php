<?php

namespace App\Http\Controllers;


use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

use Carbon\Carbon;

use App\Models\Employee;
use App\Models\EmployeeOvertime;

class EmployeeOvertimeController extends Controller
{
    public function submitNewOvertime(Request $request){

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
            
            $checkTodayOvertime = EmployeeOvertime::where('employee_id',$employee->id)->first();

            if($checkTodayOvertime){
                throw new \Exception('Overtime '.$now->format('D j M Y').' already started');
            }
            

            $photoStart = '';
            

            $destinationPath = public_path('file/overtime');

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
}
