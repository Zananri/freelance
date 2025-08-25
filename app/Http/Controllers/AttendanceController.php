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
use App\Helpers\DeviceHelper;
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
        $attendanceStatus = [
            'check_in' => 'pending',
            'check_out' => 'pending'
        ];

        if ($employee) {
            $attendance = Attendance::where('employee_id', $employee->id)
                ->where('date_attendance', $today)
                ->where('type_attendance', 'check_in')
                ->first();

            // Determine attendance status based on today's records
            if ($attendance) {
                $attendanceStatus['check_in'] = 'completed';
                
                // Check if there's a corresponding check-out
                $checkOut = Attendance::where('employee_id', $employee->id)
                    ->where('date_attendance', $today)
                    ->where('type_attendance', 'check_out')
                    ->first();
                
                if ($checkOut) {
                    $attendanceStatus['check_out'] = 'completed';
                }
            }
        }

        // Debug log to check division data
        \Log::info('Employee division:', ['division' => $employee ? $employee->division : null]);

        if ($employee) {
            $shift = EmployeeShift::where('employee_id', $employee->id)
                ->where('date_shift', $today)
                ->first();

            if ($attendance) {
                $timeIn = $attendance->time_in;
                $timeStart = $shift->time_start ?? null;
                $isLate = isset($timeStart, $timeIn) && strtotime($timeIn) > strtotime($timeStart);
            } else {
                $timeIn = null;
                $isLate = false;
            }
        }

        return view('attendance/attendance', compact('employee', 'attendance', 'attendanceStatus', 'timeIn', 'isLate'));
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


            // Get employee shift for validation and late calculation
            $employeeShift = EmployeeShift::where('employee_id', $validated['employee_id'])
                ->where('date_shift', $validated['date_attendance'])
                ->first();

            if (!$employeeShift) {
                return response()->json([
                    'code' => 400,
                    'status' => 'error',
                    'data' => [],
                    'message' => 'No shift assigned for this date'
                ], 400);
            }

            $shiftStartTime = Carbon::parse($employeeShift->time_start);
            $shiftEndTime = Carbon::parse($employeeShift->time_end);
            $checkInTime = Carbon::parse($validated['date_attendance'] . ' ' . $validated['time_in']);
            
            // Handle night shift (where start time > end time)
            if ($shiftStartTime->gt($shiftEndTime) && $checkInTime->lt($shiftStartTime)) {
                $shiftStartTime->subDay();
            }
            
            // Validasi waktu check-in: minimal 1 jam sebelum shift dimulai atau setelah shift dimulai
            $minCheckInTime = $shiftStartTime->copy()->subHour();
            
            if ($checkInTime->lt($minCheckInTime)) {
                return response()->json([
                    'code' => 400,
                    'status' => 'error',
                    'data' => [],
                    'message' => 'Check-in not allowed. You can only check-in 1 hour before your shift starts at ' . $shiftStartTime->format('H:i')
                ], 400);
            }
            
            // Tidak ada batasan maksimum untuk check-in setelah shift dimulai

            $timeLate = null;
            // Calculate late time if check-in is after shift start
            if ($checkInTime->gt($shiftStartTime)) {
                $timeLate = $checkInTime->diff($shiftStartTime)->format('%H:%I');
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
                'device' => DeviceHelper::getDeviceFromRequest($request), // Simpan device awal
                'image' => $imageArray, // Simpan juga di attendance_trackings
                'date_time' => $dateTime,
                'created_by' => $userId,
                'updated_by' => $userId,
            ]);

            // Update location field for check-in
            if ($validated['type_attendance'] === 'check_in') {
                $latitude = $request->input('latitudeCheckIn') ?? $request->input('latitude');
                $longitude = $request->input('longitudeCheckIn') ?? $request->input('longitude');
                
                if ($latitude && $longitude) {
                    $location = $latitude . ',' . $longitude;
                    $attendanceTracking->update(['location' => $location]);
                }
            }

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
            // Include all trackings (we may update type to check_out on checkout) and preserve order
            $attendances = Attendance::with(['attendanceTrackings' => function($query) {
                    $query->orderBy('date_time', 'asc');
                }])
                ->where('employee_id', $employeeId)
                ->where('date_attendance', $today)
                ->orderBy('time_in', 'asc')
                ->get()
                ->map(function($attendance) {
                    // Use the first tracking (we keep one row and update it on checkout)
                    $tracking = $attendance->attendanceTrackings->first();
                    $attendance->is_work_outside = $tracking ? (bool)$tracking->is_work_outside : false;

                    // Initialize coordinates
                    $attendance->latitude = null;            // check-in lat
                    $attendance->longitude = null;           // check-in lng
                    $attendance->checkout_latitude = null;   // checkout lat
                    $attendance->checkout_longitude = null;  // checkout lng

                    // Parse location: "lat,lng|lat,lng" -> set both pairs
                    if ($tracking && $tracking->location) {
                        $pairs = explode('|', $tracking->location);
                        if (!empty($pairs[0])) {
                            $first = explode(',', $pairs[0]);
                            if (count($first) >= 2) {
                                $attendance->latitude = trim($first[0]);
                                $attendance->longitude = trim($first[1]);
                            }
                        }
                        if (!empty($pairs[1])) {
                            $second = explode(',', $pairs[1]);
                            if (count($second) >= 2) {
                                $attendance->checkout_latitude = trim($second[0]);
                                $attendance->checkout_longitude = trim($second[1]);
                            }
                        }
                    }

                    // Provide image paths: prefer tracking images; include checkout image as the last if available
                    $attendance->image_path = null;
                    $attendance->checkout_image_path = null;
                    try {
                        $trackingImages = [];
                        if ($tracking && !empty($tracking->image)) {
                            if (is_array($tracking->image)) {
                                $trackingImages = $tracking->image;
                            } elseif (is_string($tracking->image)) {
                                $trackingImages = [$tracking->image];
                            }
                        }

                        $attendanceImages = [];
                        if (!empty($attendance->image)) {
                            if (is_array($attendance->image)) {
                                $attendanceImages = $attendance->image;
                            } elseif (is_string($attendance->image)) {
                                $attendanceImages = [$attendance->image];
                            }
                        }

                        // image_path: first available image
                        if (!empty($trackingImages)) {
                            $attendance->image_path = $trackingImages[0];
                        } elseif (!empty($attendanceImages)) {
                            $attendance->image_path = $attendanceImages[0];
                        }

                        // checkout image: prefer last tracking image; fallback to last attendance image
                        if (count($trackingImages) > 1) {
                            $attendance->checkout_image_path = end($trackingImages);
                        } elseif (!empty($trackingImages)) {
                            $attendance->checkout_image_path = $trackingImages[count($trackingImages) - 1];
                        } elseif (count($attendanceImages) > 1) {
                            $attendance->checkout_image_path = end($attendanceImages);
                        } elseif (!empty($attendanceImages)) {
                            $attendance->checkout_image_path = $attendanceImages[count($attendanceImages) - 1];
                        }
                    } catch (\Exception $e) {
                        $attendance->image_path = $attendance->image_path ?? null;
                        $attendance->checkout_image_path = $attendance->checkout_image_path ?? null;
                    }

                    // Attach shift start/end for convenience (format HH:MM) if available
                    try {
                        $shift = EmployeeShift::where('employee_id', $attendance->employee_id)
                            ->where('date_shift', $attendance->date_attendance)
                            ->first();

                        if ($shift) {
                            $attendance->shift_start = $shift->time_start ? Carbon::parse($shift->time_start)->format('H:i') : null;
                            $attendance->shift_end = $shift->time_end ? Carbon::parse($shift->time_end)->format('H:i') : null;
                        } else {
                            $attendance->shift_start = null;
                            $attendance->shift_end = null;
                        }
                    } catch (\Exception $e) {
                        $attendance->shift_start = null;
                        $attendance->shift_end = null;
                    }

                    return $attendance;
                });

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

            // Log the incoming request data
            \Log::info('Checkout request data:', [
                'all_data' => $request->all(),
                'files' => $request->allFiles(),
                'headers' => $request->headers->all()
            ]);

            $validated = $request->validate([
                'employee_id' => 'required|exists:employees,id',
                'date_attendance' => 'required|date',
                'time_out' => 'required|date_format:H:i',
                'type_attendance' => 'required|in:check_out',
                'is_work_outside' => 'required|in:0,1',
                'image' => 'nullable|image|mimes:jpeg,png,jpg|max:2048',
                'note' => 'nullable|string|max:500',
            ]);

            $today = Carbon::today()->toDateString();
            
            // Validasi: tidak bisa checkout untuk hari sebelumnya
            if ($validated['date_attendance'] < $today) {
                return response()->json([
                    'code' => 400,
                    'status' => 'error',
                    'data' => [],
                    'message' => 'Cannot checkout for previous day. Please check in for today.'
                ], 400);
            }

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

            // Get employee shift for checkout validation
            $employeeShift = EmployeeShift::where('employee_id', $validated['employee_id'])
                ->where('date_shift', $validated['date_attendance'])
                ->first();

            if (!$employeeShift) {
                return response()->json([
                    'code' => 400,
                    'status' => 'error',
                    'data' => [],
                    'message' => 'No shift assigned for this date'
                ], 400);
            }

            $shiftEndTime = Carbon::parse($employeeShift->time_end);
            $shiftStartTime = Carbon::parse($employeeShift->time_start);
            $checkOutTime = Carbon::parse($validated['date_attendance'] . ' ' . $validated['time_out']);
            
            // Handle night shift (where start time > end time)
            if ($shiftStartTime->gt($shiftEndTime) && $checkOutTime->lt($shiftStartTime)) {
                $shiftEndTime->addDay();
            }
            
            // Validasi waktu check-out: tidak boleh sebelum time_end
            if ($checkOutTime->lt($shiftEndTime)) {
                return response()->json([
                    'code' => 400,
                    'status' => 'error',
                    'data' => [],
                    'message' => 'Check-out not allowed. You can only check-out after your shift ends at ' . $shiftEndTime->format('H:i')
                ], 400);
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

            // Get the existing attendance tracking record
            $attendanceTracking = AttendanceTracking::where('attendance_id', $attendance->id)
                ->where('type', 'check_in')
                ->first();

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

                // Create new attendance tracking for checkout
                $attendanceTracking = AttendanceTracking::create([
                    'attendance_id' => $checkout->id,
                    'is_work_outside' => $attendanceTracking ? $attendanceTracking->is_work_outside : false,
                    'type' => 'check_out',
                    'location' => null,
                    'device' => DeviceHelper::buildDeviceArray($attendanceTracking ? $attendanceTracking->device : null, DeviceHelper::getDeviceFromRequest($request)),
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
                    // Don't change type_attendance - keep it as 'check_in' to preserve check-in time display
                    'image' => $mergedImages,
                    'updated_by' => $userId,
                ];

                if ($request->has('note')) {
                    $updateData['note'] = $request->input('note');
                }

                $attendance->update($updateData);

                // Update existing attendance tracking record instead of creating new one
                if ($attendanceTracking) {
                    $trackingImages = $attendanceTracking->image ?? [];
                    $mergedTrackingImages = array_merge($trackingImages, $imageArray);
                    
                    // Get current device for checkout
                    $checkOutDevice = DeviceHelper::getDeviceFromRequest($request);
                    $checkInDevice = $attendanceTracking->device;
                    
                    $attendanceTracking->update([
                        'type' => 'check_out',
                        'image' => $mergedTrackingImages,
                        'device' => $checkInDevice . ',' . $checkOutDevice, // Gabungkan dengan separator |
                        'date_time' => $now,
                        'updated_by' => $userId,
                    ]);
                } else {
                    // Fallback: create new tracking if not found
                    $checkOutDevice = DeviceHelper::getDeviceFromRequest($request);
                    $attendanceTracking = AttendanceTracking::create([
                        'attendance_id' => $attendance->id,
                        'is_work_outside' => false,
                        'type' => 'check_out',
                        'location' => null,
                        'device' => $checkOutDevice . '|' . $checkOutDevice, // Use same device with separator since we don't have check-in device
                        'image' => $imageArray,
                        'date_time' => $now,
                        'created_by' => $userId,
                        'updated_by' => $userId,
                    ]);
                }
            }

            // Update location field for check-out
            if ($validated['type_attendance'] === 'check_out' && $attendanceTracking) {
                $latitude = $request->input('latitude');
                $longitude = $request->input('longitude');
                
                if ($latitude && $longitude) {
                    $checkOutLocation = $latitude . ',' . $longitude;
                    $checkInLocation = $attendanceTracking->location;
                    
                    // If there's already a check-in location, append the checkout location
                    if ($checkInLocation) {
                        $attendanceTracking->update(['location' => $checkInLocation . '|' . $checkOutLocation]);
                    } else {
                        // If no check-in location, just store the checkout location
                        $attendanceTracking->update(['location' => $checkOutLocation]);
                    }
                }
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
                $query->orderBy('date_time', 'asc');
            }])
            ->where('employee_id', $employeeId)
            ->where('date_attendance', $dateObj->toDateString())
            ->orderBy('time_in', 'asc')
            ->get()
            ->map(function($attendance) {
                // Expose work outside and coordinates from tracking (which may hold combined locations)
                $tracking = $attendance->attendanceTrackings->first();
                $attendance->is_work_outside = $tracking ? (bool)$tracking->is_work_outside : false;

                // Initialize coordinates
                $attendance->latitude = null;
                $attendance->longitude = null;
                $attendance->checkout_latitude = null;
                $attendance->checkout_longitude = null;

                if ($tracking && $tracking->location) {
                    $pairs = explode('|', $tracking->location);
                    if (!empty($pairs[0])) {
                        $first = explode(',', $pairs[0]);
                        if (count($first) >= 2) {
                            $attendance->latitude = trim($first[0]);
                            $attendance->longitude = trim($first[1]);
                        }
                    }
                    if (!empty($pairs[1])) {
                        $second = explode(',', $pairs[1]);
                        if (count($second) >= 2) {
                            $attendance->checkout_latitude = trim($second[0]);
                            $attendance->checkout_longitude = trim($second[1]);
                        }
                    }
                }

                // Attach shift start/end for convenience (format HH:MM) if available
                try {
                    $shift = EmployeeShift::where('employee_id', $attendance->employee_id)
                        ->where('date_shift', $attendance->date_attendance)
                        ->first();

                    if ($shift) {
                        $attendance->shift_start = $shift->time_start ? Carbon::parse($shift->time_start)->format('H:i') : null;
                        $attendance->shift_end = $shift->time_end ? Carbon::parse($shift->time_end)->format('H:i') : null;
                    } else {
                        $attendance->shift_start = null;
                        $attendance->shift_end = null;
                    }
                } catch (\Exception $e) {
                    $attendance->shift_start = null;
                    $attendance->shift_end = null;
                }

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

    /**
     * Get employee shift details for a specific date
     */
    public function getEmployeeShiftDetails($employeeId, $date)
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

            $employeeShift = EmployeeShift::where('employee_id', $employeeId)
                ->where('date_shift', $dateObj->toDateString())
                ->first();

            if (!$employeeShift) {
                return response()->json([
                    'code' => 404,
                    'status' => 'not_found',
                    'data' => null,
                    'message' => 'No shift assigned for this date'
                ]);
            }

            $shiftStartTime = Carbon::parse($employeeShift->time_start);
            $shiftEndTime = Carbon::parse($employeeShift->time_end);
            
            // Handle night shift
            if ($shiftStartTime->gt($shiftEndTime)) {
                $shiftEndTime->addDay();
            }

            $minCheckInTime = $shiftStartTime->copy()->subHour();
            $maxCheckInTime = $shiftStartTime;
            $minCheckOutTime = $shiftEndTime;

            return response()->json([
                'code' => 200,
                'status' => 'success',
                'data' => [
                    'shift' => $employeeShift,
                    'time_start' => $shiftStartTime->format('H:i'),
                    'time_end' => $shiftEndTime->format('H:i'),
                    'min_checkin_time' => $minCheckInTime->format('H:i'),
                    'max_checkin_time' => $maxCheckInTime->format('H:i'),
                    'min_checkout_time' => $minCheckOutTime->format('H:i'),
                    'current_time' => Carbon::now()->format('H:i')
                ],
                'message' => 'Employee shift details retrieved successfully'
            ]);
        } catch (\Exception $e) {
            \Log::error('Error fetching employee shift details:', [
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

    /**
     * Get today's attendance status for button states
     */
    public function getTodayStatus($employeeId)
    {
        try {
            $today = Carbon::today()->toDateString();
            
            // Get all attendance records for today
            $attendances = Attendance::where('employee_id', $employeeId)
                ->where('date_attendance', $today)
                ->orderBy('time_in', 'asc')
                ->get();

            $status = [
                'has_checked_in' => false,
                'has_checked_out' => false,
                'last_check_in_time' => null,
                'last_check_out_time' => null,
                'can_check_in' => true,
                'can_check_out' => false,
                'status' => 'not_started'
            ];

            if ($attendances->isEmpty()) {
                $status['status'] = 'not_started';
                $status['can_check_in'] = true;
                $status['can_check_out'] = false;
            } else {
                $lastAttendance = $attendances->last();
                
                // Check based on time_in and time_out fields instead of type_attendance
                if ($lastAttendance->time_in && !$lastAttendance->time_out) {
                    // Has checked in but not checked out
                    $status['has_checked_in'] = true;
                    $status['last_check_in_time'] = $lastAttendance->time_in;
                    $status['can_check_in'] = false;
                    $status['can_check_out'] = true;
                    $status['status'] = 'checked_in';
                } elseif ($lastAttendance->time_in && $lastAttendance->time_out) {
                    // Has both checked in and checked out
                    $status['has_checked_in'] = true;
                    $status['has_checked_out'] = true;
                    $status['last_check_in_time'] = $lastAttendance->time_in;
                    $status['last_check_out_time'] = $lastAttendance->time_out;
                    $status['can_check_in'] = true; // Allow new check-in for next shift
                    $status['can_check_out'] = false;
                    $status['status'] = 'checked_out';
                }
            }

            // Check for unclosed attendance from previous day
            $unclosed = Attendance::where('employee_id', $employeeId)
                ->whereNull('time_out')
                ->where('date_attendance', '<', $today)
                ->orderBy('date_attendance', 'desc')
                ->first();

            if ($unclosed) {
                $status['has_unclosed'] = true;
                $status['unclosed_date'] = $unclosed->date_attendance;
            }

            return response()->json([
                'code' => 200,
                'status' => 'success',
                'data' => $status,
                'message' => 'Today\'s attendance status retrieved successfully'
            ]);

        } catch (\Exception $e) {
            \Log::error('Error fetching today\'s attendance status:', [
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
}
