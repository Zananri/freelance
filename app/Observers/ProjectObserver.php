<?php

namespace App\Observers;

/**
 * No-op ProjectObserver — left in place so registration is safe but
 * observer methods do nothing while debugging email issues.
 */
class ProjectObserver
{
    public function created($project): void
    {
        // intentionally no-op
    }

    public function updated($project): void
    {
        // intentionally no-op
    }
}
