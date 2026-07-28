<?php

namespace App\Http\Controllers;

use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

use App\Helpers\EmployeeHelper;
use App\Http\Controllers\NotificationController;


use App\Models\Attendance;
use App\Models\Department;
use App\Models\Division;
use App\Models\Employee;
use App\Models\EmployeeSalary;
use App\Models\EmployeePayslip;
use App\Models\EmployeeLeaveRequest;
use App\Models\User;

use Barryvdh\DomPDF\Facade\Pdf;



class SalaryPayslipController extends Controller
{
    private const EXCLUDED_SALARY_PAYSLIP_DEPARTMENT_IDS = [1];
    private const EXCLUDED_SALARY_PAYSLIP_USER_ROLES = ['ADMINISTRATOR', 'SUPERADMIN', 'ADMIN'];
    private const EXCLUDED_SALARY_PAYSLIP_USER_TYPES = ['ADMINISTRATOR', 'SUPERADMIN', 'ADMIN'];

    private function getSalaryPayslipEmployeeIds()
    {
        $employeeActiveIds = EmployeeHelper::EmployeeActiveIds();
        $user = auth()->user();
        $currentEmployee = $user?->employee;
        $isSuperadmin = strtoupper((string) ($user?->user_type ?? '')) === 'SUPERADMIN';

        return Employee::select('employees.id')
            ->join('users', 'employees.user_id', '=', 'users.id')
            ->whereIn('employees.id', $employeeActiveIds)
            ->whereNotIn('users.user_role', self::EXCLUDED_SALARY_PAYSLIP_USER_ROLES)
            ->whereNotIn('users.user_type', self::EXCLUDED_SALARY_PAYSLIP_USER_TYPES)
            ->whereNotIn('department_id', self::EXCLUDED_SALARY_PAYSLIP_DEPARTMENT_IDS)
            ->when(!$isSuperadmin, fn ($query) => $query->where('employees.department_id', $currentEmployee?->department_id ?? 0))
            ->pluck('employees.id');
    }

    private function findSalaryPayslipEmployee(int $employeeId)
    {
        $user = auth()->user();
        $currentEmployee = $user?->employee;
        $isSuperadmin = strtoupper((string) ($user?->user_type ?? '')) === 'SUPERADMIN';

        return Employee::with('department', 'division', 'job', 'grade')
            ->where('id', $employeeId)
            ->whereNotIn('department_id', self::EXCLUDED_SALARY_PAYSLIP_DEPARTMENT_IDS)
            ->when(!$isSuperadmin, fn ($query) => $query->where('department_id', $currentEmployee?->department_id ?? 0))
            ->first();
    }

    private function canManagePayslips(): bool
    {
        $user = auth()->user();
        $roles = [
            strtoupper((string) ($user?->user_type ?? '')),
            strtoupper((string) ($user?->user_role ?? '')),
        ];

        return count(array_intersect($roles, ['SUPERADMIN', 'ADMIN', 'ADMINISTRATOR'])) > 0;
    }

    public function generatePDFPayslipEX()
    {
        $users = User::get();

        $data = [
            'title' => 'Welcome to ItSolutionStuff.com',
            'date' => date('m/d/Y'),
            'users' => $users
        ]; 
                
        $pdf = Pdf::loadView('myPDF', $data);
        $pdf->setPaper('A4', 'portrait');

        return $pdf->download('itsolutionstuff.pdf');
    }

    public function downloadPDFPayslip($employeeId,$year,$month){
    
        
        $firstDayOfMonth = Carbon::create($year, $month, 1)->startOfMonth()->toDateString();
        $lastDayOfMonth = Carbon::create($year, $month, 1)->endOfMonth()->toDateString();

        $employee = $this->findSalaryPayslipEmployee((int) $employeeId);

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

        $pdf = Pdf::loadView('employee.view_payslip', $data)->setPaper('A4', 'portrait');
        
        return $pdf->download('payslipEmployee.pdf');            
    }

    public function viewPDFPayslip($employeeId,$year,$month){
    
        
        $firstDayOfMonth = Carbon::create($year, $month, 1)->startOfMonth()->toDateString();
        $lastDayOfMonth = Carbon::create($year, $month, 1)->endOfMonth()->toDateString();

        $employee = $this->findSalaryPayslipEmployee((int) $employeeId);

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

        $employeeAttendanceNotComplete = $employeePayslip->attendance_incomplete ?? 0;

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

        $pdf = Pdf::loadView('employee.view_payslip', $data)->setPaper('A4', 'portrait');
        
        return $pdf->stream('payslipEmployee.pdf');            
    }


    public function showSalaryPayslipPage()
    {
        $user = auth()->user();
        $userId = auth()->user()->id;
        $selectedDepartmentId = request()->query('department', 'all');
        $selectedDivisionId = request()->query('division', 'all');
        $searchQuery = trim((string) request()->query('query', ''));
        
        $employeeActiveIds = $this->getSalaryPayslipEmployeeIds();
        
        $employeeQuery = Employee::select('employees.id','employees.user_id','employees.name','employees.status','employees.photo',
                'employees.department_id','employees.division_id',
                'job_list.job_name'
            )
            ->join('job_list','employees.job_id','=','job_list.id')
            ->join('users','employees.user_id','=','users.id')
            ->where('employees.status',"ACTIVE")
            ->whereNotIn('users.user_role', self::EXCLUDED_SALARY_PAYSLIP_USER_ROLES)
            ->whereNotIn('users.user_type', self::EXCLUDED_SALARY_PAYSLIP_USER_TYPES)
            ->whereIn('employees.id',$employeeActiveIds);

        if ($selectedDepartmentId !== 'all' && $selectedDepartmentId !== '0' && $selectedDepartmentId !== 0) {
            $employeeQuery->where('employees.department_id', $selectedDepartmentId);
        }

        if ($selectedDivisionId !== 'all' && $selectedDivisionId !== '0' && $selectedDivisionId !== 0) {
            $employeeQuery->where('employees.division_id', $selectedDivisionId);
        }

        if ($searchQuery !== '') {
            $employeeQuery->where('employees.name', 'like', '%' . $searchQuery . '%');
        }

        $employee = $employeeQuery
            ->orderBy('employees.division_id', 'asc')
            ->orderBy('employees.name', 'asc')
            ->paginate(15)
            ->withQueryString();

        $department = Department::where('status','ACTIVE')
            ->whereNotIn('id', self::EXCLUDED_SALARY_PAYSLIP_DEPARTMENT_IDS)
            ->get();
        $division = Division::where('status','ACTIVE')->get();
        
        return view('employee.salary_payslip',[
            'employee' => $employee,
            'department'    => $department,
            'division'      => $division,
            'selectedDepartmentId' => $selectedDepartmentId,
            'selectedDivisionId' => $selectedDivisionId,
            'searchQuery' => $searchQuery,
        ]);
    }

    public function getEmployeeSalaryData(Request $request)
    {
        $month = Carbon::today()->format('n');
        $year = Carbon::today()->format('Y');

        if ($request->filled('MONTH')) {
            $month = $request->MONTH;
        }

        if ($request->filled('YEAR')) {
            $year = $request->YEAR;
        }

        $firstDayOfMonth = Carbon::create($year, $month, 1)->startOfMonth()->toDateString();
        $lastDayOfMonth = Carbon::create($year, $month, 1)->endOfMonth()->toDateString();

        $employeeActiveIds = $this->getSalaryPayslipEmployeeIds();   

        $employeeSalary = EmployeeSalary::with('employee')
            ->whereIn('employee_id', $employeeActiveIds)
            ->get();

        $employeePayslip = EmployeePayslip::with('employee')
            ->whereBetween('date_salary', [$firstDayOfMonth, $lastDayOfMonth])
            ->where('status', '<>', 'DELETED')
            ->whereIn('employee_id', $employeeActiveIds)
            ->get();

        $employeeAttendance = Attendance::select(
                'employee_id',
                DB::raw('count(*) as total_attendance')
            )
            ->whereBetween('date_attendance', [$firstDayOfMonth, $lastDayOfMonth])
            ->where('status', '<>', 'ABSENT')
            ->whereIn('employee_id', $employeeActiveIds)
            ->groupBy('employee_id')
            ->get();

        $employeeAttendanceAbsent = Attendance::select(
                'employee_id',
                DB::raw('count(*) as total_attendance')
            )
            ->whereBetween('date_attendance', [$firstDayOfMonth, $lastDayOfMonth])
            ->where('status', 'ABSENT')
            ->whereIn('employee_id', $employeeActiveIds)
            ->groupBy('employee_id')
            ->get();

        $totalActiveDay = $this->getActiveDay($firstDayOfMonth, $lastDayOfMonth);

        // dd($employeeSalary->first());
        // dd(
        //     DB::table('employee_salaries')
        //         ->select('bpjs_tenaga_kerja_allowance')
        //         ->first()
        // );

        return response()->json([
            'code' => 200,
            'status' => 'success',
            'data' => [
                'totalActiveDay' => $totalActiveDay,
                'employeeSalary' => $employeeSalary,
                'employeePayslip' => $employeePayslip,
                'employeeAttendance' => $employeeAttendance,
                'employeeAttendanceAbsent' => $employeeAttendanceAbsent,
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

        $employee = $this->findSalaryPayslipEmployee($employeeId);

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

        $employeeAttendanceNotComplete = $employeePayslip?->attendance_incomplete;

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
                'bpjs_allowance' => 'required|integer',
                'bpjs_tenaga_kerja_allowance' => 'required|integer',
                'pension_allowance' => 'required|integer',

                'kompensasi_pkwt' => 'required|integer',
                'thr' => 'required|integer',

                'deduction_absent' => 'required|integer',
                'deduction_late' => 'required|integer',
                'deduction_bpjs_kesehatan' => 'required|integer',
                'deduction_bpjs_tenaga_kerja' => 'required|integer',
                'deduction_bpjs_dana_pensiun' => 'required|integer',
                'deduction_pph21' => 'required|integer',
                'deduction_cooperative' => 'required|integer',
                'deduction_other' => 'nullable|integer',

                'active_day' => 'required|integer',
                'working_day' => 'required|integer',
                'meal_day' => 'required|integer',
                'attendance_not_complete' => 'nullable|integer|min:0',
            ]);

            $employee = $this->findSalaryPayslipEmployee((int) $request->employee_id);

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
            
            $employeeAttendanceNotComplete = $request->filled('attendance_not_complete')
                ? (int) $request->attendance_not_complete
                : null;

            
            $salaryData['employee_id'] = $employee->id;
            $salaryData['date_salary'] = $dateSalary;
            $salaryData['total_day_active'] = $request->active_day;
            $salaryData['total_working_day'] = $request->working_day;
            $salaryData['total_working_day_meal'] = $request->meal_day;
            $salaryData['attendance_incomplete'] = $employeeAttendanceNotComplete;

            $salaryData['basic_salary'] = $request->basic_salary;
            $salaryData['positional_allowance'] = $request->positional_allowance;
            $salaryData['bpjs_allowance'] = $request->bpjs_allowance;
            $salaryData['bpjs_tenaga_kerja_allowance'] = $request->bpjs_tenaga_kerja_allowance;
            $salaryData['pension_allowance'] = $request->pension_allowance;

            $salaryData['thr'] = $request->thr;
            $salaryData['kompensasi_pkwt'] = $request->kompensasi_pkwt;

            $salaryData['deduction_absent'] = $request->deduction_absent;
            $salaryData['deduction_late'] = $request->deduction_late;
            $salaryData['deduction_bpjs_kesehatan'] = $request->deduction_bpjs_kesehatan;
            $salaryData['deduction_bpjs_tenaga_kerja'] = $request->deduction_bpjs_tenaga_kerja;
            $salaryData['deduction_bpjs_dana_pensiun'] = $request->deduction_bpjs_dana_pensiun;
            $salaryData['deduction_pph21'] = $request->deduction_pph21;
            $salaryData['deduction_cooperative'] = $request->deduction_cooperative;
            $salaryData['deduction_other'] = $request->deduction_other;

            $totalDeduction = intVal($request->deduction_absent)
                + intVal($request->deduction_late)
                + intVal($request->deduction_bpjs_kesehatan)
                + intVal($request->deduction_bpjs_tenaga_kerja)
                + intVal($request->deduction_bpjs_dana_pensiun)
                + intVal($request->deduction_pph21)
                + intVal($request->deduction_cooperative)
                + intVal($request->deduction_other);

            $salaryData['deduction'] = $totalDeduction;

            $salaryData['take_home_pay'] = $request->basic_salary
                - intVal($employeeAttendanceNotComplete)
                - $totalDeduction
                + $request->positional_allowance
                + $request->bpjs_allowance
                + $request->bpjs_tenaga_kerja_allowance
                + $request->pension_allowance
                + $request->kompensasi_pkwt
                + $request->thr;

            $salaryData['prorate_basic_salary'] = $request->basic_salary;
            $salaryData['prorate_positional_allowance'] = $request->positional_allowance;
            $salaryData['prorate_bpjs_allowance'] = $request->bpjs_allowance;
            $salaryData['prorate_bpjs_tenaga_kerja_allowance'] = $request->bpjs_tenaga_kerja_allowance;
            $salaryData['prorate_pension_allowance'] = $request->pension_allowance;
           
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
            $employee = $this->findSalaryPayslipEmployee((int) $request->employee_id);

            if(!$employee){
                throw new \Exception('Employee not found');
            }
            
            $employeeSalary = EmployeeSalary::with('employee')->where('employee_id',$employee->id)->first();

            if(!$employeeSalary){
                throw new \Exception('Employee sala ry not setup');
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
            $employee = $this->findSalaryPayslipEmployee((int) $request->employee_id);

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

            // Notify employee that payslip has been sent
            try {
                NotificationController::createUserNotification(
                    employeeId: $employee->id,
                    type: 'payslip_sent',
                    title: 'Salary Payslip',
                    message: 'Your salary payslip for ' . $dateSalary . ' is now available for review.',
                    createdBy: $userId
                );
            } catch (\Throwable $e) {
                // Do not block sending payslip if notification fails
            }

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

    public function sendAllEmployeePayslipsByYearMonth(Request $request)
    {
        if (!$this->canManagePayslips()) {
            abort(403);
        }

        $validated = $request->validate([
            'year' => 'required|integer|min:2000|max:2100',
            'month' => 'required|integer|min:1|max:12',
        ]);

        $dateSalary = Carbon::create($validated['year'], $validated['month'], 1)
            ->endOfMonth()
            ->toDateString();
        $employeeIds = $this->getSalaryPayslipEmployeeIds();
        $eligibleCount = $employeeIds->count();
        $userId = auth()->id();

        $payslips = EmployeePayslip::whereIn('employee_id', $employeeIds)
            ->where('date_salary', $dateSalary)
            ->where('status', '<>', 'DELETED')
            ->where('basic_salary', '>', 0)
            ->where('take_home_pay', '>', 0)
            ->get();

        if ($payslips->isEmpty()) {
            return response()->json([
                'code' => 422,
                'status' => 'error',
                'data' => [
                    'sent_count' => 0,
                    'skipped_count' => $eligibleCount,
                ],
                'message' => __('salary.no_calculated_payslips'),
            ], 422);
        }

        DB::transaction(function () use ($payslips, $dateSalary, $userId) {
            foreach ($payslips as $payslip) {
                $payslip->date_payslip_send = now();
                $payslip->status = 'PAYSLIP_SENT';
                $payslip->updated_by = $userId;
                $payslip->save();

                try {
                    NotificationController::createUserNotification(
                        employeeId: $payslip->employee_id,
                        type: 'payslip_sent',
                        title: 'Salary Payslip',
                        message: 'Your salary payslip for ' . $dateSalary . ' is now available for review.',
                        createdBy: $userId
                    );
                } catch (\Throwable $e) {
                    // A notification failure must not block payslip delivery.
                }
            }
        });

        $sentCount = $payslips->count();
        $skippedCount = max(0, $eligibleCount - $sentCount);

        return response()->json([
            'code' => 200,
            'status' => 'success',
            'data' => [
                'sent_count' => $sentCount,
                'skipped_count' => $skippedCount,
            ],
            'message' => __('salary.bulk_send_result', [
                'sent' => $sentCount,
                'skipped' => $skippedCount,
            ]),
        ]);
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
        $startDate = Carbon::parse($startDateString);
        $endDate = Carbon::parse($endDateString);

        if ($startDate->greaterThan($endDate)) {
            [$startDate, $endDate] = [$endDate, $startDate];
        }

        $count = 0;

        $currentDate = $startDate->copy();

        while ($currentDate->lessThanOrEqualTo($endDate)) {
            
            if ($currentDate->isWeekday()) {
                $count++;
            }

            $currentDate->addDay();
        }

        return $count;
        
    }
    
}
