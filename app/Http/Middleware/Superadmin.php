<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class Superadmin
{
    public function handle(Request $request, Closure $next): Response
    {
        abort_unless($request->user()?->user_type === 'SUPERADMIN', 403);

        return $next($request);
    }
}
