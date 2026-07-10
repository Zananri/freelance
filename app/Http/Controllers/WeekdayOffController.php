<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Carbon\Carbon;

use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;

use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Color;
use PhpOffice\PhpSpreadsheet\Style\Fill;

use PhpOffice\PhpSpreadsheet\Cell\Coordinate;

use App\Models\User;
use App\Models\Attendance;
use App\Models\AttendanceTracking;
use App\Models\Employee;
use App\Models\Department;
use App\Models\Division;

class WeekdayOffController extends Controller
{
    public function showWeekdayOffPage()
    {
        $user = auth()->user();
        $userId = auth()->user()->id;
        
        $currentEmployee = Employee::where('user_id', $userId)->first();
        
        $userType = strtoupper((string) ($user->user_type ?? ''));
        $userRole = strtoupper((string) ($user->user_role ?? ''));

        $employee = Employee::select('employees.id','employees.user_id',
            'employees.department_id',
            'employees.division_id',
            'employees.name',
            'employees.status',
            'employees.photo',
            'employees.weekday_off',
            'job_list.job_name'
        )
        ->join('job_list','employees.job_id','=','job_list.id')
        ->join('users','employees.user_id','=','users.id')
        ->where('employees.status',"ACTIVE");

        if (in_array($userType, ['SUPERADMIN','ADMINISTRATOR']) && in_array($userRole, ['ADMINISTRATOR','GENERAL_MANAGER', 'CEO','HR_MANAGER'])) {
            //show all
            
            $department = Department::where('status','ACTIVE')->get();
            $division = Division::where('status','ACTIVE')->get();
        }else{

            $employee = $employee->where('employees.department_id', $currentEmployee->department_id);
            
            $department = Department::where('status','ACTIVE')
            ->where('id',$currentEmployee->department_id)
            ->get();

            $division = Division::where('status','ACTIVE')
            ->where('department_id',$currentEmployee->department_id)
            ->get();
        }

        $employee = $employee->whereNotIn('users.user_role',["GENERAL_MANAGER","CEO"])
        ->whereNotIn('users.user_type',["ADMINISTRATOR"])
        ->get();


        return view('weekday_off.weekday_off',[
            'employee'      => $employee,
            'department'    => $department,
            'division'      => $division
        ]);
    }

    public function saveEmployeeWeekdayoff(Request $request){

        try{

            // ADMINISTRATOR REGULAR MANAGEMENT  
            // GENERAL_MANAGER MANAGER LEADER HR_MANAGER FINANCE_MANAGER EMPLOYEE
            $request->validate([
                'json_weekday_off' => 'required|json',
            ]);

            $jsonWeekdayOff = json_decode($request->json_weekday_off);
        
            //dd($jsonWeekdayOff);
            foreach($jsonWeekdayOff as $item){
                $employeeId = $item[0];
                $divisionId = $item[1];
                $weekDay = $item[2];

                Employee::where('id',$employeeId)->where('division_id',$divisionId)
                ->update([
                    'weekday_off' => $weekDay
                ]);
            }

            $successMsg = "Save weekday off successfully";

            return response()->json([
                'code' => 200,
                'status' => 'success',
                'message' => $successMsg
            ]);

        } catch (\Exception $e) {

            return response()->json([
                'code' => 406,
                'status' => "error",
                'message'=> $e->getMessage()
            ], 406);
            
        }

    }

    public function exportAttendanceMonthly($deparmentId,$divisionId){
        

        $monthFull = $month;
        $month = Carbon::parse($month)->format('n');
        $year = Carbon::parse($year)->format('Y');


        $firstDayOfMonth = Carbon::create($year, $month, 1)->startOfMonth()->toDateString();
        $lastDayOfMonth = Carbon::create($year, $month, 1)->endOfMonth()->toDateString();

        $daysInMonth = Carbon::parse($firstDayOfMonth)->daysInMonth;

        $employee = Employee::select('employees.id')
            ->join('users','employees.user_id','=','users.id')
            ->where('employees.status',"ACTIVE")
            ->whereNotIn('users.user_role',["GENERAL_MANAGER","CEO"])
        ->whereNotIn('users.user_type',["ADMINISTRATOR"]);

        if($deparmentId != 'all'){
            $employee = $employee->where('department_id', $deparmentId);
        }
        if($divisionId != 'all'){
            $employee = $employee->where('division_id', $divisionId);
        }

        
        $employee = $employee->get();

        $employeeIds = $employee->pluck('id');

        $allEmployeeActive = Employee::with('department','division','job','grade')
            ->whereIn('employees.id',$employeeIds)
            ->orderBy('employees.division_id','asc')
        ->get();

        $spreadsheet = new Spreadsheet();
        $activeWorksheet = $spreadsheet->getActiveSheet();
    
        $activeWorksheet->mergeCells('A1:J1');
        
        $activeWorksheet->mergeCells('K1:R1');
        $activeWorksheet->setCellValue('K1', 'Off & Lateness');
        $activeWorksheet->getStyle('K1')->getFont()->setBold(true)->setSize(44);
        $activeWorksheet->getStyle('K1')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
        
        $activeWorksheet->mergeCells('S1:BB1');
        $activeWorksheet->setCellValue('S1', 'Present List ACER Team');

        $activeWorksheet->getStyle('S1')->getFont()->setBold(true)->setSize(44);
        $activeWorksheet->getStyle('S1')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);

        //No	NAMA KARYAWAN	NSAID	Department	Division	Job Position	Grade/Rank	Join Date	Periode Kerja	Penempatan	Time Lateness 1 Hour	Time Lateness 1 > Hour	Overtime off work day	Overtime on Work day	Sick	Permit	Absen	Leave	Shift 2	Total Work half Day This Month	Amount Work half Day This Month	Total Work Day This Month (23 Days)	Total Day Off This Month
        
        $activeWorksheet->setCellValue('A2', 'No');
        $activeWorksheet->setCellValue('B2', 'NAMA KARYAWAN');
        $activeWorksheet->setCellValue('C2', 'NSAID');
        $activeWorksheet->setCellValue('D2', 'Department');
        $activeWorksheet->setCellValue('E2', 'Division');
        $activeWorksheet->setCellValue('F2', 'Job Position');
        $activeWorksheet->setCellValue('G2', 'Grade/Rank');
        $activeWorksheet->setCellValue('H2', 'Join Date');
        $activeWorksheet->setCellValue('I2', 'Periode Kerja');
        $activeWorksheet->setCellValue('J2', 'Penempatan');
        $activeWorksheet->setCellValue('K2', 'Time Lateness 1 Hour');
        $activeWorksheet->setCellValue('L2', 'Time Lateness 1 > Hour');
        $activeWorksheet->setCellValue('M2', 'Overtime off work day');
        $activeWorksheet->setCellValue('N2', 'Overtime on Work day');
        $activeWorksheet->setCellValue('O2', 'Sick');
        $activeWorksheet->setCellValue('P2', 'Permit');
        $activeWorksheet->setCellValue('Q2', 'Absen');
        $activeWorksheet->setCellValue('R2', 'Leave');
        $activeWorksheet->setCellValue('S2', 'Shift 2');
        $activeWorksheet->setCellValue('T2', 'Total Work half Day This Month');
        $activeWorksheet->setCellValue('U2', 'Amount Work half Day This Month');
        $activeWorksheet->setCellValue('V2', 'Total Work Day This Month');//Total Work Day This Month (23 Days)
        $activeWorksheet->setCellValue('W2', 'Total Day Off This Month');

        // add border 
        $headerStyle = [
            'borders' => [
                'allBorders' => [
                    'borderStyle' => Border::BORDER_THIN,
                ],
            ],
        ];
        

        $activeWorksheet->getStyle('A2:W2')->applyFromArray($headerStyle)->getFont()->setBold(true)->setSize(10);

        $activeWorksheet->getStyle('A2:W2')
            ->getAlignment()
            ->setWrapText(true)
            ->setHorizontal(Alignment::HORIZONTAL_CENTER)
        ->setVertical(Alignment::VERTICAL_CENTER);
        
        $arrDayID = ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'];

        

        for ($i = 0; $i < $daysInMonth; $i++) {
            $newAddDate = Carbon::parse($firstDayOfMonth)->copy()->addDays($i);
            $column = Coordinate::stringFromColumnIndex($i + 24); // Mengubah indeks menjadi huruf kolom (1=A, 2=B, ...)
            
            $activeWorksheet->setCellValue($column.'2', $newAddDate->format('d-M'));
            $activeWorksheet->setCellValue($column.'3', $arrDayID[$newAddDate->format('w')]);

            if($newAddDate->isSunday()) {
                $activeWorksheet->getStyle($column.'3')
                    ->getFont()
                    ->getColor()
                ->setARGB('ffffffff');

                $activeWorksheet->getStyle($column.'3')
                    ->getFill()
                    ->setFillType(Fill::FILL_SOLID)
                    ->getStartColor()
                ->setARGB('ffd74e51');
            }

        }

        $activeWorksheet->getStyle('X2:BC3')
            ->getAlignment()
            ->setHorizontal(Alignment::HORIZONTAL_CENTER)
        ->setVertical(Alignment::VERTICAL_CENTER);

        

        // Menulis data dari database ke sheet
        $row = 4; // Mulai dari baris kedua
        $no = 1;

        foreach ($allEmployeeActive as $employeeItem) {

            $attendanceTotalDays = Attendance::where('employee_id', $employeeItem->id)
                    ->where('date_attendance', '<=', $lastDayOfMonth)
                    ->where('date_attendance', '>=', $firstDayOfMonth)
                    ->where('time_in', '!=', '')
                    ->count();

            $activeWorksheet->setCellValue('A'.$row, $no);
            $activeWorksheet->setCellValue('B'.$row, $employeeItem->name);
            $activeWorksheet->setCellValue('C'.$row, $employeeItem->employee_niks);
            $activeWorksheet->setCellValue('D'.$row, $employeeItem->department->name_department);//'Department'
            $activeWorksheet->setCellValue('E'.$row, $employeeItem->division->name_division);//'Division'
            $activeWorksheet->setCellValue('F'.$row, $employeeItem->job->job_name);//'Job Position'
            $activeWorksheet->setCellValue('G'.$row, $employeeItem->grade->title);//'Grade/Rank'
            $activeWorksheet->setCellValue('H'.$row, $employeeItem->hire_date);//'Join Date'
            $activeWorksheet->setCellValue('I'.$row, '');//'Periode Kerja'
            $activeWorksheet->setCellValue('J'.$row, '');//'Penempatan' $employeeItem->office
            $activeWorksheet->setCellValue('K'.$row, '');//'Time Lateness 1 Hour'
            $activeWorksheet->setCellValue('L'.$row, '');//'Time Lateness 1 > Hour'
            $activeWorksheet->setCellValue('M'.$row, '');//'Overtime off work day'
            $activeWorksheet->setCellValue('N'.$row, '');//'Overtime on Work day'
            $activeWorksheet->setCellValue('O'.$row, '');//'Sick'
            $activeWorksheet->setCellValue('P'.$row, '');//'Permit'
            $activeWorksheet->setCellValue('Q'.$row, '');//'Absen'
            $activeWorksheet->setCellValue('R'.$row, '');//'Leave'
            $activeWorksheet->setCellValue('S'.$row, '');//'Shift'
            $activeWorksheet->setCellValue('T'.$row, '');//'Total Work half Day This Month'
            $activeWorksheet->setCellValue('U'.$row, '');//'Amount Work half Day This Month'
            $activeWorksheet->setCellValue('V'.$row, $attendanceTotalDays);//Total Work Day This Month (23 Days)
            $activeWorksheet->setCellValue('W'.$row, '');//'Total Day Off This Month'
            
            for ($i = 0; $i < $daysInMonth; $i++) {

                $newAddDate = Carbon::parse($firstDayOfMonth)->copy()->addDays($i);                
                $column = Coordinate::stringFromColumnIndex($i + 24); // Mengubah indeks menjadi huruf kolom (1=A, 2=B, ...)

                $attendance = Attendance::where('employee_id', $employeeItem->id)
                    ->where('date_attendance', $newAddDate->toDateString())
                ->first();
                
                if($attendance){
                    
                    
                    $timeIn = Carbon::parse($attendance->time_in)->format('H:i');
                    $timeOut = Carbon::parse($attendance->time_out)->format('H:i');
                    
                    if($timeIn){
                        $activeWorksheet->setCellValue($column.$row, 1);// $timeIn." \n ".$timeOut
                    }
                    //$activeWorksheet->setCellValue($column.$row, $timeIn.chr(10).$timeOut);// $timeIn." \n ".$timeOut
                    
                    
                    if($attendance->time_late){
                        $activeWorksheet->getStyle($column.$row)
                            ->getFont()
                            ->getColor()
                        ->setARGB('ffd74e51');
                    }
                    
                }else{
                    //$activeWorksheet->setCellValue($column.$row, $employeeItem->id.' '.$newAddDate->toDateString());
                    $activeWorksheet->setCellValue($column.$row, '');
                }
                
            }
            
            
            
            $row++;
            $no++;
        }

        $dataStyle = [
            'borders' => [
                'allBorders' => [
                    'borderStyle' => Border::BORDER_THIN,
                ],
            ],
        ];

        $lastColumn = Coordinate::stringFromColumnIndex(23 + $daysInMonth);
        $activeWorksheet->getStyle('A2:'.$lastColumn.($row-1))->applyFromArray($dataStyle);

        $activeWorksheet->getStyle('A2:'.$lastColumn.($row-1))
            ->getAlignment()
            ->setHorizontal(Alignment::HORIZONTAL_CENTER)
        ->setVertical(Alignment::VERTICAL_CENTER);
        
        $activeWorksheet->getStyle('W4:'.$lastColumn.($row-1))
            ->getAlignment()
            ->setWrapText(true)
            ->setHorizontal(Alignment::HORIZONTAL_CENTER)
        ->setVertical(Alignment::VERTICAL_CENTER);

        // Mengatur lebar kolom agar otomatis
        foreach (range('A', 'J') as $column) {
            $activeWorksheet->getColumnDimension($column)->setAutoSize(true);
        }
 
        $fileName = 'ABSENSI ACER '.$monthFull.' '.$year.'.xlsx';
        $tempFileName = tempnam(sys_get_temp_dir(), $fileName);

        $writer = new Xlsx($spreadsheet);
        $writer->save($tempFileName);

        return response()->download($tempFileName,$fileName)->deleteFileAfterSend(true);

    }
    //
}
