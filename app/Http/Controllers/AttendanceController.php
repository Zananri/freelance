<?php

namespace App\Http\Controllers;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Carbon\Carbon;
use App\Models\Employee;
use App\Models\Attendance;
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
                'image' => 'nullable|file|mimes:jpeg,png,jpg|max:2048',
            ]);

            $isWorkOutside = $validated['is_work_outside'];

            // Allow multiple check-ins per day, no conflict check needed

            $timeIn = $validated['time_in'];
            $checkInTime = Carbon::createFromFormat('H:i', $timeIn);
            $lateThreshold = Carbon::createFromFormat('H:i', '09:00');
            $timeLate = null;

            if ($checkInTime->gt($lateThreshold)) {
                $timeLate = $checkInTime->diff($lateThreshold)->format('%H:%I');
            }

            $imageName = null;
            if ($request->hasFile('image')) {
                $t = time();
                $imageName = 'ATTENDANCE_' . $t . '.' . $request->image->extension();
                $request->image->move(public_path('file/attendance'), $imageName);
            }
            $imagePath = $imageName ? 'attendance/' . $imageName : null;

            $attendance = Attendance::create([
                'employee_id' => $validated['employee_id'],
                'is_work_outside' => $isWorkOutside,
                'date_attendance' => $validated['date_attendance'],
                'time_in' => $timeIn,
                'time_late' => $timeLate,
                'type_attendance' => 'check_in',
                'note' => $validated['note'] ?? null,
                'image' => $imagePath ? 'file/' . $imagePath : null,
            ]);

            DB::commit();

            \Log::info('Attendance created successfully:', ['attendance_id' => $attendance->id]);

            return response()->json([
                'code' => 200,
                'status' => 'success',
                'data' => $attendance,
                'message' => 'Check-in successful!'
            ]);
        } catch (ValidationException $e) {
            DB::rollBack();
            \Log::error('Validation error:', $e->errors());
            return response()->json([
                'code' => 422,
                'status' => 'error',
                'data' => [],
                'message' => 'Validation error',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Attendance store error:', ['error' => $e->getMessage(), 'trace' => $e->getTraceAsString()]);
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

            if ($attendance->date_attendance < $today) {
                // Previous day check-in without checkout, create new checkout record for today
                $checkout = Attendance::create([
                    'employee_id' => $validated['employee_id'],
                    'is_work_outside' => $attendance->is_work_outside,
                    'date_attendance' => $today,
                    'time_in' => null,
                    'time_out' => $now->format('H:i'),
                    'type_attendance' => 'check_out',
                    'note' => $request->input('note') ?? null,
                    'image' => null,
                ]);
                DB::commit();

                return response()->json([
                    'code' => 200,
                    'status' => 'success',
                    'data' => $checkout,
                    'message' => 'Check-out successful for today!'
                ]);
            } else {
                // Same day check-in, update the existing record
                $updateData = [
                    'time_out' => $now->format('H:i'),
                    'type_attendance' => 'check_out'
                ];

                if ($request->has('note')) {
                    $updateData['note'] = $request->input('note');
                }

                $attendance->update($updateData);

                DB::commit();

                return response()->json([
                    'code' => 200,
                    'status' => 'success',
                    'data' => $attendance,
                    'message' => 'Check-out successful!'
                ]);
            }
        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Attendance checkout error:', ['error' => $e->getMessage()]);
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
}
