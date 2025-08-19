<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use App\Models\Attendance;
use Carbon\Carbon;
use App\Models\Employee;

class ProfileController extends Controller
{

    public function showprofilePage()
    {
        $user = auth()->user();
        $employee = Employee::where('user_id', $user->id)->first();


        $today = Carbon::today()->toDateString();

        if ($employee) {
            // Prefer profile_picture if available, else photo
            $photo = $employee->profile_picture ?? $employee->photo;
            $attendance = Attendance::where('employee_id', $employee->id)
                ->where('date_attendance', $today)
                ->where('type_attendance', 'check_in')
                ->first();

        }

        // If photo is a relative path, convert to asset URL
        if ($photo) {
            $photo = asset($photo);
        }
        return view('profile/profile', ['id' => $user->id], compact('employee'));
    }

    public function index()
    {
        $user = Auth::user();
        if (!$user) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        $user->load('employee.department', 'employee.division', 'employee.job');

        if ($user->employee) {
            $photo = $user->employee->profile_picture ?? $user->employee->photo;
            if ($photo) {
                if (str_starts_with($photo, 'file/profile_picture')) {
                    $user->employee->photo_url = asset($photo);
                } else {
                    $user->employee->photo_url = asset('file/profile_picture/' . $photo);
                }
            } else {
                $user->employee->photo_url = null;
            }
        }

        return response()->json($user);
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

        // Validate only profile_photo and optional password fields, current_password is optional now
        $request->validate([
            'current_password' => 'nullable|string',
            'password' => 'nullable|string|min:6',
            'profile_photo' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
        ]);

        // If password is provided, verify current password
        if ($request->filled('password')) {
            if (!$request->filled('current_password') || !Hash::check($request->current_password, $user->password)) {
                return response()->json(['error' => 'Current password is incorrect or missing'], 422);
            }
            // Update password
            $user->password = Hash::make($request->password);
        }

        // Handle profile photo upload
        if ($request->hasFile('profile_photo')) {
            $file = $request->file('profile_photo');

            // Delete old images if exist
            if ($user->photo) {
                $oldUserPhotoPath = public_path($user->photo);
                if (file_exists($oldUserPhotoPath)) {
                    unlink($oldUserPhotoPath);
                }
            }

            $extension = $file->getClientOriginalExtension();
            $filename = 'PROFILE_PICTURE_' . time() . '.' . $extension;
            $destinationPath = public_path('file/profile_picture');
            $file->move($destinationPath, $filename);

            // Update user photo field only
            $user->photo = 'file/profile_picture/' . $filename;

            // Removed updating employee profile_picture to keep it unchanged on profile update
            /*
            if ($user->employee) {
                $user->employee->profile_picture = 'file/profile_picture/' . $filename;
                $user->employee->save();
            }
            */
        }

        $user->save();

        return response()->json(['message' => 'Profile updated successfully']);
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
}
