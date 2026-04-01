<?php

namespace App\Http\Controllers\CRM;

use App\Http\Controllers\Controller;
use App\Models\CrmActivity;
use App\Models\CrmLead;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ActivityController extends Controller
{
    public function index(CrmLead $lead)
    {
        return response()->json(
            $lead->activities()
                ->with(['user:id,name,email', 'creator:id,name'])
                ->orderByRaw('CASE WHEN completed_at IS NULL THEN 0 ELSE 1 END')
                ->orderBy('due_at')
                ->latest('id')
                ->get()
        );
    }

    public function store(Request $request, CrmLead $lead)
    {
        $validated = $this->validateActivity($request);

        $activity = DB::transaction(function () use ($lead, $validated) {
            $activity = CrmActivity::create([
                'lead_id' => $lead->id,
                'user_id' => $validated['user_id'] ?? $lead->owner_id,
                'created_by' => auth()->id(),
                'activity_type' => $validated['activity_type'],
                'priority' => $validated['priority'] ?? 'normal',
                'subject' => $validated['subject'],
                'notes' => $validated['notes'] ?? null,
                'due_at' => $validated['due_at'] ?? null,
                'completed_at' => $validated['completed_at'] ?? null,
                'send_email_reminder' => (bool) ($validated['send_email_reminder'] ?? true),
            ]);

            $this->syncLeadFollowUp($lead->fresh());

            return $activity;
        });

        return response()->json($activity->load(['user:id,name,email', 'creator:id,name']), 201);
    }

    public function update(Request $request, CrmActivity $activity)
    {
        $validated = $this->validateActivity($request, true);

        $activity = DB::transaction(function () use ($activity, $validated) {
            $activity->update([
                'user_id' => $validated['user_id'] ?? $activity->user_id,
                'activity_type' => $validated['activity_type'] ?? $activity->activity_type,
                'priority' => $validated['priority'] ?? $activity->priority,
                'subject' => $validated['subject'] ?? $activity->subject,
                'notes' => array_key_exists('notes', $validated) ? $validated['notes'] : $activity->notes,
                'due_at' => array_key_exists('due_at', $validated) ? $validated['due_at'] : $activity->due_at,
                'completed_at' => array_key_exists('completed_at', $validated) ? $validated['completed_at'] : $activity->completed_at,
                'send_email_reminder' => array_key_exists('send_email_reminder', $validated) ? (bool) $validated['send_email_reminder'] : $activity->send_email_reminder,
                'email_reminded_at' => array_key_exists('due_at', $validated) || array_key_exists('send_email_reminder', $validated)
                    ? null
                    : $activity->email_reminded_at,
            ]);

            $this->syncLeadFollowUp($activity->lead()->first());

            return $activity;
        });

        return response()->json($activity->load(['user:id,name,email', 'creator:id,name']));
    }

    public function complete(Request $request, CrmActivity $activity)
    {
        $validated = $request->validate([
            'notes' => ['sometimes', 'nullable', 'string'],
        ]);

        $activity = DB::transaction(function () use ($activity, $validated) {
            $notes = $activity->notes;
            if (!empty($validated['notes'])) {
                $notes = trim(($notes ? $notes . "\n\n" : '') . 'Cierre: ' . $validated['notes']);
            }

            $activity->update([
                'completed_at' => now(),
                'notes' => $notes,
            ]);

            $this->syncLeadFollowUp($activity->lead()->first());

            return $activity;
        });

        return response()->json($activity->load(['user:id,name,email', 'creator:id,name']));
    }

    public function destroy(CrmActivity $activity)
    {
        $lead = $activity->lead()->first();
        $activity->delete();

        if ($lead) {
            $this->syncLeadFollowUp($lead);
        }

        return response()->json(['success' => true]);
    }

    public function upcoming(Request $request)
    {
        $validated = $request->validate([
            'owner_id' => ['sometimes', 'nullable', 'integer', 'exists:users,id'],
        ]);

        $rows = CrmActivity::query()
            ->with(['lead:id,title,pipeline_id,stage_id', 'lead.pipeline:id,name', 'lead.stage:id,name', 'user:id,name,email'])
            ->whereNull('completed_at')
            ->whereNotNull('due_at')
            ->when(isset($validated['owner_id']), fn ($query) => $query->where('user_id', $validated['owner_id']))
            ->orderBy('due_at')
            ->limit(100)
            ->get();

        return response()->json($rows);
    }

    private function validateActivity(Request $request, bool $partial = false): array
    {
        return $request->validate([
            'user_id' => [$partial ? 'sometimes' : 'nullable', 'nullable', 'integer', 'exists:users,id'],
            'activity_type' => [$partial ? 'sometimes' : 'required', 'string', 'max:50'],
            'priority' => ['sometimes', 'nullable', 'in:low,normal,high,urgent'],
            'subject' => [$partial ? 'sometimes' : 'required', 'string', 'max:180'],
            'notes' => ['sometimes', 'nullable', 'string'],
            'due_at' => ['sometimes', 'nullable', 'date'],
            'completed_at' => ['sometimes', 'nullable', 'date'],
            'send_email_reminder' => ['sometimes', 'boolean'],
        ]);
    }

    private function syncLeadFollowUp(CrmLead $lead): void
    {
        $nextActivity = $lead->activities()
            ->whereNull('completed_at')
            ->whereNotNull('due_at')
            ->orderBy('due_at')
            ->first();

        $lead->update([
            'next_follow_up_at' => optional($nextActivity)->due_at,
            'last_activity_at' => now(),
        ]);
    }
}
