<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
// Project observer disabled (removed to stop automatic email notifications)
// use App\Models\Project;
// use App\Observers\ProjectObserver;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
    // Project observers disabled to prevent email sending while debugging
    // Project::observe(ProjectObserver::class);
    }
}
