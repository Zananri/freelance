<?php
// Simple script to send test mail via Laravel Mail
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\Mail;

Mail::raw('Test message sent from script', function($m){
    $m->to('symlmrnri17@gmail.com')->subject('Test Mail From Script');
});

echo "Mail send attempted\n";