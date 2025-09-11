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

        return view('profile.profile', [
            'id' => $user->id,
            'employee' => $employee
        ], compact('employee'));
    }

    public function editPassword(Request $request){

        try{
                
            $request->validate([
                'current_password' => 'required',
                'new_password' => 'required|confirmed|min:7',
                'new_password_confirmation' => 'required|min:7',
            ]);

            $user = auth()->user();

            if (Hash::check($request->current_password, $user->password)) {

                $user->password = Hash::make($request->new_password);
                $user->save();

            }else{
                throw new \Exception('Current password is incorrect');
            }

            return response()->json([
                    'code' => 200,
                    'status' => 'success',
                    'data' => [],
                    'message' => 'Password changed successfully'
            ]);

        }catch (\Exception $e){

            return response()->json([
                'code' => 500,
                'status' => 'error',
                'data' => [],
                'message' => $e->getMessage()
            ], 500);

        }

    }

    public function editPhotoProfile(Request $request){

        try{
                
            $request->validate([
                'profile_photo' => 'required|image|mimes:jpeg,png,jpg,gif|max:10048'
            ]);

            $user = auth()->user();
            $employee = Employee::where('user_id', $user->id)->first();

            if ($request->hasFile('profile_photo')) {

                $file = $request->file('profile_photo');

                if ($employee->profile_picture) {

                    if($employee->profile_picture != 'asset/img/avatar.png'){
                        $oldPath = public_path($employee->profile_picture);
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
            }else{
                throw new \Exception('Please add new profile photo');
            }

            return response()->json([
                    'code' => 200,
                    'status' => 'success',
                    'data' => [
                        'new_profile_photo' => $employee->profile_picture
                    ],
                    'message' => 'Photo profile changed successfully'
            ]);

        }catch (\Exception $e){

            return response()->json([
                'code' => 500,
                'status' => 'error',
                'data' => [],
                'message' => $e->getMessage()
            ], 500);

        }

    }
    public function index()
    {
        
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
