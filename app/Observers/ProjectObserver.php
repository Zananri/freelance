<?php

namespace App\Observers;

use App\Models\Project;
use App\Models\ProjectAssignment;
use App\Notifications\ProjectNotification;
use Illuminate\Support\Facades\Notification;

class ProjectObserver
{
    /**
     * Handle the Project "created" event.
     */
    public function created(Project $project): void
    {
        $this->notifyAssignees($project, 'created');
    }

    /**
     * Handle the Project "updated" event.
     */
    public function updated(Project $project): void
    {
        $this->notifyAssignees($project, 'updated');
    }

    protected function notifyAssignees(Project $project, $action = 'created')
    {
        // Find assignments where is_receive is truthy (1)
        $assignments = ProjectAssignment::where('project_id', $project->id)
            ->where('is_receive', 1)
            ->with('employee')
            ->get();

        $notifiables = [];

        foreach ($assignments as $assignment) {
            $employee = $assignment->employee;
            if (!$employee) {
                continue;
            }

            // Prefer the related user model if available, otherwise create a simple notifiable object
            if ($employee->user) {
                $notifiables[] = $employee->user;
            } elseif (!empty($employee->email)) {
                // Create a minimal notifiable that has routeNotificationForMail
                $notifiables[] = new class($employee->email) {
                    public $email;
                    public function __construct($email) { $this->email = $email; }
                    public function routeNotificationForMail() { return $this->email; }
                };
            }
        }

        if (empty($notifiables)) {
            return;
        }

        // Send notification (mail + database)
        Notification::send($notifiables, new ProjectNotification($project));
    }
}
