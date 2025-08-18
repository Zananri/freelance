<?php

namespace App\Http\Controllers;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Carbon\Carbon;
use App\Models\Employee;
use App\Models\EmployeeShift;
use App\Models\Attendance;
use App\Models\AttendanceTracking;
use Illuminate\Http\Request;

class AttendanceController extends Controller
{
    /**
     * Get the latest unclosed check-in attendance for an employee
     */
    public function getLatestUnclosedAttendance($employeeId)
    {
        try {
            $attendance = Attendance::where('employee_id', $employeeId)
                ->whereNull('time_out')
                ->orderBy('date_attendance', 'desc')
                ->orderBy('time_in', 'desc')
                ->first();

            if (!$attendance) {
                return response()->json([
                    'code' => 404,
                    'status' => 'not_found',
                    'data' => null,
                    'message' => 'No unclosed check-in found'
                ]);
            }

            return response()->json([
                'code' => 200,
                'status' => 'success',
                'data' => $attendance,
                'message' => 'Latest unclosed check-in retrieved successfully'
            ]);
        } catch (\Exception $e) {
            \Log::error('Error fetching latest unclosed attendance:', [
                'employee_id' => $employeeId,
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'code' => 500,
                'status' => 'error',
                'data' => null,
                'message' => 'Server error: ' . $e->getMessage()
            ], 500);
        }
    }
    /**
     * Display a listing of the resource.
     */
  
    public function showAttendancePage()
    {
        $userId = Auth::id();
        $employee = Employee::with('division')->where('user_id', $userId)->first();

        // Fetch today's attendance for the employee
        $today = Carbon::today()->toDateString();
        $attendance = null;
        if ($employee) {
            $attendance = Attendance::where('employee_id', $employee->id)
                ->where('date_attendance', $today)
                ->where('type_attendance', 'check_in')
                ->first();
        }

        // Debug log to check division data
        \Log::info('Employee division:', ['division' => $employee ? $employee->division : null]);

        return view('attendance/attendance', compact('employee', 'attendance'));
    }

    public function index()
    {
        //
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
        try {
            DB::beginTransaction();

            \Log::info('Attendance store request data:', [
                'all_data' => $request->all(),
                'files' => $request->allFiles(),
                'headers' => $request->headers->all()
            ]);

            $validated = $request->validate([
                'employee_id' => 'required|exists:employees,id',
                'is_work_outside' => 'required|in:0,1,true,false',
                'date_attendance' => 'required|date',
                'time_in' => 'required|date_format:H:i',
                'note' => 'nullable|string|max:500',
                'type_attendance' => 'required|in:check_in,check_out',
                'image' => 'nullable|image|mimes:jpeg,png,jpg|max:2048',
            ]);

            $userId = Auth::id();
            $now = Carbon::now();
            $dateTime = Carbon::parse($validated['date_attendance'] . ' ' . $validated['time_in']);

            // Ensure image is initialized as an array
          $imageArray = [];

if ($request->hasFile('image')) {
    $image = $request->file('image');
    $imageName = 'ATTENDANCE_' . time() . '.' . $image->getClientOriginalExtension();

    // Tentukan path tujuan
    $destinationPath = public_path('file/attendance');

    // Pindahkan file ke folder tujuan
    $image->move($destinationPath, $imageName);

    // Simpan path relatif ke array
    $imageArray[] = 'file/attendance/' . $imageName;
}


            // Get employee shift for late calculation
            $employeeShift = EmployeeShift::where('employee_id', $validated['employee_id'])
                ->where('date_shift', $validated['date_attendance'])
                ->first();

            $timeLate = null;
            if ($employeeShift) {
                $shiftStartTime = Carbon::parse($employeeShift->time_start);
                $shiftEndTime = Carbon::parse($employeeShift->time_end);
                $checkInTime = Carbon::parse($validated['date_attendance'] . ' ' . $validated['time_in']);
                
                // Handle night shift (where start time > end time)
                if ($shiftStartTime->gt($shiftEndTime) && $checkInTime->lt($shiftStartTime)) {
                    $shiftStartTime->subDay();
                }
                
                // Calculate late time if check-in is after shift start
                if ($checkInTime->gt($shiftStartTime)) {
                    $timeLate = $checkInTime->diff($shiftStartTime)->format('%H:%I');
                }
            }

            // Create attendance record
            $attendance = Attendance::create([
                'employee_id' => $validated['employee_id'],
                'date_attendance' => $validated['date_attendance'],
                'time_in' => $validated['time_in'],
                'type_attendance' => $validated['type_attendance'],
                'note' => $validated['note'] ?? null,
                'image' => $imageArray,
                'time_late' => $timeLate,
                'created_by' => $userId,
                'updated_by' => $userId,
            ]);

            // Create attendance tracking record
            $attendanceTracking = AttendanceTracking::create([
                'attendance_id' => $attendance->id,
                'is_work_outside' => filter_var($validated['is_work_outside'], FILTER_VALIDATE_BOOLEAN),
                'type' => $validated['type_attendance'],
                'location' => null, // Set null dulu sesuai permintaan
                'device' => null,   // Set null dulu sesuai permintaan
                'image' => $imageArray, // Simpan juga di attendance_trackings
                'date_time' => $dateTime,
                'created_by' => $userId,
                'updated_by' => $userId,
            ]);

            DB::commit();

            return response()->json([
                'code' => 200,
                'status' => 'success',
                'data' => [
                    'attendance' => $attendance,
                    'attendance_tracking' => $attendanceTracking
                ],
                'message' => 'Attendance recorded successfully'
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Attendance store error:', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'code' => 500,
                'status' => 'error',
                'data' => [],
                'message' => 'Server error: ' . $e->getMessage()
            ], 500);
        }
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
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        //
    }

    /**
     * Get today's attendance for specific employee
     */
    public function getTodayAttendance($employeeId)
    {
        try {
            $today = Carbon::today()->toDateString();

            // Return all attendance records for today (multiple check-ins/outs)
            $attendances = Attendance::where('employee_id', $employeeId)
                ->where('date_attendance', $today)
                ->orderBy('time_in', 'asc')
                ->get();

            if ($attendances->isEmpty()) {
                return response()->json([
                    'code' => 404,
                    'status' => 'not_found',
                    'data' => null,
                    'message' => 'No attendance record found for today'
                ]);
            }

            return response()->json([
                'code' => 200,
                'status' => 'success',
                'data' => $attendances,
                'message' => 'Today\'s attendance retrieved successfully'
            ]);
        } catch (\Exception $e) {
            \Log::error('Error fetching today\'s attendance:', [
                'employee_id' => $employeeId,
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'code' => 500,
                'status' => 'error',
                'data' => null,
                'message' => 'Server error: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Handle check-out for attendance
     */
    public function checkout(Request $request)
    {
        try {
            DB::beginTransaction();

            $validated = $request->validate([
                'employee_id' => 'required|exists:employees,id',
                'image' => 'nullable|image|mimes:jpeg,png,jpg|max:2048',
            ]);

            $today = Carbon::today()->toDateString();

            // Find the latest check-in without checkout, including previous day if any
            $attendance = Attendance::where('employee_id', $validated['employee_id'])
                ->whereNull('time_out')
                ->orderBy('date_attendance', 'desc')
                ->orderBy('time_in', 'desc')
                ->first();

            if (!$attendance) {
                return response()->json([
                    'code' => 404,
                    'status' => 'error',
                    'data' => [],
                    'message' => 'No active check-in found to check out!'
                ], 404);
            }

            $now = Carbon::now();
            $userId = auth()->id();
            $imageArray = [];

            // Handle image upload for checkout
            if ($request->hasFile('image')) {
                $image = $request->file('image');
                $imageName = 'ATTENDANCE_CHECKOUT_' . time() . '.' . $image->getClientOriginalExtension();
                $destinationPath = public_path('file/attendance');
                $image->move($destinationPath, $imageName);
                $imageArray[] = 'file/attendance/' . $imageName;
            }

            // Get the original check-in attendance tracking to determine if work outside
            $checkInTracking = AttendanceTracking::where('attendance_id', $attendance->id)
                ->where('type', 'check_in')
                ->first();

            $isWorkOutside = $checkInTracking ? $checkInTracking->is_work_outside : false;

            if ($attendance->date_attendance < $today) {
                // Previous day check-in without checkout, create new checkout record for today
                $checkout = Attendance::create([
                    'employee_id' => $validated['employee_id'],
                    'date_attendance' => $today,
                    'time_in' => null,
                    'time_out' => $now->format('H:i'),
                    'type_attendance' => 'check_out',
                    'note' => $request->input('note') ?? null,
                    'image' => $imageArray,
                    'updated_by' => $userId,
                ]);

                // Create attendance tracking record for checkout
                $attendanceTracking = AttendanceTracking::create([
                    'attendance_id' => $checkout->id,
                    'is_work_outside' => $isWorkOutside,
                    'type' => 'check_out',
                    'location' => null,
                    'device' => null,
                    'image' => $imageArray,
                    'date_time' => $now,
                    'created_by' => $userId,
                    'updated_by' => $userId,
                ]);
            } else {
                // Same day check-in, update the existing record
                $currentImages = $attendance->image ?? [];
                $mergedImages = array_merge($currentImages, $imageArray);
                
                $updateData = [
                    'time_out' => $now->format('H:i'),
                    'type_attendance' => 'check_out',
                    'image' => $mergedImages,
                    'updated_by' => $userId,
                ];

                if ($request->has('note')) {
                    $updateData['note'] = $request->input('note');
                }

                $attendance->update($updateData);

                // Create attendance tracking record for checkout
                $attendanceTracking = AttendanceTracking::create([
                    'attendance_id' => $attendance->id,
                    'is_work_outside' => $isWorkOutside,
                    'type' => 'check_out',
                    'location' => null,
                    'device' => null,
                    'image' => $imageArray,
                    'date_time' => $now,
                    'created_by' => $userId,
                    'updated_by' => $userId,
                ]);
            }

            DB::commit();

            return response()->json([
                'code' => 200,
                'status' => 'success',
                'data' => [
                    'attendance' => $attendance,
                    'attendance_tracking' => $attendanceTracking
                ],
                'message' => 'Check-out successful!'
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Attendance checkout error:', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'code' => 500,
                'status' => 'error',
                'data' => [],
                'message' => 'Server error: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get attendance records for an employee for a specific month
     */
    public function getMonthlyAttendance($employeeId, $year, $month)
    {
        try {
            $startDate = Carbon::createFromDate($year, $month, 1)->startOfMonth()->toDateString();
            $endDate = Carbon::createFromDate($year, $month, 1)->endOfMonth()->toDateString();

            // Return all attendance records for the month (multiple per day)
            $attendances = Attendance::where('employee_id', $employeeId)
                ->whereBetween('date_attendance', [$startDate, $endDate])
                ->orderBy('date_attendance', 'asc')
                ->orderBy('time_in', 'asc')
                ->get(['date_attendance', 'type_attendance', 'time_in', 'time_out']);

            return response()->json([
                'code' => 200,
                'status' => 'success',
                'data' => $attendances,
                'message' => 'Monthly attendance retrieved successfully'
            ]);
        } catch (\Exception $e) {
            \Log::error('Error fetching monthly attendance:', [
                'employee_id' => $employeeId,
                'year' => $year,
                'month' => $month,
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'code' => 500,
                'status' => 'error',
                'data' => null,
                'message' => 'Server error: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get all attendance records for a specific day for an employee
     */
    public function getDailyAttendances($employeeId, $date)
    {
        try {
            // Validate date format
            $dateObj = Carbon::createFromFormat('Y-m-d', $date);
            if (!$dateObj) {
                return response()->json([
                    'code' => 400,
                    'status' => 'error',
                    'data' => null,
                    'message' => 'Invalid date format'
                ], 400);
            }

            $attendances = Attendance::with(['attendanceTrackings' => function($query) {
                $query->where('type', 'check_in');
            }])
            ->where('employee_id', $employeeId)
            ->where('date_attendance', $dateObj->toDateString())
            ->orderBy('time_in', 'asc')
            ->get()
            ->map(function($attendance) {
                // Get is_work_outside from attendance_trackings
                $checkInTracking = $attendance->attendanceTrackings->first();
                $attendance->is_work_outside = $checkInTracking ? $checkInTracking->is_work_outside : false;
                return $attendance;
            });

            if ($attendances->isEmpty()) {
                return response()->json([
                    'code' => 404,
                    'status' => 'not_found',
                    'data' => null,
                    'message' => 'No attendance record found for the date'
                ]);
            }

            return response()->json([
                'code' => 200,
                'status' => 'success',
                'data' => $attendances,
                'message' => 'Daily attendance retrieved successfully'
            ]);
        } catch (\Exception $e) {
            \Log::error('Error fetching daily attendance:', [
                'employee_id' => $employeeId,
                'date' => $date,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'code' => 500,
                'status' => 'error',
                'data' => null,
                'message' => 'Server error: ' . $e->getMessage()
            ], 500);
        }
    }
}
