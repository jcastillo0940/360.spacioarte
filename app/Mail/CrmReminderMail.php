<?php

namespace App\Mail;

use App\Models\CrmActivity;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class CrmReminderMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public CrmActivity $activity)
    {
    }

    public function build()
    {
        $lead = $this->activity->lead;

        return $this->subject('Recordatorio CRM: ' . $this->activity->subject)
            ->view('emails.crm.reminder', [
                'activity' => $this->activity,
                'lead' => $lead,
                'owner' => $this->activity->user,
            ]);
    }
}
