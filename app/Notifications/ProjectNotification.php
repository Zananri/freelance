<?php

namespace App\Notifications;

use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Messages\DatabaseMessage;
use Illuminate\Support\Facades\URL;

class ProjectNotification extends Notification
{
    protected $project;
    protected $actor; // User who triggered the notification (optional)

    /**
     * @param  \App\Models\Project  $project
     * @param  mixed|null $actor
     */
    public function __construct($project, $actor = null)
    {
        $this->project = $project;
        $this->actor = $actor;
    }

    public function via($notifiable)
    {
        // Send email only. The app uses a custom `notifications` table schema,
        // which is incompatible with Laravel's default database notification channel.
        return ['mail'];
    }

    public function toMail($notifiable)
    {
        $project = $this->project;

        // Build URL to project.show route (uses named route found in routes/web.php)
        // We create a full URL using the id and optional slug if available
        $slug = isset($project->title) ? str_replace(' ', '-', strtolower(preg_replace('/[^A-Za-z0-9\- ]/', '', $project->title))) : null;
        $url = url(route('project.show', ['id' => $project->id, 'slug' => $slug], false));

        $subject = 'New Project: ' . ($project->title ?? 'Untitled');

        return (new MailMessage)
            ->subject($subject)
            ->view('emails.project-notification', [
                'project' => $project,
                'url' => $url,
                'actor' => $this->actor,
            ]);
    }

    public function toDatabase($notifiable)
    {
        return [
            'project_id' => $this->project->id,
            'title' => $this->project->title ?? 'Untitled project',
            'message' => 'A project has been created/updated',
            'url' => url(route('project.show', ['id' => $this->project->id], false)),
            'actor_id' => $this->actor ? ($this->actor->id ?? null) : null,
        ];
    }
}
