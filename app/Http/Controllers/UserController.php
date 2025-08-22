<?php

namespace App\Http\Controllers;

use Carbon\Carbon;
use Illuminate\Http\Request;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use App\Models\Employee;
use App\Models\Attendance;

class UserController extends Controller
{

    public function showUserPage()
    {
        return view('master.user.user');
    }

    public function index(Request $request)
    {
        if ($request->ajax()) {
            $users = User::select('id', 'name', 'email', 'photo', 'user_type', 'user_role')->get();
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

        if (auth()->attempt(['email' => $email, 'password' => $password])) {
            $request->session()->regenerate();
            return redirect('/dashboard')->with('success', 'Login successful!');
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
        $users = User::select('id', 'name', 'email', 'photo', 'user_type', 'user_role')->get();
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
        $shift = null;
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

                // Get today's shift
                $shift = $employee->shifts()->where('date_shift', $today)->first();

                // Get today's attendance records
                $attendances = Attendance::where('employee_id', $employee->id)
                    ->where('date_attendance', $today)
                    ->orderBy('time_in', 'asc')
                    ->get();

                if ($attendances->isEmpty()) {
                    $attendanceStatus = [
                        'check_in' => 'pending',
                        'check_out' => 'pending'
                    ];
                } else {
                    $lastAttendance = $attendances->last();

                    if ($lastAttendance->type_attendance === 'check_in' && !$lastAttendance->time_out) {
                        $attendanceStatus = [
                            'check_in' => 'completed',
                            'check_out' => 'pending'
                        ];
                    } elseif ($lastAttendance->type_attendance === 'check_out') {
                        $attendanceStatus = [
                            'check_in' => 'completed',
                            'check_out' => 'completed'
                        ];
                    }
                }

                $attendance = $attendances->where('type_attendance', 'check_in')->last();

                // Calculate if late
                $timeStart = $shift ? $shift->time_start : null;
                $timeIn = $attendance ? $attendance->time_in : null;
                $isLate = isset($timeStart, $timeIn) && !empty($timeStart) && !empty($timeIn) && strtotime($timeIn) > strtotime($timeStart);
            }

            // If photo is a relative path, convert to asset URL
            if ($photo) {
                $photo = asset($photo);
            }
        }

        return view('dashboard', compact('photo', 'employee', 'attendance', 'attendanceStatus', 'shift', 'isLate', 'timeIn'));
    }

    /**
     * Log the user out of the application.
     */
    public function logout(Request $request)
    {
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
