<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;

use App\Models\Employee;

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
        $employee = Employee::where('user_id', $user->id)->first();

        $photo = null;
        if ($employee) {
            // Prefer profile_picture if available, else photo
            $photo = $employee->profile_picture ?? $employee->photo;
        }

        // If photo is a relative path, convert to asset URL
        if ($photo) {
            $photo = asset($photo);
        }

        return view('dashboard', compact('photo'));
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
}
