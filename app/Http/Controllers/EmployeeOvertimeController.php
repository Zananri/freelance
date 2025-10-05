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
    public function allRequest(Request $request){

        $user = auth()->user();
        $employee = Employee::where('user_id', $user->id)->first();

        $employeeOvertime = EmployeeOvertime::where('employee_id',$employee->id)
            ->whereIn('status',['REQUEST','APPROVED','REJECTED','REQUEST_SUBMIT'])
            ->orderBy('created_at','desc')
        ->get();


        return response()->json([
            'code' => 200,
            'status' => 'success',
            'data' => [
                'employeeOvertime' => $employeeOvertime
            ],
            'message' => 'All request overtime'
        ]);
    }

    public function submitNewRequest(Request $request){

        try{

            DB::beginTransaction();
            
            $request->validate([
                'overtime_photo_start' => 'required|file|mimes:jpg,jpeg,png,gif|max:10048',
                'description' => 'required'
            ]);


            $user = auth()->user();

            $now = Carbon::now();
            $today = Carbon::today()->toDateString();

            
            $employee = Employee::with('division', 'department', 'job','grade','shift',)->where('user_id', $user->id)->first();
            
            $checkTodayOvertime = EmployeeOvertime::where('employee_id',$employee->id)
                ->where('date_overtime',$today)
            ->first();

            if($checkTodayOvertime){
                throw new \Exception('Overtime '.$now->format('D j M Y').' already started');
            }
            

            $photoStart = '';
            

            $destinationPath = public_path('file/overtime');

            if (!file_exists($destinationPath)) { mkdir($destinationPath, 0777, true); }

            if ($request->hasFile('overtime_photo_start')) {

                $reqPhotoStart = $request->file('overtime_photo_start');
                $fileExtension = $reqPhotoStart->getClientOriginalExtension();
                $fileName = 'OVERTIME_'.$employee->id.'_'.time().'.'.$fileExtension;

                $reqPhotoStart->move($destinationPath, $fileName);

                $photoStart = 'file/overtime/'.$fileName;
            }
 
            // 'employee_id','status',
            // 'description','date_overtime','time_start','time_end','total_overtime',
            
            // 'photo_start','photo_end','location_start','location_end',
            // 'reject_note','created_by','updated_by','reject_by',
            // 'approve_by','approve_at','reject_at'
            
            $employeeOvertime = new EmployeeOvertime();

                $employeeOvertime->employee_id = $employee->id;
                $employeeOvertime->status = 'REQUEST';
                $employeeOvertime->description = $request->description;
                $employeeOvertime->date_overtime = $today;
                $employeeOvertime->time_start = $now->format('H:i');
                $employeeOvertime->photo_start = $photoStart;

                $employeeOvertime->created_by = $user->id;
                $employeeOvertime->updated_by = $user->id;

            $employeeOvertime->save();



            DB::commit();

            return response()->json([
                'code' => 200,
                'status' => 'success',
                'data' => [],
                'message' => 'Overtime request started'
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

    public function submitStopOvertime(Request $request){

        try{

            DB::beginTransaction();
            
            $request->validate([
                'overtime_id' => 'required|integer',
                'overtime_photo_stop' => 'required|file|mimes:jpg,jpeg,png,gif|max:10048'
            ]);


            $user = auth()->user();

            $now = Carbon::now();
            $today = Carbon::today()->toDateString();

            
            $employee = Employee::with('division', 'department', 'job','grade','shift',)->where('user_id', $user->id)->first();
            
            $existOvertime = EmployeeOvertime::where('employee_id',$employee->id)
                ->where('id',$request->overtime_id)
                ->where('status','REQUEST')
            ->first();

            if(!$existOvertime){
                throw new \Exception('Overtime not started');
            }

            $photoEnd = '';
            

            $destinationPath = public_path('file/overtime');

            if (!file_exists($destinationPath)) { mkdir($destinationPath, 0777, true); }

            if ($request->hasFile('overtime_photo_stop')) {

                $reqPhotoStop = $request->file('overtime_photo_stop');
                $fileExtension = $reqPhotoStop->getClientOriginalExtension();
                $fileName = 'OVERTIME_'.$employee->id.'_'.time().'.'.$fileExtension;

                $reqPhotoStop->move($destinationPath, $fileName);

                $photoEnd = 'file/overtime/'.$fileName;
            }
   
            $timeStart = Carbon::parse($existOvertime->time_start);
            $totalOvertime = $timeStart->diff(Carbon::now())->format('%H:%I');
            
            $existOvertime->total_overtime = $totalOvertime;
            $existOvertime->status = 'REQUEST_SUBMIT';
            $existOvertime->time_end = $now->format('H:i');
            $existOvertime->photo_end = $photoEnd;

            $existOvertime->updated_by = $user->id;

            $existOvertime->save();



            DB::commit();

            return response()->json([
                'code' => 200,
                'status' => 'success',
                'data' => [],
                'message' => 'Overtime stop successfully'
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
