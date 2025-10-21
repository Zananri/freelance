<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Project;
use App\Notifications\ProjectNotification;

class SendTestProjectNotification extends Command
{
    protected $signature = 'notify:project {projectId} {email?}';
    protected $description = 'Send a test project notification to assignees or a specific email';

    public function handle()
    {
        $projectId = $this->argument('projectId');
        $email = $this->argument('email');

        $project = Project::find($projectId);
        if (!$project) {
            $this->error('Project not found');
            return 1;
        }

        if ($email) {
            // Send to a single ad-hoc email
            $notifiable = new class($email) {
                public $email;
                public function __construct($email) { $this->email = $email; }
                public function routeNotificationForMail() { return $this->email; }
            };
            $notifiable->notify(new ProjectNotification($project));
            $this->info('Notification sent to ' . $email);
            return 0;
        }

        // Otherwise, send to all assignees that have is_receive=1
        $project->load(['projectAssignments.employee.user']);
        $sent = 0;
        foreach ($project->projectAssignments as $assign) {
            if (!$assign->is_receive) continue;
            $employee = $assign->employee;
            if ($employee && $employee->user) {
                $employee->user->notify(new ProjectNotification($project));
                $sent++;
            } elseif ($employee && $employee->email) {
                $not = new class($employee->email) {
                    public $email;
                    public function __construct($email) { $this->email = $email; }
                    public function routeNotificationForMail() { return $this->email; }
                };
                $not->notify(new ProjectNotification($project));
                $sent++;
            }
        }

        $this->info("Notifications sent: $sent");
        return 0;
    }
}
