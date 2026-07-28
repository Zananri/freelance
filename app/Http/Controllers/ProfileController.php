<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;
use Log;
use PDF;

use App\Helpers\ActivityHelper;

use App\Models\User;
use App\Models\Attendance;
use App\Models\Employee;
use App\Models\EmployeeSalary;
use App\Models\EmployeePayslip;
use App\Models\EmployeeLeaveRequest;

class ProfileController extends Controller
{
    private function authenticatedEmployee(): ?Employee
    {
        $user = auth()->user();

        $employee = Employee::with('division', 'department', 'job', 'grade')
            ->where('user_id', $user->id)
            ->first();

        if (!$employee && $user->email) {
            $employee = Employee::with('division', 'department', 'job', 'grade')
                ->where(function ($query) use ($user) {
                    $query->whereRaw('LOWER(email_work) = ?', [strtolower($user->email)])
                        ->orWhereRaw('LOWER(email) = ?', [strtolower($user->email)]);
                })
                ->first();

            if ($employee && (int) $employee->user_id !== (int) $user->id) {
                $employee->user_id = $user->id;
                $employee->save();
            }
        }

        return $employee;
    }

    /**
     * Check if a given stored path points to the shared default avatar.
     * We treat both 'asset/img/avatar.png' and '/asset/img/avatar.png' as default.
     */
    private function isDefaultAvatarPath(?string $path): bool
    {
        if (!$path) return false;
        $norm = str_replace('\\', '/', trim($path));
        $norm = ltrim($norm, '/');
        return $norm === 'asset/img/avatar.png';
    }

    public function showprofilePage()
    {
        $employee = $this->authenticatedEmployee();
        abort_if(
            !$employee,
            422,
            'Akun pengguna belum terhubung dengan data employee. Hubungi administrator.'
        );

        $employeePayslip = EmployeePayslip::where('status', 'PAYSLIP_SENT')
            ->where('employee_id', $employee->id)
            ->orderByDesc('date_salary')
            ->get();

        $masterEmployeeSalary = EmployeeSalary::where('employee_id', $employee->id)
            ->orderByDesc('updated_at')
            ->first();

        // The sent payslip is the final salary snapshot for the employee.
        // Prefer it over the master salary because the master record can still
        // contain zero/default values after the payslip has been calculated.
        $employeeSalary = $employeePayslip->first() ?? $masterEmployeeSalary;

        try {
            ActivityHelper::record([
                'employee_id' => $employee?->id,
                'menu' => 'PROFILE',
                'activity' => 'VIEW_PAGE',
                'description' => ($employee?->name ?? 'Unknown') . ' View page profile',
            ]);
        } catch (\Throwable $_) {}

        return view('profile.profile', [
            'employee' => $employee,
            'employeeSalary' => $employeeSalary,
            'employeePayslip' => $employeePayslip
        ]);
    }

    public function downloadPDFPayslip($year,$month){
    
        $employee = $this->authenticatedEmployee();

        if(!$employee){
            return '<h4>Employee not found</h4>';
        }

        $employeeId = $employee->id;
        
        $firstDayOfMonth = Carbon::create($year, $month, 1)->startOfMonth()->toDateString();
        $lastDayOfMonth = Carbon::create($year, $month, 1)->endOfMonth()->toDateString();


        $employeePayslip = EmployeePayslip::with('employee')
            ->where('date_salary','>=',$firstDayOfMonth)
            ->where('date_salary','<=',$lastDayOfMonth)
            ->where('status','PAYSLIP_SENT')
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

        $pdf = PDF::loadView('employee.view_payslip', $data)->setPaper('A4', 'portrait');
        
        return $pdf->download('Payslip_'.$year.'_'.$month.'.pdf');            
    }

    public function editPassword(Request $request){

        try{
                
            $request->validate([
                'current_password' => 'required',
                'new_password' => 'required|confirmed|min:7',
                'new_password_confirmation' => 'required|min:7',
            ]);

            $user = auth()->user();

            if (Hash::check($request->current_password, $user->password)) {

                $user->password = Hash::make($request->new_password);
                $user->save();

            }else{
                throw new \Exception('Current password is incorrect');
            }

            return response()->json([
                    'code' => 200,
                    'status' => 'success',
                    'data' => [],
                    'message' => 'Password changed successfully'
            ]);

        }catch (\Exception $e){

            return response()->json([
                'code' => 500,
                'status' => 'error',
                'data' => [],
                'message' => $e->getMessage()
            ], 500);

        }

    }

    public function editPhotoProfile(Request $request){

        try{
                
            $request->validate([
                'profile_photo' => 'required|image|mimes:jpeg,png,jpg,gif|max:10048'
            ]);

            $user = auth()->user();
            $employee = Employee::where('user_id', $user->id)->first();

            if ($request->hasFile('profile_photo')) {

                $file = $request->file('profile_photo');

                if ($employee->profile_picture) {

                    if($employee->profile_picture != 'asset/img/avatar.png'){
                        $oldPath = public_path($employee->profile_picture);
                        if (file_exists($oldPath)) { @unlink($oldPath); }   
                    }

                }

                $extension = $file->getClientOriginalExtension();

                $filename = 'PROFILE_PICTURE_' . time() . '.' . $extension;

                $destinationPath = public_path('file/profile_picture');

                if (!file_exists($destinationPath)) { mkdir($destinationPath, 0777, true); }

                $file->move($destinationPath, $filename);

                $employee->profile_picture = 'file/profile_picture/' . $filename;
                $employee->save();
            }else{
                throw new \Exception('Please add new profile photo');
            }

            return response()->json([
                    'code' => 200,
                    'status' => 'success',
                    'data' => [
                        'new_profile_photo' => $employee->profile_picture
                    ],
                    'message' => 'Photo profile changed successfully'
            ]);

        }catch (\Exception $e){

            return response()->json([
                'code' => 500,
                'status' => 'error',
                'data' => [],
                'message' => $e->getMessage()
            ], 500);

        }

    }
    public function index()
    {
        
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        //
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(string $id)
    {
        //
    }


    /**
     * Handle profile update including password and profile photo.
     */
    public function updateProfile(Request $request)
    {
        $user = Auth::user();

        if (!$user) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        // NOTE: This method intentionally updates ONLY Employee.profile_picture (primary public avatar)
        // and leaves Employee.photo (used for edit/detail context) unchanged after initial creation.
        // user->photo is left untouched for backward compatibility.

        // Validate only profile_photo and optional password fields, current_password is optional now
        $request->validate([
            'current_password' => 'nullable|string',
            'password' => 'nullable|string|min:6',
            'profile_photo' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
            'remove_profile_photo' => 'nullable|in:0,1'
        ]);

        // If password is provided, verify current password
        if ($request->filled('password')) {
            if (!$request->filled('current_password') || !Hash::check($request->current_password, $user->password)) {
                return response()->json(['error' => 'Current password is incorrect or missing'], 422);
            }
            // Update password
            $user->password = Hash::make($request->password);
        }

        $employee = Employee::where('user_id', $user->id)->first();

        // Handle removal if requested
        if ($request->input('remove_profile_photo') === '1') {
            if ($employee && $employee->profile_picture) {
                // Never delete the shared default avatar file
                if (!$this->isDefaultAvatarPath($employee->profile_picture)) {
                    $oldPath = public_path(ltrim($employee->profile_picture, '/'));
                    if (file_exists($oldPath)) { @unlink($oldPath); }
                }
                $employee->profile_picture = null;
                $employee->save();
            }
        } else {
            // Handle profile picture upload -> employee.profile_picture
            if ($request->hasFile('profile_photo') && $employee) {
                $file = $request->file('profile_photo');
                if ($employee->profile_picture) {
                    // Never delete the shared default avatar file
                    if (!$this->isDefaultAvatarPath($employee->profile_picture)) {
                        $oldPath = public_path(ltrim($employee->profile_picture, '/'));
                        if (file_exists($oldPath)) { @unlink($oldPath); }
                    }
                }
                $extension = $file->getClientOriginalExtension();
                $filename = 'PROFILE_PICTURE_' . time() . '.' . $extension;
                $destinationPath = public_path('file/profile_picture');
                if (!file_exists($destinationPath)) { mkdir($destinationPath, 0777, true); }
                $file->move($destinationPath, $filename);
                $employee->profile_picture = 'file/profile_picture/' . $filename;
                $employee->save();
            }
        }

        $user->save(); // password changes only (if any)

        $newPhotoUrl = $employee && $employee->profile_picture ? asset($employee->profile_picture) : null;

        return response()->json([
            'message' => 'Profile updated successfully',
            'photo_url' => $newPhotoUrl
        ]);
    }

    public function verifyCurrentPassword(Request $request)
    {
        $user = Auth::user();
        if (!$user) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        $request->validate([
            'current_password' => 'required|string',
        ]);

        if (Hash::check($request->current_password, $user->password)) {
            return response()->json(['valid' => true]);
        } else {
            return response()->json(['valid' => false]);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        //
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
