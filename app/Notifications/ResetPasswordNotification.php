<?php

namespace App\Notifications;

use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Support\Facades\URL;

class ResetPasswordNotification extends Notification
{
    public $token;

    public function __construct($token)
    {
        $this->token = $token;
    }

    public function via($notifiable)
    {
        return ['mail'];
    }

    public function toMail($notifiable)
    {
        $recipientEmail = $notifiable->getEmailForPasswordReset();
        $url = url('/reset-password/'.$this->token).'?email='.urlencode($recipientEmail);

        // Important: SMTP authentication (MAIL_USERNAME / MAIL_PASSWORD) must be a valid mail account.
        // You cannot dynamically authenticate as an arbitrary address entered in the forgot form.
        // Best option for making replies go to the entered email is to set Reply-To to that address.
        return (new MailMessage)
            ->subject('Reset Password')
            ->replyTo($recipientEmail)
            ->view('emails.reset_password', ['url' => $url]);
    }
}
