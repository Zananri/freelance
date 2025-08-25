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
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $userType = explode(',',Auth::user()->user_type) ;
        $arrUserAllow = array('MANAGEMENT','ADMINISTRATOR');
        
        foreach($userType as $item ){
            if( in_array($item,$arrUserAllow)){
                return $next($request);
            }
        }

        // if(Auth::user()->user_type == 'admin_web' || Auth::user()->user_type == 'admin_warehouse'){
        //     return $next($request);
        // }

        return redirect('/');
        
    }
}
