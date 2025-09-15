<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Console\Scheduling\Schedule;
use App\Http\Middleware\Management;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withSchedule(function (Schedule $schedule) {
        // Run schedule generators by recurrence type at sensible intervals
        $schedule->command('schedules:generate --type=daily')->dailyAt('00:05')->onOneServer();

        $schedule->command('schedules:generate --type=weekly')->dailyAt('00:10')->onOneServer();

        $schedule->command('schedules:generate --type=monthly')->dailyAt('00:15')->onOneServer();
    })
    ->withMiddleware(function (Middleware $middleware) {
        $middleware->alias([
            'management' => Management::class,
        ]);
          
    })
    ->withExceptions(function (Exceptions $exceptions) {
        //
    })->create();
