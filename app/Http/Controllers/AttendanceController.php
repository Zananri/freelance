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
    $timeIn = null;
    $isLate = false;
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

            // Ensure display uses HH:MM
            $timeIn = $attendance && $attendance->time_in
                ? Carbon::parse($attendance->time_in)->format('H:i')
                : null;
            // Lateness should reflect the shift at the time of check-in; rely on persisted time_late
            $isLate = $attendance && !empty($attendance->time_late);
        }

        return view('attendance.attendance', compact('employee', 'attendance', 'attendanceStatus', 'timeIn', 'isLate'));
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

            $validated = $request->validate([
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


            // Choose shift source for validation and late calculation
            $today = Carbon::today()->toDateString();
            $checkDate = $validated['date_attendance'];

            // Prefer per-date EmployeeShift if exists; fallback to base shift
            $employeeShift = EmployeeShift::where('employee_id', $validated['employee_id'])
                ->where('date_shift', $checkDate)
                ->first();

            $baseShiftObj = null;
            if (!$employeeShift) {
                $emp = Employee::with('shift')->find($validated['employee_id']);
                if ($emp && $emp->shift) {
                    // Read raw times from Shift to avoid datetime casting side effects
                    $baseShiftObj = (object) [
                        'time_start' => $emp->shift->getRawOriginal('time_start') ?? $emp->shift->time_start,
                        'time_end' => $emp->shift->getRawOriginal('time_end') ?? $emp->shift->time_end,
                    ];
                }
            }

            $shiftStartTime = null;
            $shiftEndTime = null;
            // Parse shift times using the attendance date for consistency
        if ($employeeShift) {
                // EmployeeShift does not hold raw times; use its related Shift
                $shiftModel = $employeeShift->loadMissing('shift')->shift;
                if ($shiftModel) {
                    $rawStart = $shiftModel->getRawOriginal('time_start') ?? $shiftModel->time_start;
                    $rawEnd = $shiftModel->getRawOriginal('time_end') ?? $shiftModel->time_end;
                    $shiftStartTime = $rawStart ? Carbon::parse($checkDate . ' ' . $rawStart) : null;
                    $shiftEndTime = $rawEnd ? Carbon::parse($checkDate . ' ' . $rawEnd) : null;
                }
            } elseif ($baseShiftObj) {
                // Fallback to base shift
                if (!empty($baseShiftObj->time_start)) {
                    $shiftStartTime = Carbon::parse($checkDate . ' ' . $baseShiftObj->time_start);
                }
                if (!empty($baseShiftObj->time_end)) {
                    $shiftEndTime = Carbon::parse($checkDate . ' ' . $baseShiftObj->time_end);
                }
            }

            $checkInTime = Carbon::parse($validated['date_attendance'] . ' ' . $validated['time_in']);
            
            // If we have shift times (from per-date or base), enforce rules; otherwise, allow check-in
            if ($shiftStartTime && $shiftEndTime) {
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
            }
            
            // Tidak ada batasan maksimum untuk check-in setelah shift dimulai

            $timeLate = null;
            // Calculate late time if we have a shift start and check-in is after shift start
            if ($shiftStartTime && $checkInTime->gt($shiftStartTime)) {
                // Compute lateness in seconds and format to HH:MM:SS for TIME column compatibility
                $diffSeconds = $shiftStartTime->diffInSeconds($checkInTime);
                $hours = floor($diffSeconds / 3600);
                $minutes = floor(($diffSeconds % 3600) / 60);
                $seconds = $diffSeconds % 60;
                $timeLate = sprintf('%02d:%02d:%02d', $hours, $minutes, $seconds);
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

            // Auto-create per-date EmployeeShift on first check-in if none exists, using base shift
            try {
                if ($validated['type_attendance'] === 'check_in') {
                    // Only create if there's no per-date shift yet for this employee and date
                    $existingPerDate = EmployeeShift::where('employee_id', $validated['employee_id'])
                        ->where('date_shift', $validated['date_attendance'])
                        ->first();

                    if (!$existingPerDate) {
                        // Get employee base shift_id
                        $empForShift = Employee::select('id', 'shift_id')->find($validated['employee_id']);
                        if ($empForShift && $empForShift->shift_id) {
                            // Create or update per-date shift with base shift
                            EmployeeShift::updateOrCreate(
                                [
                                    'employee_id' => $empForShift->id,
                                    'date_shift' => $validated['date_attendance'],
                                ],
                                [
                                    'shift_id' => $empForShift->shift_id,
                                ]
                            );

                            \Log::info('Auto-created per-date EmployeeShift from base shift on check-in', [
                                'employee_id' => $empForShift->id,
                                'date_shift' => $validated['date_attendance'],
                                'shift_id' => $empForShift->shift_id,
                            ]);
                        }
                    }
                }
            } catch (\Exception $e) {
                // Do not fail attendance on shift creation issues; log and continue
                \Log::warning('Failed to auto-create per-date EmployeeShift on check-in', [
                    'employee_id' => $validated['employee_id'] ?? null,
                    'date_shift' => $validated['date_attendance'] ?? null,
                    'error' => $e->getMessage(),
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
                'message' => 'Check-in submitted successfully!'
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

    public function submitCheckin(Request $request){
        try {
            DB::beginTransaction();

            $request->validate([
                'is_work_outside' => 'required|in:0,1,true,false',
                'latitudeCheckIn' => 'required',
                'longitudeCheckIn' => 'required',
                'photo_checkin' => 'nullable|image|mimes:jpeg,png,jpg|max:10048',
            ]);

            //$request->hasFile('photo_checkin');
            
            $user = auth()->user();
            $userId = $user->id;

            $workOutside = $request->input('is_work_outside');
            $latitude = $request->input('latitudeCheckIn');
            $longitude = $request->input('longitudeCheckIn');
            $location = $latitude . ',' . $longitude;

            //$image = $request->file('photo_checkin');
            //$imageName = 'ATTENDANCE_' . time() . '.' . $image->getClientOriginalExtension();

            $now = Carbon::now();
            $today = Carbon::today()->toDateString();
            $yesterday = Carbon::today()->subDays(1)->toDateString();

            $employee = Employee::with('shift')->where('user_id', $userId)->first();
            
            if(!$employee){
                throw new \Exception('Employee not found');
            }

            $shiftId = $employee->shift_id;
            $employeeShift = EmployeeShift::with('shift')->where('employee_id', $employee->id)
                    ->where('date_shift', $today)
            ->first();

            $employeeShiftYesterday = EmployeeShift::with('shift')->where('employee_id', $employee->id)
                ->where('date_shift', $yesterday)
            ->first();

            $shifTimeStart = Carbon::parse($employee->shift->time_start);
            $shifTimeEnd = Carbon::parse($employee->shift->time_end);

            if($employeeShift){
                $shiftId = $employeeShift->shift_id;

                $shifTimeStart = Carbon::parse($employeeShift->shift->time_start);
                $shifTimeEnd = Carbon::parse($employeeShift->shift->time_end);
            }else{

            }
            

            $checkEarlyTime = $now->diffInMinutes($shifTimeStart);

            if($checkEarlyTime > 60){
                throw new \Exception('To early to check in, your shift '.$shifTimeStart->format('H:i').' - '.$shifTimeEnd->format('H:i'));
            }

            if($now > $shifTimeEnd && ($shifTimeEnd > $shifTimeStart)){
                throw new \Exception('Check in only available in your shift '.$shifTimeStart->format('H:i').' - '.$shifTimeEnd->format('H:i'));
            }

            $imageArray = [];

            if ($request->hasFile('photo_checkin')) {

                $image = $request->file('photo_checkin');
                $imageName = 'ATTENDANCE_' . time() . '.' . $image->getClientOriginalExtension();

                $destinationPath = public_path('file/attendance');
                $image->move($destinationPath, $imageName);
                $imageArray[] = 'file/attendance/' . $imageName;
            }

            if($workOutside == 1 && count($imageArray) == 0){
                throw new \Exception('Work outside, please add photo');
            }

            $timeLate = '00:00:00';

            if($now > $shifTimeStart){
                $timeLate = $now->diff($shifTimeStart)->format('%H:%I:%S');
            }
            $attendanceExist = Attendance::where('employee_id',$employee->id)->where('date_attendance',$now->toDateString())->first();
            $attendanceId = 0;

            if($attendanceExist){
                $attendanceId = $attendanceExist->id;
                $attendanceExist->update([
                    'time_in' => $now->format('H:i'),
                    'updated_by' => $userId
                ]);
            }else{
                // Create attendance record
                $attendance = Attendance::create([
                    'employee_id' => $employee->id,
                    'date_attendance' => $now->toDateString(),
                    'time_in' => $now->format('H:i'),
                    'type_attendance' => 'check_in',
                    'note' => null,
                    'image' => $imageArray,
                    'time_late' => $timeLate,
                    'created_by' => $userId,
                    'updated_by' => $userId
                ]);

                $attendanceId = $attendance->id;

                EmployeeShift::updateOrCreate(
                    [
                        'employee_id' => $employee->id,
                        'date_shift' => $now->toDateString(),
                    ],
                    [
                        'shift_id' => $shiftId,
                    ]
                );
            }

            

            // Create attendance tracking record
            $attendanceTracking = AttendanceTracking::create([
                'attendance_id' => $attendanceId,
                'is_work_outside' => $workOutside,
                'type' => 'check_in',
                'location' => $location, // Set null dulu sesuai permintaan
                'device' => DeviceHelper::getDeviceFromRequest($request), // Simpan device awal
                'image' => $imageArray, // Simpan juga di attendance_trackings
                'date_time' => $now,
                'created_by' => $userId,
                'updated_by' => $userId
            ]);

            DB::commit();

            return response()->json([
                'code' => 200,
                'status' => 'success',
                'data' => [
                    'attendance' => $attendance,
                    'attendance_tracking' => $attendanceTracking
                ],
                'message' => 'Check In successfully'
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

    public function submitCheckout(Request $request){
        try {
            DB::beginTransaction();

            $request->validate([
                'is_work_outside' => 'required|in:0,1,true,false',
                'latitudeCheckOut' => 'required',
                'longitudeCheckOut' => 'required',
                'photo_checkout' => 'nullable|image|mimes:jpeg,png,jpg|max:10048',
            ]);

            //$request->hasFile('photo_checkin');
            
            $user = auth()->user();
            $userId = $user->id;

            $workOutside = $request->input('is_work_outside');
            $latitude = $request->input('latitudeCheckOut');
            $longitude = $request->input('longitudeCheckOut');
            $location = $latitude . ',' . $longitude;

            //$image = $request->file('photo_checkin');
            //$imageName = 'ATTENDANCE_' . time() . '.' . $image->getClientOriginalExtension();

            $now = Carbon::now();
            $today = Carbon::today()->toDateString();
            $yesterday = Carbon::today()->subDays(1)->toDateString();

            //$now = Carbon::parse('2025-09-07 03:15:00');
            $today = Carbon::parse('2025-09-07')->toDateString();
            $yesterday = Carbon::parse('2025-09-06')->toDateString();


            $employee = Employee::with('shift')->where('user_id', $userId)->first();
            
            $employeeShift = EmployeeShift::with('shift')->where('employee_id', $employee->id)
                ->where('date_shift', $today)
            ->first();

            $employeeShiftYesterday = EmployeeShift::with('shift')->where('employee_id', $employee->id)
                    ->where('date_shift', $yesterday)
            ->first();

            $attendance = Attendance::where('employee_id', $employee->id)
                ->where('date_attendance', $today)
            ->first();

            
            
            $timeStart = Carbon::parse($employee->shift->time_start);
            $timeEnd = Carbon::parse($employee->shift->time_end);
            
            
            if($employeeShift){
                $timeStart = Carbon::parse($employeeShift->shift->time_start);
                $timeEnd = Carbon::parse($employeeShift->shift->time_end);
            }

            
            $shiftTimeType = 'NORMAL';
            
            if($employeeShiftYesterday){

                $timeStartYesterday = Carbon::parse($employeeShiftYesterday->shift->time_start);
                $timeEndYesterday = Carbon::parse($employeeShiftYesterday->shift->time_end);

                if($timeEndYesterday < $timeStartYesterday){
                    $shiftTimeType = 'OVERNIGHT';

                    
                    
                    //Jika belum lewat 2 jam waktu checkout
                    if($now->diffInHours(Carbon::parse($today.' '.$employeeShiftYesterday->shift->time_end)) > -2){

                        $timeStart = $timeStartYesterday;
                        $timeEnd = $timeEndYesterday;
                        
                        $employeeShift = $employeeShiftYesterday;
                        $attendance = Attendance::where('employee_id', $employee->id)
                                ->where('date_attendance', $yesterday)
                        ->first();

                    }

                    //dd($now->diffInHours(Carbon::parse($today.' '.$employeeShiftYesterday->shift->time_end)),$attendance);
                }

            // dd($timeEndYesterday ,$now->diffInHours($timeEndYesterday),$attendance );
                
                
            }
            

            //dd($now,$shiftTimeType,$attendance);
            

            

            $imageArray = [];

            if ($request->hasFile('photo_checkout')) {

                $image = $request->file('photo_checkout');
                $imageName = 'ATTENDANCE_' . time() . '.' . $image->getClientOriginalExtension();

                $destinationPath = public_path('file/attendance');
                $image->move($destinationPath, $imageName);
                $imageArray[] = 'file/attendance/' . $imageName;
            }

            if($workOutside == 1 && count($imageArray) == 0){
                throw new \Exception('Work outside, please add photo');
            }

 

            $attendanceId = 0;

            if($attendance){
                
                $attendanceId = $attendance->id;

                $attendance->update([
                    'time_out' => $now->format('H:i'),
                    'updated_by' => $userId
                ]);
                

            }else{
                // Create attendance record
                $attendanceNew = Attendance::create([
                    'employee_id' => $employee->id,
                    'date_attendance' => $now->toDateString(),
                    'time_out' => $now->format('H:i'),
                    'type_attendance' => 'check_out',
                    'note' => null,
                    'image' => $imageArray,
                    'created_by' => $userId,
                    'updated_by' => $userId
                ]);

                $attendanceId = $attendanceNew->id;

                
            }
            
            $attendanceTracking = AttendanceTracking::where('attendance_id', $attendanceId)
                ->where('type', 'check_out')
            ->first();

            if($attendanceTracking){

                $attendanceTracking->update([
                    'time_out' => $now->format('H:i'),
                    'date_time' => $now,
                    'device' => DeviceHelper::getDeviceFromRequest($request),
                    'location' => $location,
                    'is_work_outside' => $workOutside,
                    'image' => $imageArray,
                    'updated_by' => $userId
                ]);
 

            }else{
                // Create attendance tracking record
                $attendanceTracking = AttendanceTracking::create([
                    'attendance_id' => $attendanceId,
                    'is_work_outside' => $workOutside,
                    'type' => 'check_out',
                    'location' => $location, // Set null dulu sesuai permintaan
                    'device' => DeviceHelper::getDeviceFromRequest($request), // Simpan device awal
                    'image' => $imageArray, // Simpan juga di attendance_trackings
                    'date_time' => $now,
                    'created_by' => $userId,
                    'updated_by' => $userId
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
                'message' => 'Check Out successfully'
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
                        // Prefer per-date EmployeeShift for any date; fallback to base shift
                        $employeeShift = EmployeeShift::where('employee_id', $attendance->employee_id)
                            ->where('date_shift', $attendance->date_attendance)
                            ->first();

                        if ($employeeShift) {
                            $shiftModel = $employeeShift->loadMissing('shift')->shift;
                            if ($shiftModel) {
                                $rawStart = $shiftModel->getRawOriginal('time_start') ?? $shiftModel->time_start;
                                $rawEnd = $shiftModel->getRawOriginal('time_end') ?? $shiftModel->time_end;
                                $attendance->shift_start = $rawStart ? Carbon::parse($rawStart)->format('H:i') : null;
                                $attendance->shift_end = $rawEnd ? Carbon::parse($rawEnd)->format('H:i') : null;
                            } else {
                                $attendance->shift_start = null;
                                $attendance->shift_end = null;
                            }
                        } else {
                            // Fallback to employee base shift
                            $emp = Employee::with('shift')->find($attendance->employee_id);
                            if ($emp && $emp->shift) {
                                $rawStart = $emp->shift->getRawOriginal('time_start') ?? $emp->shift->time_start;
                                $rawEnd = $emp->shift->getRawOriginal('time_end') ?? $emp->shift->time_end;
                                $attendance->shift_start = $rawStart ? Carbon::parse($rawStart)->format('H:i') : null;
                                $attendance->shift_end = $rawEnd ? Carbon::parse($rawEnd)->format('H:i') : null;
                            } else {
                                $attendance->shift_start = null;
                                $attendance->shift_end = null;
                            }
                        }
                    } catch (\Exception $e) {
                        $attendance->shift_start = $attendance->shift_start ?? null;
                        $attendance->shift_end = $attendance->shift_end ?? null;
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

            // Get employee shift for checkout validation; fallback to base shift
            $employeeShift = EmployeeShift::where('employee_id', $validated['employee_id'])
                ->where('date_shift', $validated['date_attendance'])
                ->first();

            $shiftEndTime = null;
            $shiftStartTime = null;
            if ($employeeShift) {
                // Load shift times from related Shift
                $shiftModel = $employeeShift->loadMissing('shift')->shift;
                if ($shiftModel) {
                    $rawStart = $shiftModel->getRawOriginal('time_start') ?? $shiftModel->time_start;
                    $rawEnd = $shiftModel->getRawOriginal('time_end') ?? $shiftModel->time_end;
                    $shiftStartTime = $rawStart ? Carbon::parse($validated['date_attendance'] . ' ' . $rawStart) : null;
                    $shiftEndTime = $rawEnd ? Carbon::parse($validated['date_attendance'] . ' ' . $rawEnd) : null;
                }
            }
            if (!$shiftStartTime || !$shiftEndTime) {
                // Fallback to base shift
                $emp = Employee::with('shift')->find($validated['employee_id']);
                if ($emp && $emp->shift) {
                    $rawStart = $emp->shift->getRawOriginal('time_start') ?? $emp->shift->time_start;
                    $rawEnd = $emp->shift->getRawOriginal('time_end') ?? $emp->shift->time_end;
                    if ($rawStart) $shiftStartTime = Carbon::parse($validated['date_attendance'] . ' ' . $rawStart);
                    if ($rawEnd) $shiftEndTime = Carbon::parse($validated['date_attendance'] . ' ' . $rawEnd);
                }
            }

            $checkOutTime = Carbon::parse($validated['date_attendance'] . ' ' . $validated['time_out']);

            // Handle overnight shift correctly: if checkout is after start (same-day evening), end is next day; if after midnight (before start), end stays same day.
            if ($shiftStartTime && $shiftEndTime) {
                if ($shiftStartTime->gt($shiftEndTime)) {
                    if ($checkOutTime->gte($shiftStartTime)) {
                        // Same-day evening checkout attempt: end is next day
                        $shiftEndTime = $shiftEndTime->copy()->addDay();
                    } else {
                        // After midnight (morning) checkout: end remains on current date
                        // no change
                    }
                }
                // Enforce: cannot checkout before shift end
                if ($checkOutTime->lt($shiftEndTime)) {
                    return response()->json([
                        'code' => 400,
                        'status' => 'error',
                        'data' => [],
                        'message' => 'Cannot checkout before your shift ends at ' . $shiftEndTime->format('H:i')
                    ], 400);
                }
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
                    $employeeShift = EmployeeShift::where('employee_id', $attendance->employee_id)
                        ->where('date_shift', $attendance->date_attendance)
                        ->first();

                    if ($employeeShift) {
                        $shiftModel = $employeeShift->loadMissing('shift')->shift;
                        if ($shiftModel) {
                            $rawStart = $shiftModel->getRawOriginal('time_start') ?? $shiftModel->time_start;
                            $rawEnd = $shiftModel->getRawOriginal('time_end') ?? $shiftModel->time_end;
                            $attendance->shift_start = $rawStart ? Carbon::parse($rawStart)->format('H:i') : null;
                            $attendance->shift_end = $rawEnd ? Carbon::parse($rawEnd)->format('H:i') : null;
                        } else {
                            $attendance->shift_start = null;
                            $attendance->shift_end = null;
                        }
                    } else {
                        // Fallback to employee base shift
                        $emp = Employee::with('shift')->find($attendance->employee_id);
                        if ($emp && $emp->shift) {
                            $rawStart = $emp->shift->getRawOriginal('time_start') ?? $emp->shift->time_start;
                            $rawEnd = $emp->shift->getRawOriginal('time_end') ?? $emp->shift->time_end;
                            $attendance->shift_start = $rawStart ? Carbon::parse($rawStart)->format('H:i') : null;
                            $attendance->shift_end = $rawEnd ? Carbon::parse($rawEnd)->format('H:i') : null;
                        } else {
                            $attendance->shift_start = null;
                            $attendance->shift_end = null;
                        }
                    }
                } catch (\Exception $e) {
                    $attendance->shift_start = $attendance->shift_start ?? null;
                    $attendance->shift_end = $attendance->shift_end ?? null;
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
            // Accept either plain date (Y-m-d) or ISO/date-time strings and normalize to Y-m-d
            try {
                if (preg_match('/^\d{4}-\d{2}-\d{2}$/', (string) $date)) {
                    $dateObj = Carbon::createFromFormat('Y-m-d', $date);
                } else {
                    // Fallback for values like 2025-08-27T17:00:00.000000Z or "YYYY-MM-DD HH:MM:SS"
                    $dateObj = Carbon::parse($date);
                }
            } catch (\Exception $e) {
                return response()->json([
                    'code' => 400,
                    'status' => 'error',
                    'data' => null,
                    'message' => 'Invalid date format'
                ], 400);
            }

            $targetDate = $dateObj->toDateString();

            // Prefer per-date override if exists for the date; fallback to base shift
            $employeeShift = EmployeeShift::where('employee_id', $employeeId)
                ->where('date_shift', $targetDate)
                ->first();

            $shiftStartTime = null;
            $shiftEndTime = null;
            if ($employeeShift) {
                $shiftModel = $employeeShift->loadMissing('shift')->shift;
                if ($shiftModel) {
                    $rawStart = $shiftModel->getRawOriginal('time_start') ?? $shiftModel->time_start;
                    $rawEnd = $shiftModel->getRawOriginal('time_end') ?? $shiftModel->time_end;
                    $shiftStartTime = $rawStart ? Carbon::parse($rawStart) : null;
                    $shiftEndTime = $rawEnd ? Carbon::parse($rawEnd) : null;
                }
            } else {
                $emp = Employee::with('shift')->find($employeeId);
                if ($emp && $emp->shift) {
                    $rawStart = $emp->shift->getRawOriginal('time_start') ?? $emp->shift->time_start;
                    $rawEnd = $emp->shift->getRawOriginal('time_end') ?? $emp->shift->time_end;
                    $shiftStartTime = $rawStart ? Carbon::parse($rawStart) : null;
                    $shiftEndTime = $rawEnd ? Carbon::parse($rawEnd) : null;
                }
            }
            
            // Handle night shift if we have times
            if ($shiftStartTime && $shiftEndTime && $shiftStartTime->gt($shiftEndTime)) {
                $shiftEndTime->addDay();
            }

            $minCheckInTime = $shiftStartTime ? $shiftStartTime->copy()->subHour() : null;
            $maxCheckInTime = $shiftStartTime ?: null;
            $minCheckOutTime = $shiftEndTime ?: null;

            return response()->json([
                'code' => 200,
                'status' => 'success',
                'data' => [
                    'shift' => $employeeShift, // may be null if using base
                    'time_start' => $shiftStartTime ? $shiftStartTime->format('H:i') : null,
                    'time_end' => $shiftEndTime ? $shiftEndTime->format('H:i') : null,
                    'min_checkin_time' => $minCheckInTime ? $minCheckInTime->format('H:i') : null,
                    'max_checkin_time' => $maxCheckInTime ? $maxCheckInTime->format('H:i') : null,
                    'min_checkout_time' => $minCheckOutTime ? $minCheckOutTime->format('H:i') : null,
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
                'status' => 'not_started',
                'is_late' => false,
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
                    // Ensure HH:MM format and is_late flag for UI stability
                    try {
                        $status['last_check_in_time'] = Carbon::parse($lastAttendance->time_in)->format('H:i');
                    } catch (\Exception $e) {
                        $status['last_check_in_time'] = $lastAttendance->time_in;
                    }
                    $status['can_check_in'] = false;
                    $status['can_check_out'] = true;
                    $status['status'] = 'checked_in';
                } elseif ($lastAttendance->time_in && $lastAttendance->time_out) {
                    // Has both checked in and checked out
                    $status['has_checked_in'] = true;
                    $status['has_checked_out'] = true;
                    try {
                        $status['last_check_in_time'] = Carbon::parse($lastAttendance->time_in)->format('H:i');
                    } catch (\Exception $e) {
                        $status['last_check_in_time'] = $lastAttendance->time_in;
                    }
                    try {
                        $status['last_check_out_time'] = Carbon::parse($lastAttendance->time_out)->format('H:i');
                    } catch (\Exception $e) {
                        $status['last_check_out_time'] = $lastAttendance->time_out;
                    }
                    $status['can_check_in'] = true; // Allow new check-in for next shift
                    $status['can_check_out'] = false;
                    $status['status'] = 'checked_out';
                }
            }

            // Compute is_late based on persisted time_late from the earliest check-in of today
            try {
                if ($status['has_checked_in']) {
                    $firstCheckIn = $attendances->first(function($a) { return !empty($a->time_in); });
                    if ($firstCheckIn) {
                        $status['is_late'] = !empty($firstCheckIn->time_late);
                    }
                }
            } catch (\Exception $e) {
                $status['is_late'] = $status['is_late'] ?? false;
            }

            // Check for unclosed attendance from previous day
            $unclosed = Attendance::where('employee_id', $employeeId)
                ->whereNull('time_out')
                ->where('date_attendance', '<', $today)
                ->orderBy('date_attendance', 'desc')
                ->orderBy('time_in', 'desc')
                ->first();

            if ($unclosed) {
                $status['has_unclosed'] = true;
                $status['unclosed_date'] = $unclosed->date_attendance;

                // New behavior: if no activity today and the unclosed record belongs to an
                // overnight shift, treat the state as still "checked_in" across midnight
                // until the user checks out.
                if ($status['status'] === 'not_started') {
                    try {
                        // Determine shift for the unclosed date (prefer per-date shift)
                        $employeeShift = EmployeeShift::where('employee_id', $employeeId)
                            ->where('date_shift', $unclosed->date_attendance)
                            ->first();

                        $shiftStartTime = null;
                        $shiftEndTime = null;
                        if ($employeeShift) {
                            $shiftModel = $employeeShift->loadMissing('shift')->shift;
                            if ($shiftModel) {
                                $rawStart = $shiftModel->getRawOriginal('time_start') ?? $shiftModel->time_start;
                                $rawEnd = $shiftModel->getRawOriginal('time_end') ?? $shiftModel->time_end;
                                if ($rawStart) $shiftStartTime = Carbon::parse($unclosed->date_attendance . ' ' . $rawStart);
                                if ($rawEnd) $shiftEndTime = Carbon::parse($unclosed->date_attendance . ' ' . $rawEnd);
                            }
                        }
                        if (!$shiftStartTime || !$shiftEndTime) {
                            // Fallback to base shift
                            $emp = Employee::with('shift')->find($employeeId);
                            if ($emp && $emp->shift) {
                                $rawStart = $emp->shift->getRawOriginal('time_start') ?? $emp->shift->time_start;
                                $rawEnd = $emp->shift->getRawOriginal('time_end') ?? $emp->shift->time_end;
                                if ($rawStart) $shiftStartTime = Carbon::parse($unclosed->date_attendance . ' ' . $rawStart);
                                if ($rawEnd) $shiftEndTime = Carbon::parse($unclosed->date_attendance . ' ' . $rawEnd);
                            }
                        }

                        // If we have shift times and it is an overnight shift (start > end),
                        // keep the UI in checked_in state across midnight until checkout.
                        if ($shiftStartTime && $shiftEndTime && $shiftStartTime->gt($shiftEndTime)) {
                            // Normalize end to next day for reference (not strictly needed to decide UI)
                            $shiftEndTimeNorm = $shiftEndTime->copy()->addDay();

                            // Force checked_in state and enable checkout
                            $status['status'] = 'checked_in';
                            $status['has_checked_in'] = true;
                            $status['can_check_in'] = false;
                            $status['can_check_out'] = true;
                            try {
                                $status['last_check_in_time'] = Carbon::parse($unclosed->time_in)->format('H:i');
                            } catch (\Exception $e) {
                                $status['last_check_in_time'] = $unclosed->time_in;
                            }
                            $status['is_late'] = !empty($unclosed->time_late);
                            $status['continued_from'] = $unclosed->date_attendance; // informational
                        }
                    } catch (\Exception $e) {
                        // Ignore errors; fall back to existing behavior
                    }
                }
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
