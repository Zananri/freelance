<?php

namespace App\Http\Controllers;

use Carbon\Carbon;
use Illuminate\Http\Request;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use App\Models\Employee;
use App\Models\Attendance;
use App\Models\EmployeeShift;
// ActivityTracking removed per request; rely on UserAuthLog only
use App\Helpers\DeviceHelper;
use App\Models\UserAuthLog;
use App\Helpers\RequestHelper;
use App\Helpers\ActivityHelper;

class UserController extends Controller
{

    public function showUserPage()
    {
        return view('master.user.user');
    }

    public function index(Request $request)
    {
        if ($request->ajax()) {
            $query = User::with(['employee:id,user_id,photo,division_id'])
                ->select('id', 'name', 'email', 'user_type', 'user_role');

            if ($request->filled('search')) {
                $search = $request->search;
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('user_type', 'like', "%{$search}%")
                    ->orWhere('user_role', 'like', "%{$search}%");
                });
            }

            $users = $query->get();

            return response()->json(['data' => $users]);
        }

        return view('master.user.user');
    }

    public function login(Request $request)
    {
        $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required'],
        ]);

        $email = $request->input('email');
        $password = $request->input('password');

        // Temporarily disable work email domain check for testing
        /*
        $workEmailDomain = '@company.com'; // Change this to your actual work email domain
        if (!str_ends_with($email, $workEmailDomain)) {
            return back()->withErrors(['email' => 'Please use your work email address.'])->withInput();
        }
        */

        $user = User::where('email', $email)->with('employee')->first();
        if ($user && $user->employee) {
            $status = strtoupper((string) $user->employee->status);
            if ($status === 'DELETED') {
                return back()->withErrors(['email' => 'Your account has been deleted and cannot login.'])->withInput();
            }
        }

        if (auth()->attempt(['email' => $email, 'password' => $password])) {
            $request->session()->regenerate();
            try {
                $user = auth()->user();
                $employee = Employee::where('user_id', $user->id)->first();
                if ($employee) {
                    // Record user auth log (LOGIN SUCCESS) only. ActivityTracking table removed.
                    try {
                        UserAuthLog::create([
                            'user_id' => $user->id,
                            'employee_id' => $employee->id ?? null,
                            'auth_type' => 'LOGIN',
                            'date_time_auth' => now(),
                            'device_info' => DeviceHelper::getDeviceFromRequest($request),
                            'ip_address' => RequestHelper::getClientIp($request),
                            'status' => 'SUCCESS',
                        ]);
                    } catch (\Exception $e) {
                        \Log::error('Failed to write UserAuthLog on login: ' . $e->getMessage());
                    }
                }
            } catch (\Exception $e) {
                \Log::error('Failed to record activity tracking on login: ' . $e->getMessage());
            }
            return redirect()->intended('/dashboard')->with('success', 'Login successful!');
        }
        // Log failed login attempt (record attempt even when credentials incorrect)
        try {
            $maybeUser = User::where('email', $email)->with('employee')->first();
            UserAuthLog::create([
                'user_id' => $maybeUser->id ?? null,
                'employee_id' => $maybeUser && $maybeUser->employee ? $maybeUser->employee->id : null,
                'auth_type' => 'LOGIN',
                'date_time_auth' => now(),
                'device_info' => DeviceHelper::getDeviceFromRequest($request),
                'ip_address' => RequestHelper::getClientIp($request),
                'status' => 'FAILED',
            ]);
        } catch (\Exception $e) {
            \Log::error('Failed to write UserAuthLog on failed login: ' . $e->getMessage());
        }
        return back()->withErrors(['email' => 'The provided credentials do not match our records.'])->withInput();
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
        $user = User::with('employee.department', 'employee.division', 'employee.job')->find($id);
        if (!$user) {
            return response()->json(['message' => 'User not found'], 404);
        }
        return response()->json($user);
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
     * Return users data as JSON for AJAX.
     */
    public function getUsersAjax()
    {
        $users = User::with(['employee:id,user_id,photo,division_id'])
            ->select('id', 'name', 'email', 'user_type', 'user_role')
            ->get();
        return response()->json(['data' => $users]);
    }

    /**
     * Show dashboard with user photo.
     */
    public function dashboard()
    {
        $user = auth()->user();
        $photo = null;
        $employee = null;
        $attendance = null;
        $shift = null; // per-date shift if available
        $timeIn = null;
        $attendanceStatus = [
            'check_in' => 'pending',
            'check_out' => 'pending'
        ];
        $isLate = false;

        if ($user) {
            $employee = Employee::where('user_id', $user->id)->first();
            $today = Carbon::today()->toDateString();

            if ($employee) {
                $photo = $employee->profile_picture ?? $employee->photo;

                // Get today's per-date shift (EmployeeShift)
                $shift = EmployeeShift::where('employee_id', $employee->id)
                    ->where('date_shift', $today)
                    ->first();

                // Get today's attendance records
                $attendances = Attendance::where('employee_id', $employee->id)
                    ->where('date_attendance', $today)
                    ->orderBy('time_in', 'asc')
                    ->get();
                // Determine attendance status similar to AttendanceController@showAttendancePage
                $attendance = $attendances->where('type_attendance', 'check_in')->last();
                if ($attendance) {
                    $attendanceStatus['check_in'] = 'completed';
                    $checkOut = Attendance::where('employee_id', $employee->id)
                        ->where('date_attendance', $today)
                        ->where('type_attendance', 'check_out')
                        ->first();
                    if ($checkOut) {
                        $attendanceStatus['check_out'] = 'completed';
                    }
                }

                // Calculate if late using per-date shift or fallback to base shift (employee->shift)
                $employee->loadMissing('shift');
                $baseShift = $employee->shift; // may be null
                $timeIn = $attendance ? $attendance->time_in : null;
                $timeStart = $shift->time_start ?? ($baseShift->time_start ?? null);

                if ($timeIn && $timeStart) {
                    try {
                        $isLate = Carbon::createFromFormat('H:i', $timeIn)
                            ->gt(Carbon::createFromFormat('H:i', $timeStart));
                    } catch (\Exception $e) {
                        $isLate = strtotime($timeIn) > strtotime($timeStart);
                    }
                } else {
                    $isLate = false;
                }
            }

            // If photo is a relative path, convert to asset URL
            if ($photo) {
                $photo = asset($photo);
            }
        }

        try {
            ActivityHelper::record([
                'employee_id' => $employee?->id,
                'menu' => 'DASHBOARD',
                'activity' => 'VIEW_PAGE',
                'description' => ($employee?->name ?? 'Unknown') . ' View page dashboard',
            ]);
        } catch (\Throwable $_) {}

        return view('dashboard', compact('photo', 'employee', 'attendance', 'attendanceStatus', 'shift', 'isLate', 'timeIn'));
    }

    /**
     * Expose selected route URLs for client-side as JSON (to avoid inline Blade <script>).
     */
    public function clientRoutes(Request $request)
    {
        $base = rtrim($request->getBaseUrl(), '/'); // e.g., /nsa-office/public or ''
        $tasksTodayPath = route('task.dashboard.today', [], false); // relative path, e.g., /task/dashboard/today
        $tasksTodayUrl = ($base ? $base : '') . $tasksTodayPath; // prepend base if exists
        $tasksTomorrowPath = route('task.dashboard.tomorrow', [], false);
        $tasksTomorrowUrl = ($base ? $base : '') . $tasksTomorrowPath;

        return response()->json([
            'baseUrl' => $base ?: '',
            'tasksToday' => $tasksTodayUrl,
            'tasksTomorrow' => $tasksTomorrowUrl,
        ]);
    }

    /**
     * Log the user out of the application.
     */
    public function logout(Request $request)
    {
        try {
            $user = auth()->user();
            if ($user) {
                $employee = Employee::where('user_id', $user->id)->first();
                // ActivityTracking is removed. We no longer update activity tracking on logout.
            }
        } catch (\Exception $e) {
            \Log::error('Failed to update activity tracking on logout: ' . $e->getMessage());
        }

        // Record user auth log (LOGOUT)
        try {
            if (isset($user)) {
                UserAuthLog::create([
                    'user_id' => $user->id,
                    'employee_id' => $employee->id ?? null,
                    'auth_type' => 'LOGOUT',
                    'date_time_auth' => now(),
                    'device_info' => DeviceHelper::getDeviceFromRequest($request),
                    'ip_address' => RequestHelper::getClientIp($request),
                    'status' => 'SUCCESS',
                ]);
            }
        } catch (\Exception $e) {
            \Log::error('Failed to write UserAuthLog on logout: ' . $e->getMessage());
        }

        auth()->logout();

        $request->session()->invalidate();

        $request->session()->regenerateToken();

        return redirect('/login')->with('success', 'Logout successful!');
    }

    /**
     * Reset the password of a user to the default "NSA_2025".
     */
    public function resetPassword($id)
    {
        $user = User::find($id);
        if (!$user) {
            return response()->json(['error' => 'User not found'], 404);
        }

        $user->password = Hash::make('NSA_2025');
        $user->save();

        return response()->json(['message' => 'Password has been reset to default successfully']);
    }
}
