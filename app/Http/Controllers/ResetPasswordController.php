<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Auth;
use App\Models\User;
use Illuminate\Support\Str;
use App\Models\Employee;

class ResetPasswordController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function showResetPasswordPage()
    {
        // token and email will be provided as route parameter and query param
        $token = request()->route('token');
        $email = request()->query('email');

        if (!$email || !$token) {
            return view('reset-password.expired');
        }

        $user = User::where('email', $email)->first();

        if (!$user) {
            return view('reset-password.expired');
        }

        // Block reset page for users whose linked employee is DELETED
        $user->loadMissing('employee');
        if ($user->employee && strtoupper((string) $user->employee->status) === 'DELETED') {
            return view('reset-password.expired');
        }

        $tokenValid = Password::tokenExists($user, $token);

        if (!$tokenValid) {
            return view('reset-password.expired');
        }

        return view('reset-password.reset', compact('token', 'email'));
    }

    public function submitResetPassword(Request $request)
    {
        $request->validate([
            'token' => 'required',
            'email' => 'required|email',
            'password' => 'required|confirmed|min:8',
        ]);

        // Prevent password resets for accounts whose linked employee is DELETED
        $user = User::where('email', $request->input('email'))->with('employee')->first();
        if ($user && $user->employee && strtoupper((string) $user->employee->status) === 'DELETED') {
            return back()->withErrors(['email' => 'Unable to reset password for this account.']);
        }

        $status = Password::reset(
            $request->only('email', 'password', 'password_confirmation', 'token'),
            function ($user, $password) {
                $user->password = Hash::make($password);
                $user->setRememberToken(Str::random(60));
                $user->save();
            }
        );

        if ($status == Password::PASSWORD_RESET) {
            // Instead of immediately redirecting to login, render the reset page with
            // a success message so the client can display the floating alert first
            // and then redirect to login via JS. This provides the UX you requested.
            $message = __($status);
            return view('reset-password.reset', [
                'token' => null,
                'email' => $request->email,
                'status_message' => $message,
                'redirect_to' => route('login'),
            ]);
        }

        return back()->withErrors(['email' => [__($status)]]);
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
}
