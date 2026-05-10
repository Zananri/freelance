<?php

namespace App\Http\Controllers;

use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

use App\Helpers\EmployeeHelper;

use App\Models\Attendance;
use App\Models\Department;
use App\Models\Division;
use App\Models\Employee;
use App\Models\EmployeeSalary;
use App\Models\EmployeePayslip;
use App\Models\EmployeeLeaveRequest;

use PDF;



class SalaryPayslipController extends Controller
{

    public function generatePDFPayslipEX()
    {
        $users = User::get();

        $data = [
            'title' => 'Welcome to ItSolutionStuff.com',
            'date' => date('m/d/Y'),
            'users' => $users
        ]; 
                
        $pdf = PDF::loadView('myPDF', $data);
        $pdf->setPaper('A4', 'portrait');

        return $pdf->download('itsolutionstuff.pdf');
    }

    public function downloadPDFPayslip($employeeId,$year,$month){
    
        
        $firstDayOfMonth = Carbon::create($year, $month, 1)->startOfMonth()->toDateString();
        $lastDayOfMonth = Carbon::create($year, $month, 1)->endOfMonth()->toDateString();

        $employee = Employee::with('department','division','job','grade')->where('id',$employeeId)->first();

        if(!$employee){
            return '<h4>Employee not found</h4>';
        }
        
        $employeePayslip = EmployeePayslip::with('employee')
            ->where('date_salary','>=',$firstDayOfMonth)
            ->where('date_salary','<=',$lastDayOfMonth)
            ->where('status','ACTIVE')
        ->where('employee_id',$employeeId)->first();

        if(!$employeePayslip){
            return '<h4>Payslip not generate</h4>';
        }

        $employeeSalary = EmployeeSalary::with('employee')->where('employee_id',$employeeId)->first();
        
        $employeeAttendanceAll = Attendance::select('employee_id', DB::raw('count(*) as total_attendance'))
            ->where('date_attendance', '<=', $lastDayOfMonth)
            ->where('date_attendance', '>=', $firstDayOfMonth)
            ->where('status','<>', 'ABSENT')
            ->where('employee_id', $employeeId)
            ->groupBy('employee_id')
        ->get();

        $employeeAttendanceAbsent = Attendance::select('employee_id', DB::raw('count(*) as total_attendance'))
            ->where('date_attendance', '<=', $lastDayOfMonth)
            ->where('date_attendance', '>=', $firstDayOfMonth)
            ->where('status','ABSENT')
            ->where('employee_id', $employeeId)
            ->groupBy('employee_id')
        ->get();

        $totalActiveDay = $this->getActiveDay($firstDayOfMonth,$lastDayOfMonth);

        $dateSalary = Carbon::create($year, $month, 1)->format('F Y');
        
        $workPeriod = '';

        if($employee->hire_date != null){
            $hireDate = Carbon::parse($employee->hire_date);
            $toSalaryDate = Carbon::create($year, $month, 1);

            $monthBetween = $hireDate->diffInMonths($toSalaryDate);

            $workPeriod = intval($monthBetween/12).' Tahun '.intval($monthBetween % 12).' Bulan';
        }

        


        $data = [
            'workPeriod'       => $workPeriod,
            'downloadPayslip'  => 1,
            'yearSalary'       => $year,
            'dateSalary'       => $dateSalary,
            'totalActiveDay'    => $totalActiveDay,
            'employee'          => $employee,
            'employeeSalary'    => $employeeSalary,
            'employeePayslip'   => $employeePayslip,
            'employeeAttendanceAll'     => $employeeAttendanceAll,
            'employeeAttendanceAbsent'  => $employeeAttendanceAbsent
        ];

        $pdf = PDF::loadView('employee.view_payslip', $data)->setPaper('A4', 'portrait');
        
        return $pdf->download('payslipEmployee.pdf');            
    }

    public function viewPDFPayslip($employeeId,$year,$month){
    
        
        $firstDayOfMonth = Carbon::create($year, $month, 1)->startOfMonth()->toDateString();
        $lastDayOfMonth = Carbon::create($year, $month, 1)->endOfMonth()->toDateString();

        $employee = Employee::with('department','division','job','grade')->where('id',$employeeId)->first();

        if(!$employee){
            return '<h4>Employee not found</h4>';
        }
        
        $employeePayslip = EmployeePayslip::with('employee')
            ->where('date_salary','>=',$firstDayOfMonth)
            ->where('date_salary','<=',$lastDayOfMonth)
            ->where('status','<>','DELETED')
        ->where('employee_id',$employeeId)->first();

        if(!$employeePayslip){
            return '<h4>Payslip not generate</h4>';
        }

        $employeeSalary = EmployeeSalary::with('employee')->where('employee_id',$employeeId)->first();
        
        $employeeAttendanceAll = Attendance::select('employee_id', DB::raw('count(*) as total_attendance'))
            ->where('date_attendance', '<=', $lastDayOfMonth)
            ->where('date_attendance', '>=', $firstDayOfMonth)
            ->where('status','<>', 'ABSENT')
            ->where('employee_id', $employeeId)
            ->groupBy('employee_id')
        ->get();


        $employeeAttendanceAbsent = Attendance::select('employee_id', DB::raw('count(*) as total_attendance'))
            ->where('date_attendance', '<=', $lastDayOfMonth)
            ->where('date_attendance', '>=', $firstDayOfMonth)
            ->where('status','ABSENT')
            ->where('employee_id', $employeeId)
            ->groupBy('employee_id')
        ->get();

        $employeeAttendanceNotComplete = Attendance::select('employee_id', DB::raw('count(*) as total_attendance'))
            ->where('date_attendance', '<=', $lastDayOfMonth)
            ->where('date_attendance', '>=', $firstDayOfMonth)
            ->where('employee_id', $employeeId)
            ->where(function ($query) {
                $query->whereNull('time_in')
                      ->orWhere('time_in', '00:00:00')
                      ->orWhereNull('time_out')
                      ->orWhere('time_out', '00:00:00');
            })
            ->where('status','<>','ABSENT')
            ->groupBy('employee_id')
        ->get()->pluck('total_attendance');

        $totalActiveDay = $this->getActiveDay($firstDayOfMonth,$lastDayOfMonth);

        $dateSalary = Carbon::create($year, $month, 1)->format('F Y');
        
        $workPeriod = '';
        
        if($employee->hire_date != null){
            $hireDate = Carbon::parse($employee->hire_date);
            $toSalaryDate = Carbon::create($year, $month, 1);

            $monthBetween = $hireDate->diffInMonths($toSalaryDate);

            $workPeriod = intval($monthBetween/12).' Tahun '.intval($monthBetween % 12).' Bulan';
        }

        $employeeLeaveSick = EmployeeLeaveRequest::select('employee_id', DB::raw('sum(day_amount) as total_leave'))
            ->where('start_date', '<=', $lastDayOfMonth)
            ->where('start_date', '>=', $firstDayOfMonth)
            ->where('employee_id', $employeeId)
            ->where('leave_type', 'SICK')
            ->where('status','APPROVED')
            ->groupBy('employee_id')
        ->get()->pluck('total_leave');

        $employeeLeaveSick = $employeeLeaveSick[0] ?? 0;
        
        $employeeAnnualLeave = EmployeeLeaveRequest::select('employee_id', DB::raw('sum(day_amount) as total_leave'))
            ->where('start_date', '<=', $lastDayOfMonth)
            ->where('start_date', '>=', $firstDayOfMonth)
            ->where('employee_id', $employeeId)
            ->where('leave_type', 'ANNUAL_LEAVE')
            ->where('status','APPROVED')
            ->groupBy('employee_id')
        ->get()->pluck('total_leave');

        $employeeAnnualLeave = $employeeAnnualLeave[0] ?? 0;

        $data = [
            'workPeriod'       => $workPeriod, 
            'downloadPayslip'  => 1,
            'yearSalary'       => $year,
            'dateSalary'       => $dateSalary,
            'totalActiveDay'    => $totalActiveDay,
            'employee'          => $employee,
            'employeeSalary'    => $employeeSalary,
            'employeePayslip'   => $employeePayslip,
            'employeeAttendanceAll'     => $employeeAttendanceAll,
            'employeeAttendanceAbsent'  => $employeeAttendanceAbsent,
            'employeeAttendanceNotComplete'  => $employeeAttendanceNotComplete,
            'employeeLeaveSick' => $employeeLeaveSick,
            'employeeAnnualLeave' => $employeeAnnualLeave
        ];

        // $totalPendapatan1 =
        //     $employeePayslip->basic_salary +
        //     $employeePayslip->meal_allowance +
        //     $employeePayslip->transportation_allowance +
        //     $employeePayslip->internet_phone_allowance +
        //     $employeePayslip->positional_allowance;

        // $totalPendapatan2 =
        //     $employeePayslip->prorate_basic_salary +
        //     $employeePayslip->prorate_meal_allowance +
        //     $employeePayslip->prorate_transportation_allowance +
        //     $employeePayslip->prorate_internet_phone_allowance +
        //     $employeePayslip->prorate_positional_allowance +
        //     $employeePayslip->bonus +
        //     $employeePayslip->thr +
        //     $employeePayslip->overtime;

        // $totalPendapatan2excBonusOvertime =
        //     $totalPendapatan1 -
        //     $employeePayslip->prorate_basic_salary -
        //     $employeePayslip->prorate_meal_allowance -
        //     $employeePayslip->prorate_transportation_allowance -
        //     $employeePayslip->prorate_internet_phone_allowance -
        //     $employeePayslip->prorate_positional_allowance;

        // $totalPengurangan =
        //     (($employeeAttendanceNotComplete[0] ?? 0) * 50000) +
        //     $employeePayslip->deduction +
        //     $totalPendapatan2excBonusOvertime;

        // dd([
        //     'attendance_not_complete' => $employeeAttendanceNotComplete,

        //     'basic_salary' => $employeePayslip->basic_salary,
        //     'meal_allowance' => $employeePayslip->meal_allowance,
        //     'transportation_allowance' => $employeePayslip->transportation_allowance,
        //     'internet_phone_allowance' => $employeePayslip->internet_phone_allowance,
        //     'positional_allowance' => $employeePayslip->positional_allowance,

        //     'prorate_basic_salary' => $employeePayslip->prorate_basic_salary,
        //     'prorate_meal_allowance' => $employeePayslip->prorate_meal_allowance,
        //     'prorate_transportation_allowance' => $employeePayslip->prorate_transportation_allowance,
        //     'prorate_internet_phone_allowance' => $employeePayslip->prorate_internet_phone_allowance,
        //     'prorate_positional_allowance' => $employeePayslip->prorate_positional_allowance,

        //     'bonus' => $employeePayslip->bonus,
        //     'thr' => $employeePayslip->thr,
        //     'overtime' => $employeePayslip->overtime,

        //     'deduction' => $employeePayslip->deduction,

        //     'totalPendapatan1' => $totalPendapatan1,
        //     'totalPendapatan2' => $totalPendapatan2,
        //     'totalPendapatan2excBonusOvertime' => $totalPendapatan2excBonusOvertime,
        //     'totalPengurangan' => $totalPengurangan,
        // ]);

        $pdf = PDF::loadView('employee.view_payslip', $data)->setPaper('A4', 'portrait');
        
        return $pdf->stream('payslipEmployee.pdf');            
    }


    public function showSalaryPayslipPage()
    {
        $user = auth()->user();
        $userId = auth()->user()->id;
        
        $employeeActiveIds = EmployeeHelper::EmployeeActiveIds();
        
        $employee = Employee::select('employees.id','employees.user_id','employees.name','employees.status','employees.photo',
                'employees.department_id','employees.division_id',
                'job_list.job_name'
            )
            ->join('job_list','employees.job_id','=','job_list.id')
            ->join('users','employees.user_id','=','users.id')
            ->where('employees.status',"ACTIVE")
            ->whereIn('employees.id',$employeeActiveIds)
        ->get();

        $department = Department::where('status','ACTIVE')->get();
        $division = Division::where('status','ACTIVE')->get();
        
        return view('employee.salary_payslip',[
            'employee' => $employee,
            'department'    => $department,
            'division'      => $division
        ]);
    }

    public function getEmployeeSalaryData(Request $request){

        $user = auth()->user();
        $userId = auth()->user()->id;
        
        $month = Carbon::today()->format('n');
        $year = Carbon::today()->format('Y');

        if(isset($request->MONTH)){
            $month = $request->MONTH;
        }

        if(isset($request->YEAR)){
            $year = $request->YEAR;
        }

        $firstDayOfMonth = Carbon::create($year, $month, 1)->startOfMonth()->toDateString();
        $lastDayOfMonth = Carbon::create($year, $month, 1)->endOfMonth()->toDateString();

        $employeeActiveIds = EmployeeHelper::EmployeeActiveIds();

        $employeeSalary = EmployeeSalary::with('employee')->whereIn('employee_id',$employeeActiveIds)->get();
        $employeePayslip = EmployeePayslip::with('employee')
            ->where('date_salary','>=',$firstDayOfMonth)
            ->where('date_salary','<=',$lastDayOfMonth)
            ->where('status','<>','DELETED')
        ->whereIn('employee_id',$employeeActiveIds)->get();

        $employeeAttendance = Attendance::select('employee_id', DB::raw('count(*) as total_attendance'))
            ->where('date_attendance', '<=', $lastDayOfMonth)
            ->where('date_attendance', '>=', $firstDayOfMonth)
            ->where('status','<>', 'ABSENT')
            ->groupBy('employee_id')
        ->get();

        $employeeAttendanceAbsent = Attendance::select('employee_id', DB::raw('count(*) as total_attendance'))
            ->where('date_attendance', '<=', $lastDayOfMonth)
            ->where('date_attendance', '>=', $firstDayOfMonth)
            ->where('status','ABSENT')
            ->groupBy('employee_id')
        ->get();



        $totalActiveDay = $this->getActiveDay($firstDayOfMonth,$lastDayOfMonth);

        return response()->json([
                'code' => 200,
                'status' => 'success',
                'data' => [
                    'totalActiveDay'    => $totalActiveDay,
                    'employeeSalary'    => $employeeSalary,
                    'employeePayslip'   => $employeePayslip,
                    'employeeAttendance'=> $employeeAttendance
                ],
                'message' => 'Get employee salary data successfully'
        ]);

    }

    public function getEmployeeSalaryDetail(Request $request){

        $user = auth()->user();
        $userId = auth()->user()->id;
        
        $employeeId = 0;
        $month = Carbon::today()->format('n');
        $year = Carbon::today()->format('Y');

        if(isset($request->MONTH)){
            $month = $request->MONTH;
        }

        if(isset($request->YEAR)){
            $year = $request->YEAR;
        }

        if(isset($request->EMPLOYEE_ID)){
            $employeeId = $request->EMPLOYEE_ID;
        }

        $firstDayOfMonth = Carbon::create($year, $month, 1)->startOfMonth()->toDateString();
        $lastDayOfMonth = Carbon::create($year, $month, 1)->endOfMonth()->toDateString();

        $employee = Employee::with('department','division','job','grade')->where('id',$employeeId)->first();

        if(!$employee){
            throw new \Exception('Employee not found');
        }

        $employeeSalary = EmployeeSalary::with('employee')->where('employee_id',$employeeId)->first();

        $employeePayslip = EmployeePayslip::with('employee')
            ->where('date_salary','>=',$firstDayOfMonth)
            ->where('date_salary','<=',$lastDayOfMonth)
            ->where('status','<>','DELETED')
        ->where('employee_id',$employeeId)->first();

        $employeeAttendanceAll = Attendance::select('employee_id', DB::raw('count(*) as total_attendance'))
            ->where('date_attendance', '<=', $lastDayOfMonth)
            ->where('date_attendance', '>=', $firstDayOfMonth)
            ->where('status','<>', 'ABSENT')
            ->where('employee_id', $employeeId)
            ->groupBy('employee_id')
        ->get()->pluck('total_attendance');
        
        $employeeAttendanceAll = $employeeAttendanceAll[0] ?? 0;

        $employeeAttendanceAbsent = Attendance::select('employee_id', DB::raw('count(*) as total_attendance'))
            ->where('date_attendance', '<=', $lastDayOfMonth)
            ->where('date_attendance', '>=', $firstDayOfMonth)
            ->where('status','ABSENT')
            ->where('employee_id', $employeeId)
            ->groupBy('employee_id')
        ->get()->pluck('total_attendance');

        $employeeAttendanceAbsent = $employeeAttendanceAbsent[0] ?? 0;

        $employeeAttendanceNotComplete = Attendance::select('employee_id', DB::raw('count(*) as total_attendance'))
            ->where('date_attendance', '<=', $lastDayOfMonth)
            ->where('date_attendance', '>=', $firstDayOfMonth)
            ->where('employee_id', $employeeId)
            ->where(function ($query) {
                $query->whereNull('time_in')
                      ->orWhere('time_in', '00:00:00')
                      ->orWhereNull('time_out')
                      ->orWhere('time_out', '00:00:00');
            })
            ->where('status','<>','ABSENT')
            ->groupBy('employee_id')
        ->get()->pluck('total_attendance');

        $employeeAttendanceNotComplete = $employeeAttendanceNotComplete[0] ?? 0;

        $totalActiveDay = $this->getActiveDay($firstDayOfMonth,$lastDayOfMonth);

        return response()->json([
                'code' => 200,
                'status' => 'success',
                'data' => [
                    'totalActiveDay'    => $totalActiveDay,
                    'employee'          => $employee,
                    'employeeSalary'    => $employeeSalary,
                    'employeePayslip'   => $employeePayslip,
                    'employeeAttendanceAll'     => $employeeAttendanceAll,
                    'employeeAttendanceAbsent'  => $employeeAttendanceAbsent,
                    'employeeAttendanceNotComplete'  => $employeeAttendanceNotComplete
                ],
                'message' => 'Get employee salary detail successfully'
        ]);

    }
    
    public function saveEmployeeSalaryByYearMonth(Request $request){
        try {
            DB::beginTransaction();

            $request->validate([
                'employee_id' => 'required|integer',
                'year' => 'required|integer',
                'month' => 'required|integer',

                'basic_salary' => 'required|integer',
                'positional_allowance' => 'required|integer',
                'meal_allowance' => 'required|integer',
                'transportation_allowance' => 'required|integer',
                'internet_phone_allowance' => 'required|integer',

                'bonus' => 'required|integer',
                'overtime' => 'required|integer',
                'thr' => 'required|integer',
                'deduction' => 'required|integer',

                'active_day' => 'required|integer',
                'working_day' => 'required|integer',
                'meal_day' => 'required|integer',
            ]);

            $employee = Employee::where('id',$request->employee_id)->first();

            if(!$employee){
                throw new \Exception('Employee not found');
            }
            
            $employeeSalary = EmployeeSalary::with('employee')->where('employee_id',$employee->id)->first();

            if(!$employeeSalary){
                throw new \Exception('Employee salary not setup');
            }

            
        
            
            $month = $request->month;
            $year = $request->year;
            
            $dateSalary = Carbon::create($year, $month, 1)->endOfMonth()->toDateString();

            $firstDayOfMonth = Carbon::create($year, $month, 1)->startOfMonth()->toDateString();
            $lastDayOfMonth = Carbon::create($year, $month, 1)->endOfMonth()->toDateString();
            
            $employeeAttendanceNotComplete = Attendance::select('employee_id', DB::raw('count(*) as total_attendance'))
                ->where('date_attendance', '<=', $lastDayOfMonth)
                ->where('date_attendance', '>=', $firstDayOfMonth)
                ->where('employee_id', $employee->id)
                ->where(function ($query) {
                    $query->whereNull('time_in')
                        ->orWhere('time_in', '00:00:00')
                        ->orWhereNull('time_out')
                        ->orWhere('time_out', '00:00:00');
                })
                ->where('status','<>','ABSENT')
                ->groupBy('employee_id')
            ->get()->pluck('total_attendance');

            $employeeAttendanceNotComplete = $employeeAttendanceNotComplete[0] ?? 0;

            
            $salaryData['employee_id'] = $employee->id;
            $salaryData['date_salary'] = $dateSalary;
            $salaryData['total_day_active'] = $request->active_day;
            $salaryData['total_working_day'] = $request->working_day;
            $salaryData['total_working_day_meal'] = $request->meal_day;

            $salaryData['basic_salary'] = $employeeSalary->basic_salary;
            $salaryData['positional_allowance'] = $employeeSalary->positional_allowance;
            $salaryData['internet_phone_allowance'] = $employeeSalary->internet_phone_allowance;
            $salaryData['meal_allowance'] = $employeeSalary->meal_allowance;
            $salaryData['transportation_allowance'] = $employeeSalary->transportation_allowance;

            $salaryData['thr'] = $request->thr;
            $salaryData['bonus'] = $request->bonus;
            $salaryData['overtime'] = $request->overtime;
            $salaryData['deduction'] = $request->deduction;

            $salaryData['take_home_pay'] = $request->basic_salary - (intVal($employeeAttendanceNotComplete) * 50000) - (intVal($request->deduction))  + $request->positional_allowance + $request->meal_allowance + $request->transportation_allowance + $request->internet_phone_allowance + $request->bonus + $request->overtime + $request->thr;
            $salaryData['prorate_basic_salary'] = $request->basic_salary;
            $salaryData['prorate_positional_allowance'] = $request->positional_allowance;
            $salaryData['prorate_internet_phone_allowance'] = $request->internet_phone_allowance;
            $salaryData['prorate_meal_allowance'] = $request->meal_allowance;
            $salaryData['prorate_transportation_allowance'] = $request->transportation_allowance;
           
            $salaryData['note'] = $request->note;

            $salaryData['status'] = 'ACTIVE';

            $salaryData['bank_name'] = $employeeSalary->bank_name;
            $salaryData['bank_account_number'] = $employeeSalary->bank_account_number;

            $salaryData['updated_by'] = auth()->id();

            EmployeePayslip::updateOrCreate(
                [
                    'employee_id' => $employee->id,
                    'date_salary' => $dateSalary,
                ],
                $salaryData
            );

            DB::commit();

            return response()->json([
                'code' => 200,
                'status' => 'success',
                'data' => [],
                'message' => 'Update employee salary detail successfully'
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            
            return response()->json([
                'code' => 500,
                'status' => 'error',
                'data' => [],
                'message' => $e->getMessage()
            ], 500);
        }
    }
    
    public function recallEmployeePayslipByYearMonth(Request $request){
        try {
            DB::beginTransaction();

            $request->validate([
                'employee_id' => 'required|integer',
                'year' => 'required|integer',
                'month' => 'required|integer'
            ]);

            $userId = auth()->user()->id;
            $employee = Employee::where('id',$request->employee_id)->first();

            if(!$employee){
                throw new \Exception('Employee not found');
            }
            
            $employeeSalary = EmployeeSalary::with('employee')->where('employee_id',$employee->id)->first();

            if(!$employeeSalary){
                throw new \Exception('Employee salary not setup');
            }          
        
            
            $month = $request->month;
            $year = $request->year;
            
            $dateSalary = Carbon::create($year, $month, 1)->endOfMonth()->toDateString();

            $firstDayOfMonth = Carbon::create($year, $month, 1)->startOfMonth()->toDateString();
            $lastDayOfMonth = Carbon::create($year, $month, 1)->endOfMonth()->toDateString();
            
            $employeePayslip = EmployeePayslip::where('employee_id',$employee->id)
            ->where('date_salary',$dateSalary)
            ->first();

            if(!$employeePayslip){
                throw new \Exception('Employee Payslip not generate');
            }

            $employeePayslip->date_payslip_send = DB::raw('null');
            $employeePayslip->status = 'PAYSLIP_RECALLED';
            $employeePayslip->updated_by = $userId;
            $employeePayslip->save();

            DB::commit();

            return response()->json([
                'code' => 200,
                'status' => 'success',
                'data' => [],
                'message' => 'Employee payslip succesfully recalled'
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            
            return response()->json([
                'code' => 500,
                'status' => 'error',
                'data' => [],
                'message' => $e->getMessage()
            ], 500);
        }
    }
    public function sendEmployeePayslipByYearMonth(Request $request){
        try {
            DB::beginTransaction();

            $request->validate([
                'employee_id' => 'required|integer',
                'year' => 'required|integer',
                'month' => 'required|integer'
            ]);

            $userId = auth()->user()->id;
            $employee = Employee::where('id',$request->employee_id)->first();

            if(!$employee){
                throw new \Exception('Employee not found');
            }
            
            $employeeSalary = EmployeeSalary::with('employee')->where('employee_id',$employee->id)->first();

            if(!$employeeSalary){
                throw new \Exception('Employee salary not setup');
            }          
        
            
            $month = $request->month;
            $year = $request->year;
            
            $dateSalary = Carbon::create($year, $month, 1)->endOfMonth()->toDateString();

            $firstDayOfMonth = Carbon::create($year, $month, 1)->startOfMonth()->toDateString();
            $lastDayOfMonth = Carbon::create($year, $month, 1)->endOfMonth()->toDateString();
            
            $employeePayslip = EmployeePayslip::where('employee_id',$employee->id)
            ->where('date_salary',$dateSalary)
            ->first();

            if(!$employeePayslip){
                throw new \Exception('Employee Payslip not generate');
            }

            $employeePayslip->date_payslip_send = DB::raw('now()');
            $employeePayslip->status = 'PAYSLIP_SENT';
            $employeePayslip->updated_by = $userId;
            $employeePayslip->save();

            DB::commit();

            return response()->json([
                'code' => 200,
                'status' => 'success',
                'data' => [],
                'message' => 'Employee payslip succesfully sent'
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            
            return response()->json([
                'code' => 500,
                'status' => 'error',
                'data' => [],
                'message' => $e->getMessage()
            ], 500);
        }
    }
    
    public function viewPayslip($employeeId,$year,$month){
    
        
        $firstDayOfMonth = Carbon::create($year, $month, 1)->startOfMonth()->toDateString();
        $lastDayOfMonth = Carbon::create($year, $month, 1)->endOfMonth()->toDateString();

        $employee = Employee::with('department','division','job','grade')->where('id',$employeeId)->first();

        if(!$employee){
            return '<h4>Employee not found</h4>';
        }


        $employeePayslip = EmployeePayslip::with('employee')
            ->where('date_salary','>=',$firstDayOfMonth)
            ->where('date_salary','<=',$lastDayOfMonth)
            ->where('status','ACTIVE')
        ->where('employee_id',$employeeId)->first();

        if(!$employeePayslip){
            return '<h4>Payslip not generate</h4>';
        }

        $employeeSalary = EmployeeSalary::with('employee')->where('employee_id',$employeeId)->first();


        $employeeAttendanceAll = Attendance::select('employee_id', DB::raw('count(*) as total_attendance'))
            ->where('date_attendance', '<=', $lastDayOfMonth)
            ->where('date_attendance', '>=', $firstDayOfMonth)
            ->where('status','<>', 'ABSENT')
            ->where('employee_id', $employeeId)
            ->groupBy('employee_id')
        ->get();

        $employeeAttendanceAbsent = Attendance::select('employee_id', DB::raw('count(*) as total_attendance'))
            ->where('date_attendance', '<=', $lastDayOfMonth)
            ->where('date_attendance', '>=', $firstDayOfMonth)
            ->where('status','ABSENT')
            ->where('employee_id', $employeeId)
            ->groupBy('employee_id')
        ->get();

        $totalActiveDay = $this->getActiveDay($firstDayOfMonth,$lastDayOfMonth);

        $dateSalary = Carbon::create($year, $month, 1)->format('F Y');
        
        return view('employee.view_payslip',[
            'downloadPayslip'   => 0,
            'yearSalary'       => $year,
            'dateSalary'       => $dateSalary,
            'totalActiveDay'    => $totalActiveDay,
            'employee'          => $employee,
            'employeeSalary'    => $employeeSalary,
            'employeePayslip'   => $employeePayslip,
            'employeeAttendanceAll'     => $employeeAttendanceAll,
            'employeeAttendanceAbsent'  => $employeeAttendanceAbsent
        ]);
            
    }
    
    public function getActiveDay(string $startDateString, string $endDateString): int {
        // 1. Inisialisasi objek Carbon
        $startDate = Carbon::parse($startDateString);
        $endDate = Carbon::parse($endDateString);

        // Pastikan tanggal awal sebelum tanggal akhir, tukar jika terbalik
        if ($startDate->greaterThan($endDate)) {
            [$startDate, $endDate] = [$endDate, $startDate];
        }

        $count = 0;

        // 2. Kloning tanggal awal untuk iterasi (agar tanggal asli tidak berubah)
        $currentDate = $startDate->copy();

        // 3. Loop dari tanggal awal hingga tanggal akhir (inklusif)
        // Metode isSameDay() membuat loop inklusif terhadap tanggal akhir
        while ($currentDate->lessThanOrEqualTo($endDate)) {
            
            // Carbon memiliki metode yang sangat spesifik untuk mengecek hari kerja
            // isWeekday() akan mengembalikan TRUE jika hari Senin-Jumat
            if ($currentDate->isWeekday()) {
                $count++;
            }

            // 4. Maju ke hari berikutnya
            $currentDate->addDay();
        }

        return $count;
        
    }
}
