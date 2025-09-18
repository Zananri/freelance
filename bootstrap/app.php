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
        $schedule->command('schedules:generate --type=daily')
            ->dailyAt('00:05')
            ->onOneServer()
            ->withoutOverlapping();

        $schedule->command('schedules:generate --type=weekly --lead-days=6')
            ->weeklyOn(1, '00:10') 
            ->onOneServer()
            ->withoutOverlapping();

        $schedule->command('schedules:generate --type=monthly --to-end-of-month')
            ->monthlyOn(1, '00:15') 
            ->onOneServer()
            ->withoutOverlapping();
    })
    ->withMiddleware(function (Middleware $middleware) {
        $middleware->alias([
            'management' => Management::class,
        ]);
          
    })
    ->withExceptions(function (Exceptions $exceptions) {
        //
    })->create();
