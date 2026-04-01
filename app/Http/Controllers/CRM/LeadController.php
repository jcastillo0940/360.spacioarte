<?php

namespace App\Http\Controllers\CRM;

use App\Http\Controllers\Controller;
use App\Models\CrmLead;
use App\Models\CrmPipeline;
use App\Models\CrmPipelineStage;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class LeadController extends Controller
{
    public function index(Request $request)
    {
        $validated = $request->validate([
            'pipeline_id' => 'nullable|integer|exists:crm_pipelines,id',
            'stage_id' => 'nullable|integer|exists:crm_pipeline_stages,id',
            'owner_id' => 'nullable|integer|exists:users,id',
            'archived' => 'nullable|boolean',
        ]);

        $leads = CrmLead::query()
            ->with(['pipeline', 'stage', 'contacto', 'owner'])
            ->when(isset($validated['pipeline_id']), fn ($query) => $query->where('pipeline_id', $validated['pipeline_id']))
            ->when(isset($validated['stage_id']), fn ($query) => $query->where('stage_id', $validated['stage_id']))
            ->when(isset($validated['owner_id']), fn ($query) => $query->where('owner_id', $validated['owner_id']))
            ->when(array_key_exists('archived', $validated), fn ($query) => $query->where('is_archived', (bool) $validated['archived']), fn ($query) => $query->where('is_archived', false))
            ->orderByRaw('COALESCE(next_follow_up_at, created_at) asc')
            ->get();

        return response()->json($leads);
    }

    public function store(Request $request)
    {
        $validated = $this->validateLead($request);

        $lead = DB::transaction(function () use ($validated) {
            $pipeline = CrmPipeline::query()->findOrFail($validated['pipeline_id']);
            $stage = $this->resolveStage($pipeline, $validated['stage_id'] ?? null);

            return CrmLead::create([
                'pipeline_id' => $pipeline->id,
                'stage_id' => $stage->id,
                'contacto_id' => $validated['contacto_id'] ?? null,
                'owner_id' => $validated['owner_id'] ?? null,
                'title' => $validated['title'],
                'company_name' => $validated['company_name'] ?? null,
                'contact_name' => $validated['contact_name'] ?? null,
                'email' => $validated['email'] ?? null,
                'phone' => $validated['phone'] ?? null,
                'source' => $validated['source'] ?? null,
                'probability' => $validated['probability'] ?? 0,
                'expected_value' => $validated['expected_value'] ?? 0,
                'next_follow_up_at' => $validated['next_follow_up_at'] ?? null,
                'last_activity_at' => $validated['last_activity_at'] ?? null,
                'notes' => $validated['notes'] ?? null,
                'is_archived' => (bool) ($validated['is_archived'] ?? false),
            ])->load(['pipeline', 'stage', 'contacto', 'owner']);
        });

        return response()->json($lead, 201);
    }

    public function update(Request $request, CrmLead $lead)
    {
        $validated = $this->validateLead($request, true);

        $lead = DB::transaction(function () use ($lead, $validated) {
            $pipeline = isset($validated['pipeline_id'])
                ? CrmPipeline::query()->findOrFail($validated['pipeline_id'])
                : $lead->pipeline;

            $stage = array_key_exists('stage_id', $validated)
                ? $this->resolveStage($pipeline, $validated['stage_id'])
                : ($pipeline->id !== $lead->pipeline_id
                    ? $this->resolveStage($pipeline, null)
                    : $lead->stage);

            $lead->update([
                'pipeline_id' => $pipeline->id,
                'stage_id' => $stage->id,
                'contacto_id' => $validated['contacto_id'] ?? $lead->contacto_id,
                'owner_id' => $validated['owner_id'] ?? $lead->owner_id,
                'title' => $validated['title'] ?? $lead->title,
                'company_name' => $validated['company_name'] ?? $lead->company_name,
                'contact_name' => $validated['contact_name'] ?? $lead->contact_name,
                'email' => $validated['email'] ?? $lead->email,
                'phone' => $validated['phone'] ?? $lead->phone,
                'source' => $validated['source'] ?? $lead->source,
                'probability' => $validated['probability'] ?? $lead->probability,
                'expected_value' => $validated['expected_value'] ?? $lead->expected_value,
                'next_follow_up_at' => array_key_exists('next_follow_up_at', $validated) ? $validated['next_follow_up_at'] : $lead->next_follow_up_at,
                'last_activity_at' => array_key_exists('last_activity_at', $validated) ? $validated['last_activity_at'] : $lead->last_activity_at,
                'notes' => $validated['notes'] ?? $lead->notes,
                'is_archived' => (bool) ($validated['is_archived'] ?? $lead->is_archived),
            ]);

            return $lead->load(['pipeline', 'stage', 'contacto', 'owner']);
        });

        return response()->json($lead);
    }

    public function move(Request $request, CrmLead $lead)
    {
        $validated = $request->validate([
            'pipeline_id' => 'required|integer|exists:crm_pipelines,id',
            'stage_id' => 'required|integer|exists:crm_pipeline_stages,id',
        ]);

        $pipeline = CrmPipeline::query()->findOrFail($validated['pipeline_id']);
        $stage = $this->resolveStage($pipeline, $validated['stage_id']);

        $lead->update([
            'pipeline_id' => $pipeline->id,
            'stage_id' => $stage->id,
            'last_activity_at' => now(),
        ]);

        return response()->json($lead->load(['pipeline', 'stage', 'contacto', 'owner']));
    }

    public function destroy(CrmLead $lead)
    {
        $lead->delete();

        return response()->json(['success' => true]);
    }

    private function validateLead(Request $request, bool $partial = false): array
    {
        $rules = [
            'pipeline_id' => [$partial ? 'sometimes' : 'required', 'integer', 'exists:crm_pipelines,id'],
            'stage_id' => ['sometimes', 'nullable', 'integer', 'exists:crm_pipeline_stages,id'],
            'contacto_id' => ['sometimes', 'nullable', 'integer', 'exists:contactos,id'],
            'owner_id' => ['sometimes', 'nullable', 'integer', 'exists:users,id'],
            'title' => [$partial ? 'sometimes' : 'required', 'string', 'max:180'],
            'company_name' => ['sometimes', 'nullable', 'string', 'max:180'],
            'contact_name' => ['sometimes', 'nullable', 'string', 'max:180'],
            'email' => ['sometimes', 'nullable', 'email', 'max:180'],
            'phone' => ['sometimes', 'nullable', 'string', 'max:50'],
            'source' => ['sometimes', 'nullable', 'string', 'max:100'],
            'probability' => ['sometimes', 'nullable', 'integer', 'min:0', 'max:100'],
            'expected_value' => ['sometimes', 'nullable', 'numeric', 'min:0'],
            'next_follow_up_at' => ['sometimes', 'nullable', 'date'],
            'last_activity_at' => ['sometimes', 'nullable', 'date'],
            'notes' => ['sometimes', 'nullable', 'string'],
            'is_archived' => ['sometimes', 'boolean'],
        ];

        return $request->validate($rules);
    }

    private function resolveStage(CrmPipeline $pipeline, ?int $stageId): CrmPipelineStage
    {
        if ($stageId) {
            return CrmPipelineStage::query()
                ->where('pipeline_id', $pipeline->id)
                ->findOrFail($stageId);
        }

        return $pipeline->stages()->orderBy('position')->firstOrFail();
    }
}
