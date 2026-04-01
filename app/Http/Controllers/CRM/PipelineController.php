<?php

namespace App\Http\Controllers\CRM;

use App\Http\Controllers\Controller;
use App\Models\CrmPipeline;
use App\Models\CrmPipelineStage;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class PipelineController extends Controller
{
    public function index()
    {
        $pipelines = CrmPipeline::query()
            ->with([
                'stages' => fn ($query) => $query->orderBy('position'),
                'leads' => fn ($query) => $query->where('is_archived', false),
            ])
            ->orderByDesc('is_default')
            ->orderBy('name')
            ->get();

        return response()->json($pipelines);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:150',
            'description' => 'nullable|string',
            'is_default' => 'boolean',
            'stages' => 'nullable|array|min:1',
            'stages.*.name' => 'required|string|max:100',
            'stages.*.color' => 'nullable|string|max:20',
            'stages.*.is_closed_won' => 'boolean',
            'stages.*.is_closed_lost' => 'boolean',
        ]);

        $stages = collect($validated['stages'] ?? $this->defaultStages());

        $pipeline = DB::transaction(function () use ($validated, $stages) {
            if (!empty($validated['is_default'])) {
                CrmPipeline::query()->update(['is_default' => false]);
            }

            $pipeline = CrmPipeline::create([
                'name' => $validated['name'],
                'slug' => $this->uniqueSlug($validated['name']),
                'description' => $validated['description'] ?? null,
                'is_default' => (bool) ($validated['is_default'] ?? false),
                'is_active' => true,
            ]);

            foreach ($stages->values() as $index => $stage) {
                CrmPipelineStage::create([
                    'pipeline_id' => $pipeline->id,
                    'name' => $stage['name'],
                    'color' => $stage['color'] ?? '#0f172a',
                    'position' => $index + 1,
                    'is_closed_won' => (bool) ($stage['is_closed_won'] ?? false),
                    'is_closed_lost' => (bool) ($stage['is_closed_lost'] ?? false),
                ]);
            }

            return $pipeline->load('stages');
        });

        return response()->json($pipeline, 201);
    }

    public function update(Request $request, CrmPipeline $pipeline)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:150',
            'description' => 'nullable|string',
            'is_default' => 'boolean',
            'is_active' => 'boolean',
            'stages' => 'nullable|array|min:1',
            'stages.*.id' => 'nullable|integer|exists:crm_pipeline_stages,id',
            'stages.*.name' => 'required|string|max:100',
            'stages.*.color' => 'nullable|string|max:20',
            'stages.*.is_closed_won' => 'boolean',
            'stages.*.is_closed_lost' => 'boolean',
        ]);

        $pipeline = DB::transaction(function () use ($pipeline, $validated) {
            if (!empty($validated['is_default'])) {
                CrmPipeline::query()->whereKeyNot($pipeline->id)->update(['is_default' => false]);
            }

            $pipeline->update([
                'name' => $validated['name'],
                'slug' => $pipeline->name !== $validated['name'] ? $this->uniqueSlug($validated['name'], $pipeline->id) : $pipeline->slug,
                'description' => $validated['description'] ?? null,
                'is_default' => (bool) ($validated['is_default'] ?? false),
                'is_active' => (bool) ($validated['is_active'] ?? true),
            ]);

            if (array_key_exists('stages', $validated)) {
                $incomingIds = collect($validated['stages'])->pluck('id')->filter()->all();

                $pipeline->stages()->whereNotIn('id', $incomingIds)->doesntHave('leads')->delete();

                foreach (collect($validated['stages'])->values() as $index => $stageData) {
                    $stage = $pipeline->stages()->firstOrNew([
                        'id' => $stageData['id'] ?? null,
                    ]);

                    $stage->fill([
                        'name' => $stageData['name'],
                        'color' => $stageData['color'] ?? '#0f172a',
                        'position' => $index + 1,
                        'is_closed_won' => (bool) ($stageData['is_closed_won'] ?? false),
                        'is_closed_lost' => (bool) ($stageData['is_closed_lost'] ?? false),
                    ]);

                    $stage->pipeline_id = $pipeline->id;
                    $stage->save();
                }
            }

            return $pipeline->load('stages');
        });

        return response()->json($pipeline);
    }

    public function destroy(CrmPipeline $pipeline)
    {
        if ($pipeline->leads()->exists()) {
            return response()->json([
                'message' => 'No se puede eliminar un embudo que todavía tiene leads asociados.',
            ], 422);
        }

        $pipeline->delete();

        if (!$pipeline->is_default && !CrmPipeline::query()->where('is_default', true)->exists()) {
            CrmPipeline::query()->orderBy('id')->limit(1)->update(['is_default' => true]);
        }

        return response()->json(['success' => true]);
    }

    private function uniqueSlug(string $name, ?int $ignoreId = null): string
    {
        $base = Str::slug($name);
        $slug = $base !== '' ? $base : 'pipeline';
        $counter = 1;

        while (
            CrmPipeline::query()
                ->when($ignoreId, fn ($query) => $query->whereKeyNot($ignoreId))
                ->where('slug', $slug)
                ->exists()
        ) {
            $counter++;
            $slug = $base . '-' . $counter;
        }

        return $slug;
    }

    private function defaultStages(): array
    {
        return [
            ['name' => 'Nuevo', 'color' => '#2563eb'],
            ['name' => 'Contactado', 'color' => '#7c3aed'],
            ['name' => 'Propuesta', 'color' => '#f59e0b'],
            ['name' => 'Ganado', 'color' => '#16a34a', 'is_closed_won' => true],
            ['name' => 'Perdido', 'color' => '#dc2626', 'is_closed_lost' => true],
        ];
    }
}
