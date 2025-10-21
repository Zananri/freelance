<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

class SendTestProjectNotification extends Command
{
    protected $signature = 'notify:project {projectId} {email?}';
    protected $description = 'Stubbed command — notifications disabled';

    public function handle()
    {
        $this->info('Notification command is currently disabled.');
        return 0;
    }
}
