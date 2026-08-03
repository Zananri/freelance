<?php

namespace App\Http\Controllers;

use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Auth;

use App\Models\User;
use App\Models\Employee;
use App\Models\Attendance;
use App\Models\EmployeeShift;
use App\Helpers\DeviceHelper;
use App\Models\UserAuthLog;
use App\Helpers\RequestHelper;
use App\Helpers\ActivityHelper;

class UserController extends Controller
{

    public function authUrl(Request $request){

        try{
            $received_encrypted_data = $request->input('token_data');
            $received_iv = $request->input('iv');

            $decoded_encrypted_data = base64_decode(urldecode($received_encrypted_data));
            $decoded_iv = base64_decode(urldecode($received_iv));
            $key = env('APP_KEY');
            $cipher_method = "aes-256-cbc";

            $decrypted_data = openssl_decrypt($decoded_encrypted_data, $cipher_method, $key, 0, $decoded_iv);

            if($decrypted_data){
                $explodeData = explode(',', $decrypted_data);

                $user = User::where('id',$explodeData[0])
                    ->where('email',$explodeData[1])
                ->first();

                if($user){
                    Auth::login($user);
                    return redirect('/project');
                }
            }

            return redirect('/login');

        }catch(\Exception $e){
            return redirect('/login');
        }



    }

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
            'remember' => ['nullable', 'boolean'],
        ]);

        $email = $request->input('email');
        $password = $request->input('password');

        $user = User::where('email', $email)->with('employee')->first();
        if ($user && $user->employee) {
            $status = strtoupper((string) $user->employee->status);
            if ($status === 'DELETED') {
                return back()->withErrors(['email' => 'Your account has been deleted and cannot login.'])->withInput();
            }
        }

        $remember = $request->boolean('remember');

        if (auth()->attempt(['email' => $email, 'password' => $password], $remember)) {
            $request->session()->regenerate();
            try {
                $user = auth()->user();
                $employee = Employee::where('user_id', $user->id)->first();
                if ($employee) {
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

    public function create()
    {
        //
    }

    public function store(Request $request)
    {
        //
    }

    public function show(string $id)
    {
        $user = User::with('employee.department', 'employee.division', 'employee.job')->find($id);
        if (!$user) {
            return response()->json(['message' => 'User not found'], 404);
        }
        $user->makeVisible('can_attendance');
        return response()->json($user);
    }

    public function edit(string $id)
    {
        //
    }

    public function update(Request $request, string $id)
    {
        //
    }

    public function destroy(string $id)
    {
        //
    }

    public function getUsersAjax(Request $request)
    {
        $query = User::with(['employee:id,user_id,photo,division_id'])
            ->select('id', 'name', 'email', 'user_type', 'user_role', 'can_attendance')
            ->whereNotIn('user_type', ['SUPERADMIN', 'ADMINISTRATOR'])
            ->whereNotIn('user_role', ['ADMINISTRATOR', 'SUPERADMIN']);

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('user_type', 'like', "%{$search}%")
                    ->orWhere('user_role', 'like', "%{$search}%");
            });
        }

        $page = max((int) $request->input('page', 1), 1);
        $perPage = (int) $request->input('per_page', 10);
        if (!in_array($perPage, [10, 20, 50, 100], true)) $perPage = 10;

        $paginated = $query->orderBy('id', 'desc')->paginate($perPage, ['*'], 'page', $page);

        return response()->json([
            'data' => $paginated->items(),
            'pagination' => [
                'current_page' => $paginated->currentPage(),
                'last_page' => $paginated->lastPage(),
                'per_page' => $paginated->perPage(),
                'total' => $paginated->total(),
                'from' => $paginated->firstItem(),
                'to' => $paginated->lastItem(),
            ],
        ]);
    }

    public function toggleAttendance(Request $request, $id)
    {
        $user = User::find($id);
        if (!$user) {
            return response()->json(['error' => 'User not found'], 404);
        }

        $request->validate([
            'can_attendance' => 'required|boolean',
        ]);

        $user->can_attendance = $request->can_attendance;
        $user->save();

        return response()->json([
            'message' => 'Attendance permission updated successfully',
            'can_attendance' => $user->can_attendance
        ]);
    }

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

                $shift = EmployeeShift::where('employee_id', $employee->id)
                    ->where('date_shift', $today)
                    ->first();

                $attendances = Attendance::where('employee_id', $employee->id)
                    ->where('date_attendance', $today)
                    ->orderBy('time_in', 'asc')
                    ->get();
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

                $employee->loadMissing('shift');
                $baseShift = $employee->shift;
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

    public function clientRoutes(Request $request)
    {
        $base = rtrim($request->getBaseUrl(), '/');
        $tasksTodayPath = route('task.dashboard.today', [], false);
        $tasksTodayUrl = ($base ? $base : '') . $tasksTodayPath;
        $tasksTomorrowPath = route('task.dashboard.tomorrow', [], false);
        $tasksTomorrowUrl = ($base ? $base : '') . $tasksTomorrowPath;

        return response()->json([
            'baseUrl' => $base ?: '',
            'tasksToday' => $tasksTodayUrl,
            'tasksTomorrow' => $tasksTomorrowUrl,
        ]);
    }

    public function logout(Request $request)
    {
        try {
            $user = auth()->user();
            if ($user) {
                $employee = Employee::where('user_id', $user->id)->first();
            }
        } catch (\Exception $e) {
            \Log::error('Failed to update activity tracking on logout: ' . $e->getMessage());
        }

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

    public function resetPassword($id)
    {
        $user = User::find($id);
        if (!$user) {
            return response()->json(['error' => 'User not found'], 404);
        }

        $user->password = Hash::make('office_2025');
        $user->save();

        return response()->json(['message' => 'Password has been reset to default successfully']);
    }

    public function changePassword(Request $request, $id)
    {
        $validated = $request->validate([
            'new_password' => ['required', 'string', 'min:7', 'confirmed'],
        ]);

        $user = User::find($id);
        if (!$user) {
            return response()->json(['message' => 'User not found'], 404);
        }

        $user->password = Hash::make($validated['new_password']);
        $user->save();

        return response()->json(['message' => 'Password changed successfully.']);
    }
}
