<?php

namespace App\Http\Controllers;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use App\Models\Employee;

use Illuminate\Http\Request;

class AttendanceController extends Controller
{
    /**
     * Display a listing of the resource.
     */
  
    public function showAttendancePage()
    {
        $userId = Auth::id();
        $employee = Employee::with('division')->where('user_id', $userId)->first();

        // Debug log to check division data
        \Log::info('Employee division:', ['division' => $employee ? $employee->division : null]);

        return view('attendance/attendance', compact('employee'));
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
            // Validate the request
            $validated = $request->validate([
                'employee_id' => 'required|exists:employees,id',
                'is_work_outside' => 'required|boolean',
                'date_attendance' => 'required|date',
                'time_in' => 'required|date_format:H:i',
                'note' => 'nullable|string|max:500',
                'image' => 'nullable|image|mimes:jpeg,png,jpg|max:2048',
            ]);

            // Check if already checked in today
            $existingAttendance = Attendance::where('employee_id', $validated['employee_id'])
                ->where('date_attendance', $validated['date_attendance'])
                ->first();

            if ($existingAttendance) {
                throw new \Exception('You have already checked in for today!');
            }

            // Calculate late time if check-in is after 09:15
            $checkInTime = \Carbon\Carbon::createFromFormat('H:i', $validated['time_in']);
            $lateThreshold = \Carbon\Carbon::createFromFormat('H:i', '09:15');
            $timeLate = null;

            if ($checkInTime->gt($lateThreshold)) {
                $timeLate = $checkInTime->diff($lateThreshold)->format('%H:%I');
            }

            // Handle image upload
            $imagePath = null;
            if ($request->hasFile('image')) {
                $image = $request->file('image');
                $imageName = 'attendance_' . time() . '.' . $image->getClientOriginalExtension();
                $imagePath = $image->storeAs('attendance_images', $imageName, 'public');
            }

            // Create attendance record
            $attendance = Attendance::create([
                'employee_id' => $validated['employee_id'],
                'is_work_outside' => $validated['is_work_outside'],
                'date_attendance' => $validated['date_attendance'],
                'time_in' => $validated['time_in'],
                'time_late' => $timeLate,
                'type_attendance' => 'check_in',
                'note' => $validated['note'] ?? null,
                'image' => $imagePath ? 'storage/' . $imagePath : null,
            ]);

            DB::commit();

            return response()->json([
                'code' => 200,
                'status' => 'success',
                'data' => $attendance,
                'message' => 'Check-in successful!'
            ]);

        } catch (ValidationException $e) {
            DB::rollBack();
            return response()->json([
                'code' => 422,
                'status' => 'error',
                'data' => [],
                'message' => 'Validation error',
                'errors' => $e->errors()
            ], 422);
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
}
