<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CrmLead extends Model
{
    protected $table = 'crm_leads';

    protected $fillable = [
        'pipeline_id',
        'stage_id',
        'contacto_id',
        'owner_id',
        'converted_factura_venta_id',
        'title',
        'company_name',
        'contact_name',
        'email',
        'phone',
        'source',
        'probability',
        'expected_value',
        'next_follow_up_at',
        'last_activity_at',
        'notes',
        'is_archived',
    ];

    protected $casts = [
        'probability' => 'integer',
        'expected_value' => 'decimal:2',
        'next_follow_up_at' => 'datetime',
        'last_activity_at' => 'datetime',
        'is_archived' => 'boolean',
    ];

    public function pipeline(): BelongsTo
    {
        return $this->belongsTo(CrmPipeline::class, 'pipeline_id');
    }

    public function stage(): BelongsTo
    {
        return $this->belongsTo(CrmPipelineStage::class, 'stage_id');
    }

    public function contacto(): BelongsTo
    {
        return $this->belongsTo(Contacto::class, 'contacto_id');
    }

    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    public function convertedFactura(): BelongsTo
    {
        return $this->belongsTo(FacturaVenta::class, 'converted_factura_venta_id');
    }

    public function activities(): HasMany
    {
        return $this->hasMany(CrmActivity::class, 'lead_id');
    }
}
