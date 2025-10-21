<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Helpers\ActivityHelper;

class CalendarController extends Controller
{
    //
    public function showCalendarPage()
    {
        try {
            $user = auth()->user();
            $employeeId = $user && $user->employee ? $user->employee->id : null;
            ActivityHelper::record([
                'employee_id' => $employeeId,
                'menu' => 'CALENDAR',
                'activity' => 'VIEW_PAGE',
                'description' => ($user?->employee?->name ?? 'Unknown') . ' View page calendar',
            ]);
        } catch (\Throwable $_) {}

        return view('calendar.calendar');
    }
}
