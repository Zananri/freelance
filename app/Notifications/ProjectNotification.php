<?php

namespace App\Notifications;

use Illuminate\Notifications\Notification;

/**
 * Stub ProjectNotification — disabled to avoid sending emails.
 * Keeps class available so other code referencing it doesn't fatal, but
 * via() returns an empty array so no channels are used.
 */
class ProjectNotification extends Notification
{
    public function __construct($project = null, $actor = null)
    {
        // intentionally empty
    }

    public function via($notifiable)
    {
        // No channels — fully disabled
        return [];
    }
}
