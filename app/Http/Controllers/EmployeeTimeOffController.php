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
    public function newRequestTimeOff(){
        try{
            DB::beginTransaction();

            
            $request->validate([
                'leave_type' => 'required',
                'description' => 'required',

                'start_date' => 'required|date',
                'end_date' => 'required|date',

                'file_pdf' => 'nullable|file|mimes:pdf|max:10048',
                'file_photo' => 'nullable|image|mimes:jpeg,png,jpg|max:10048'
                ,
            ]);


            $user = auth()->user();

            $now = Carbon::now();
            $today = Carbon::today()->toDateString();

            $employee = Employee::with('division', 'department', 'job','grade','shift')->where('user_id', $user->id)->first();
    


            //leave_type start_date end_date description file_pdf file_photo

            DB::commit();

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
