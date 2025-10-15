<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

use Carbon\Carbon;

use App\Models\User;
use App\Models\Employee;
use App\Models\EmployeeCalendar;
use App\Models\EmployeeCalendarShare;

class EmployeeCalendarController extends Controller
{
    //
    public function showCalendarPage()
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
        
        return view('calendar.calendar',
            [
                'employee' => $employee,
                'current_employee' => $currentEmployee
            ]
        );
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

        
        $employeeEventIds = EmployeeCalendar::where('employee_id',$employee->id)
            ->where('date_event', '>=', $firstDayOfMonth)
            ->where('date_event', '<=', $lastDayOfMonth)
        ->pluck('id');

        $employeeEventShareIds = EmployeeCalendarShare::where('employee_id',$employee->id)
        ->pluck('employee_calendar_id');

        $publicEventIds = EmployeeCalendar::where('share_to', 'PUBLIC')
            ->where('employee_id','<>',$employee->id)
            ->where('date_event', '>=', $firstDayOfMonth)
            ->where('date_event', '<=', $lastDayOfMonth)
        ->pluck('id');

        $allEvenId = [];
        
        foreach($employeeEventIds as $item){
            array_push($allEvenId,$item);
        }

        foreach($employeeEventShareIds as $item){
            array_push($allEvenId,$item);
        }

        foreach($publicEventIds as $item){
            array_push($allEvenId,$item);
        }
        

        $employeeCalendar = EmployeeCalendar::with('employee')
            ->whereIn('id',$allEvenId)
            ->where('status', '<>', 'DELETED')
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

    public function eventEmployeeDetail(Request $request){

        try{

        
            $eventId = 0;
            $employeeId = 0;

            if (isset($request->EVENT_ID)) {
                $eventId = $request->EVENT_ID;
            }

            if (isset($request->EMPLOYEE_ID)) {
                $employeeId = $request->EMPLOYEE_ID;
            }
            

            $user = auth()->user();
            $employee = Employee::where('user_id', $user->id)->first();

            $employeeCalendar = EmployeeCalendar::where('id',$eventId)
                ->where('employee_id',$employeeId)
                ->where('status','<>','DELETED')
            ->first();

            if(!$employeeCalendar){
                throw new \Exception('Event not found 2');
            }

            if($employee->id != $employeeId && $employeeCalendar->share_to != 'PUBLIC' ){
                
                $checkShare = EmployeeCalendarShare::where('employee_calendar_id',$eventId)->where('employee_id',$employee->id)->first();
                
                if(!$checkShare){
                    throw new \Exception('Event not found 2');
                }
            
            }

            $employeeCalendar = EmployeeCalendar::with('employee')
                ->where('id',$eventId)
                ->where('employee_id',$employeeId)
                ->where('status','<>','DELETED')
            ->first();


            if(!$employeeCalendar){
                throw new \Exception('Event not found');
            }

            $employeeCalendarShare = EmployeeCalendarShare::where('employee_calendar_id',$employeeCalendar->id)->get();


            return response()->json([
                'code' => 200,
                'status' => 'success',
                'data' => [
                    'employeeCalendar' => $employeeCalendar,
                    'employeeCalendarShare' => $employeeCalendarShare
                ],
                'message' => 'Get detail successfully'
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
            
            $startTime = Carbon::now()->format('H:i:s');
            
            if($request->start_time){
                $startTime = $request->start_time.':00';
            }


            $endTime = $startTime;

            if($request->end_time){
                $endTime = $request->end_time.':00';
            }

            
            $employeeCalendar = new EmployeeCalendar();

                $employeeCalendar->employee_id = $employee->id;
                $employeeCalendar->share_to = $request->event_share_to;
                $employeeCalendar->status = 'ACTIVE';
                $employeeCalendar->title_event = $request->event_title;
                $employeeCalendar->description = $request->event_description;
                $employeeCalendar->date_event = $request->start_date;
                $employeeCalendar->end_date_event = $request->end_date;
                $employeeCalendar->start_time = $startTime;
                $employeeCalendar->end_time = $endTime;
                $employeeCalendar->color_event = $request->event_color;
                
                $employeeCalendar->created_by = $user->id;
                $employeeCalendar->updated_by = $user->id;

            $employeeCalendar->save();

            //
            
            $arrEmployeeId = [];

            if(isset($request->employee_share_id)){
                $arrEmployeeId = explode(",",$request->employee_share_id);
            }

            /**
             * Run the migrations.
             * employee_calendar_shares :
             * id employee_calendar_id employee_id role created_by updated_by
            */
        
            for ($i=0; $i < count($arrEmployeeId); $i++) { 

                $employeeCalendarShare = new EmployeeCalendarShare();
                $employeeCalendarShare->employee_calendar_id = $employeeCalendar->id;
                $employeeCalendarShare->employee_id = $arrEmployeeId[$i];
                $employeeCalendarShare->role = 'VIEWER';
                $employeeCalendarShare->created_by = $user->id;

                $employeeCalendarShare->save();
            }

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
    public function editEmployeeEvent(Request $request){

        try{
 
            DB::beginTransaction();

            $request->validate([
                'event_id' => 'required',
                'employee_id' => 'required',
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


            if($employee->id != $request->employee_id){
                throw new \Exception('Employee Event not found');
            }
            
            $employeeCalendar = EmployeeCalendar::where('id',$request->event_id)->where('employee_id',$employee->id)->first();

                if(!$employeeCalendar){
                    throw new \Exception('Event not found');
                }
                 
                if($request->start_time){
                    $startTime = Carbon::parse($request->start_time)->format('H:i:s');
                    $employeeCalendar->start_time = $startTime;
                }
 
                if($request->end_time){
                    $endTime = Carbon::parse($request->end_time)->format('H:i:s');
                    $employeeCalendar->end_time = $endTime;
                }
                
                $employeeCalendar->share_to = $request->event_share_to;
                $employeeCalendar->title_event = $request->event_title;
                $employeeCalendar->description = $request->event_description;
                $employeeCalendar->date_event = $request->start_date;
                $employeeCalendar->end_date_event = $request->end_date;
                $employeeCalendar->color_event = $request->event_color;
                 
                $employeeCalendar->updated_by = $user->id;

            $employeeCalendar->save();
            
            EmployeeCalendarShare::where('employee_calendar_id',$employeeCalendar->id)->delete();

            $arrEmployeeId = [];

            if(isset($request->employee_share_id)){
                $arrEmployeeId = explode(",",$request->employee_share_id);
            }

            for ($i=0; $i < count($arrEmployeeId); $i++) { 

                $employeeCalendarShare = new EmployeeCalendarShare();
                $employeeCalendarShare->employee_calendar_id = $employeeCalendar->id;
                $employeeCalendarShare->employee_id = $arrEmployeeId[$i];
                $employeeCalendarShare->role = 'VIEWER';
                $employeeCalendarShare->created_by = $user->id;

                $employeeCalendarShare->save();
            }

            DB::commit();

            return response()->json([
                'code' => 200,
                'status' => 'success',
                'data' => [
                    'event' => $employeeCalendar
                ],
                'message' => 'Edit event successfully'
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
    public function deleteEmployeeEvent(Request $request){

        try{
 

            $request->validate([
                'event_id' => 'required',
                'employee_id' => 'required'
            ]);

 
            $user = auth()->user();

            $employee = Employee::with('division', 'department', 'job','grade','shift',)->where('user_id', $user->id)->first();


            if($employee->id != $request->employee_id){
                throw new \Exception('Employee Event not found');
            }
            
            $employeeCalendar = EmployeeCalendar::where('id',$request->event_id)->where('employee_id',$employee->id)->first();

                if(!$employeeCalendar){
                    throw new \Exception('Event not found');
                }
                  
                
                $employeeCalendar->status = 'DELETED';
                $employeeCalendar->updated_by = $user->id;

            $employeeCalendar->save();
 

            return response()->json([
                'code' => 200,
                'status' => 'success',
                'data' => [],
                'message' => 'Delete event successfully'
            ]);

        }catch (\Exception $e) {
 
            
            return response()->json([
                'code' => 500,
                'status' => 'error',
                'data' => [],
                'message' => $e->getMessage()
            ], 500);
        }
    }
}
