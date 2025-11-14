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

class SalaryPayslipController extends Controller
{

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
            ->where('status','ACTIVE')
        ->whereIn('employee_id',$employeeActiveIds)->get();

        $employeeAttendance = Attendance::select('employee_id', DB::raw('count(*) as total_attendance'))
            ->where('date_attendance', '<=', $lastDayOfMonth)
            ->where('date_attendance', '>=', $firstDayOfMonth)
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
