<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Console\Scheduling\Schedule;
use App\Console\Commands\GenerateTasksFromSchedules;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withCommands([
        GenerateTasksFromSchedules::class,
    ])
    ->withSchedule(function (Schedule $schedule) {
        // Run the generator every minute to materialize tasks from schedules
        $schedule->command('schedules:generate')->everyMinute();
    })
    ->withMiddleware(function (Middleware $middleware) {
        $middleware->alias([
            'management' => \App\Http\Middleware\Management::class,
        ]);
          
    })
    ->withExceptions(function (Exceptions $exceptions) {
        //
    })->create();
