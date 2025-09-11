<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use App\Models\Attendance;
use Carbon\Carbon;
use App\Models\Employee;
use Log;

class ProfileController extends Controller
{
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
        $user = auth()->user();
        $employee = Employee::with('division', 'department', 'job','grade')->where('user_id', $user->id)->first();

        $today = Carbon::today()->toDateString();
 
        $resolvedPhoto = null;
        if ($employee) {
            // Source priority for profile page: employee->profile_picture > employee->photo > user->photo (legacy)
            $employeeProfilePicture = $employee->profile_picture ?? null;
            $employeeLegacyPhoto = $employee->photo ?? null;
            $userPhoto = $user->photo ?? null; // fallback only
            $photo = $employeeProfilePicture ?: ($employeeLegacyPhoto ?: $userPhoto);
            $attendance = Attendance::where('employee_id', $employee->id)
                ->where('date_attendance', $today)
                ->where('type_attendance', 'check_in')
                ->first();

        }

        if (isset($photo) && $photo) {
            // if already absolute (http) leave, else asset
            if (preg_match('/^(https?:)?\/\//i', $photo)) {
                $resolvedPhoto = $photo;
            } else {
                $resolvedPhoto = asset($photo);
            }
        }

        return view('profile/profile', [
            'id' => $user->id,
            'employee' => $employee,
            'profilePhotoUrl' => $resolvedPhoto
        ], compact('employee'));
    }

    public function index()
    {
        $user = Auth::user();
        if (!$user) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        $user->load('employee.department', 'employee.division', 'employee.job');

        if ($user->employee) {
            $rawPhoto = $user->employee->profile_picture ?? $user->employee->photo; // may be full relative path or just filename
            $photoPath = null;

            if ($rawPhoto) {
                // If already starts with a known folder (file/...), leave as-is
                if (str_starts_with($rawPhoto, 'file/')) {
                    $photoPath = $rawPhoto;
                } elseif (preg_match('/^(https?:)?\/\//i', $rawPhoto)) { // absolute URL
                    $user->employee->photo_url = $rawPhoto; // assign and skip asset()
                } else {
                    // treat as bare filename -> assume stored in profile_picture directory
                    $photoPath = 'file/profile_picture/' . ltrim($rawPhoto, '/');
                }
            }

            if (!isset($user->employee->photo_url)) { // only if not absolute URL case above
                $user->employee->photo_url = $photoPath ? asset($photoPath) : null;
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
}
