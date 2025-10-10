<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

use Carbon\Carbon;

use App\Models\User;
use App\Models\Employee;
use App\Models\EmployeeCalendar;

class EmployeeCalendarController extends Controller
{
    //
    public function showCalendarPage()
    {
        return view('calendar.calendar');
    }

    public function allEventEmployeeCalendarByMonth(Request $request){

        $now = Carbon::now();
        $today = Carbon::today()->toDateString();



        $year = $now->format('Y');
        $month = $now->format('m');

        if (isset($request->MONTH)) {
            $month = $request->MONTH;
        }

        if (isset($request->YEAR)) {
            $year = $request->YEAR;
        }
        
        $firstDayOfMonth = Carbon::create($year, $month, 1)->startOfMonth()->toDateString();
        $lastDayOfMonth = Carbon::create($year, $month, 1)->endOfMonth()->toDateString();
        

        $user = auth()->user();
        $employee = Employee::where('user_id', $user->id)->first();

        $employeeCalendar = EmployeeCalendar::where('employee_id',$employee->id)
            ->where('status','<>','DELETED')
            ->where('date_event', '>=', $firstDayOfMonth)
            ->where('date_event', '<=', $lastDayOfMonth)
            ->orderBy('date_event','desc')
        ->get();


        return response()->json([
            'code' => 200,
            'status' => 'success',
            'data' => [
                'employeeCalendar' => $employeeCalendar
            ],
            'message' => 'All Employee Calendar'
        ]);
    }

    /*
        * employee_calendars : 
        * employee_id share_to status title_event description date_event end_date_event start_time end_time color_event
        * image file_1 file_2 file_3 file_4 file_5 created_by updated_by created_at updated_at
        *
    */

    public function newEmployeeEvent(Request $request){

        try{

            DB::beginTransaction();
            

            $request->validate([
                'event_title' => 'required',
                'start_date' => 'required|date',
                'end_date' => 'required|date|after_or_equal:start_date',
                'event_color' => 'required',
            ]);


            // event_title event_description start_date end_date start_time end_time

            $user = auth()->user();

            $now = Carbon::now();
            $today = Carbon::today()->toDateString();

            
            $employee = Employee::with('division', 'department', 'job','grade','shift',)->where('user_id', $user->id)->first();
            
            
            $employeeCalendar = new EmployeeCalendar();

                $employeeCalendar->employee_id = $employee->id;
                $employeeCalendar->share_to = 'PRIVATE';
                $employeeCalendar->status = 'ACTIVE';
                $employeeCalendar->title_event = $request->event_title;
                $employeeCalendar->description = $request->event_description;
                $employeeCalendar->date_event = $request->start_date;
                $employeeCalendar->end_date_event = $request->end_date;
                $employeeCalendar->start_time = $request->start_time.':00';
                $employeeCalendar->end_time = $request->end_time.':00';
                $employeeCalendar->color_event = $request->event_color;
                
                $employeeCalendar->created_by = $user->id;
                $employeeCalendar->updated_by = $user->id;

            $employeeCalendar->save();

            DB::commit();

            return response()->json([
                'code' => 200,
                'status' => 'success',
                'data' => [],
                'message' => 'New event created successfully'
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
