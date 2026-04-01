<?php

namespace App\Console\Commands;

use App\Mail\CrmReminderMail;
use App\Models\CrmActivity;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Mail;

class SendCrmReminderEmails extends Command
{
    protected $signature = 'crm:send-reminders';
    protected $description = 'Envia recordatorios por email para seguimientos CRM pendientes';

    public function handle(): int
    {
        $cutoff = now()->addHour();

        $activities = CrmActivity::query()
            ->with(['lead.pipeline', 'lead.stage', 'user'])
            ->whereNull('completed_at')
            ->where('send_email_reminder', true)
            ->whereNull('email_reminded_at')
            ->whereNotNull('due_at')
            ->where('due_at', '<=', $cutoff)
            ->get();

        $sent = 0;

        foreach ($activities as $activity) {
            if (!$activity->user?->email) {
                continue;
            }

            Mail::to($activity->user->email)->send(new CrmReminderMail($activity));
            $activity->update(['email_reminded_at' => now()]);
            $sent++;
        }

        $this->info("Recordatorios enviados: {$sent}");

        return self::SUCCESS;
    }
}
