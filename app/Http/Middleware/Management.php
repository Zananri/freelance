<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Illuminate\Support\Facades\Auth;

class Management
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = Auth::user();

        if ($user->user_type === 'SUPERADMIN') {
            return $next($request);
        }

        if (
            $user->user_type === 'ADMINISTRATOR' &&
            in_array($user->user_role, [
                'CEO',
                'GENERAL_MANAGER',
                'HR_MANAGER',
                'ADMINISTRATOR',
            ])
        ) {
            return $next($request);
        }

        return redirect('/');
    }
}