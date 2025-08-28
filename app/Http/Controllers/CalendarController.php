<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class CalendarController extends Controller
{
    //
    public function showCalendarPage()
    {
        return view('calendar.calendar');
    }
}
