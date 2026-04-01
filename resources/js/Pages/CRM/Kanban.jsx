import React, { useEffect, useMemo, useState } from 'react';
import { Head } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { CalendarClock, CheckCircle2, DollarSign, Funnel, Pencil, Plus, RefreshCw, Save, Trash2, Users } from 'lucide-react';

const EMPTY_LEAD_FORM = {
    title: '',
    pipeline_id: '',
    stage_id: '',
    contacto_id: '',
    owner_id: '',
    company_name: '',
    contact_name: '',
    email: '',
    phone: '',
    source: '',
    probability: 0,
    expected_value: '0.00',
    next_follow_up_at: '',
    notes: '',
};

const EMPTY_PIPELINE_FORM = {
    name: '',
    description: '',
    is_default: false,
    stages_text: 'Nuevo`nContactado`nPropuesta`nGanado|#16a34a|won`nPerdido|#dc2626|lost',
};

const EMPTY_ACTIVITY_FORM = {
    activity_type: 'seguimiento',
    priority: 'normal',
    subject: '',
    notes: '',
    due_at: '',
    user_id: '',
    send_email_reminder: true,
};

const EMPTY_LEAD_EDIT_FORM = {
    title: '',
    owner_id: '',
    company_name: '',
    contact_name: '',
    email: '',
    phone: '',
    source: '',
    probability: 0,
    expected_value: '0.00',
    next_follow_up_at: '',
    notes: '',
    is_archived: false,
};

const money = (value) => `$${Number(value || 0).toFixed(2)}`;
const toLocalDatetime = (value) => {
    if (!value) return '';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '' : date.toISOString().slice(0, 16);
};

export default function Kanban() {
    const [pipelines, setPipelines] = useState([]);
    const [selectedPipelineId, setSelectedPipelineId] = useState('');
    const [contacts, setContacts] = useState([]);
    const [users, setUsers] = useState([]);
    const [upcomingActivities, setUpcomingActivities] = useState([]);
    const [selectedLead, setSelectedLead] = useState(null);
    const [leadEditForm, setLeadEditForm] = useState(EMPTY_LEAD_EDIT_FORM);
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingActivities, setLoadingActivities] = useState(false);
    const [savingLead, setSavingLead] = useState(false);
    const [savingLeadUpdate, setSavingLeadUpdate] = useState(false);
    const [savingPipeline, setSavingPipeline] = useState(false);
    const [savingActivity, setSavingActivity] = useState(false);
    const [showLeadModal, setShowLeadModal] = useState(false);
    const [showPipelineModal, setShowPipelineModal] = useState(false);
    const [leadForm, setLeadForm] = useState(EMPTY_LEAD_FORM);
    const [pipelineForm, setPipelineForm] = useState(EMPTY_PIPELINE_FORM);
    const [activityForm, setActivityForm] = useState(EMPTY_ACTIVITY_FORM);
    const [draggedLeadId, setDraggedLeadId] = useState(null);

    const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';

    const hydrateLeadEditForm = (lead) => ({
        title: lead?.title || '',
        owner_id: lead?.owner_id ? String(lead.owner_id) : '',
        company_name: lead?.company_name || '',
        contact_name: lead?.contact_name || '',
        email: lead?.email || '',
        phone: lead?.phone || '',
        source: lead?.source || '',
        probability: lead?.probability ?? 0,
        expected_value: String(lead?.expected_value ?? '0.00'),
        next_follow_up_at: toLocalDatetime(lead?.next_follow_up_at),
        notes: lead?.notes || '',
        is_archived: Boolean(lead?.is_archived),
    });

    const requestJson = async (url, options = {}) => {
        const response = await fetch(url, {
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': csrfToken,
                ...(options.headers || {}),
            },
            ...options,
        });

        const payload = await response.json().catch(() => ({}));

        if (!response.ok) {
            throw new Error(payload?.message || 'No se pudo completar la operacion.');
        }

        return payload;
    };

    const loadActivities = async (leadId) => {
        if (!leadId) {
            setActivities([]);
            return;
        }

        setLoadingActivities(true);
        try {
            const payload = await requestJson(`/api/crm/leads/${leadId}/activities`);
            setActivities(Array.isArray(payload) ? payload : []);
        } catch (error) {
            alert(error.message || 'No se pudieron cargar las actividades.');
        } finally {
            setLoadingActivities(false);
        }
    };

    const loadData = async () => {
        setLoading(true);

        try {
            const [pipelinesPayload, contactsPayload, usersPayload, upcomingPayload] = await Promise.all([
                requestJson('/api/crm/pipelines'),
                requestJson('/api/inventario/contactos'),
                requestJson('/api/configuracion/usuarios'),
                requestJson('/api/crm/activities/upcoming'),
            ]);

            const nextPipelines = Array.isArray(pipelinesPayload) ? pipelinesPayload : [];
            const nextContacts = Array.isArray(contactsPayload?.contactos) ? contactsPayload.contactos : [];
            const nextUsers = Array.isArray(usersPayload?.users) ? usersPayload.users : [];
            const nextUpcoming = Array.isArray(upcomingPayload) ? upcomingPayload : [];

            setPipelines(nextPipelines);
            setContacts(nextContacts);
            setUsers(nextUsers);
            setUpcomingActivities(nextUpcoming);

            setSelectedPipelineId((current) => {
                if (current && nextPipelines.some((pipeline) => String(pipeline.id) === String(current))) {
                    return current;
                }

                const defaultPipeline = nextPipelines.find((pipeline) => pipeline.is_default) || nextPipelines[0];
                return defaultPipeline ? String(defaultPipeline.id) : '';
            });

            setSelectedLead((currentLead) => {
                if (!currentLead) return null;

                for (const pipeline of nextPipelines) {
                    const found = (pipeline.leads || []).find((lead) => lead.id === currentLead.id);
                    if (found) {
                        setLeadEditForm(hydrateLeadEditForm(found));
                        return found;
                    }
                }

                return null;
            });
        } catch (error) {
            alert(error.message || 'No se pudo cargar el CRM.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        if (selectedLead?.id) {
            loadActivities(selectedLead.id);
            setActivityForm((prev) => ({
                ...prev,
                user_id: selectedLead.owner_id ? String(selectedLead.owner_id) : '',
            }));
            setLeadEditForm(hydrateLeadEditForm(selectedLead));
        } else {
            setActivities([]);
            setLeadEditForm(EMPTY_LEAD_EDIT_FORM);
        }
    }, [selectedLead?.id]);

    const selectedPipeline = useMemo(
        () => pipelines.find((pipeline) => String(pipeline.id) === String(selectedPipelineId)) || null,
        [pipelines, selectedPipelineId]
    );

    const stageMap = useMemo(() => {
        const map = new Map();
        (selectedPipeline?.stages || []).forEach((stage) => map.set(String(stage.id), []));

        (selectedPipeline?.leads || []).forEach((lead) => {
            const key = String(lead.stage_id);
            if (!map.has(key)) {
                map.set(key, []);
            }
            map.get(key).push(lead);
        });

        return map;
    }, [selectedPipeline]);

    const summary = useMemo(() => {
        const leads = selectedPipeline?.leads || [];
        const openLeads = leads.filter((lead) => !lead.is_archived);

        return {
            totalLeads: openLeads.length,
            totalValue: openLeads.reduce((acc, lead) => acc + Number(lead.expected_value || 0), 0),
            withFollowUp: openLeads.filter((lead) => lead.next_follow_up_at).length,
            pendingActivities: upcomingActivities.length,
        };
    }, [selectedPipeline, upcomingActivities]);

    const openLeadModal = () => {
        const firstStage = selectedPipeline?.stages?.[0];

        setLeadForm({
            ...EMPTY_LEAD_FORM,
            pipeline_id: selectedPipeline ? String(selectedPipeline.id) : '',
            stage_id: firstStage ? String(firstStage.id) : '',
        });

        setShowLeadModal(true);
    };

    const openLeadPanel = (lead) => {
        setSelectedLead(lead);
        setLeadEditForm(hydrateLeadEditForm(lead));
        setActivityForm({
            ...EMPTY_ACTIVITY_FORM,
            user_id: lead?.owner_id ? String(lead.owner_id) : '',
            due_at: toLocalDatetime(lead?.next_follow_up_at),
        });
    };

    const handleCreatePipeline = async (event) => {
        event.preventDefault();
        setSavingPipeline(true);

        try {
            const stages = pipelineForm.stages_text
                .split('\n')
                .map((line) => line.trim())
                .filter(Boolean)
                .map((line) => {
                    const [name, color, flag] = line.split('|').map((part) => part?.trim());

                    return {
                        name,
                        color: color || '#0f172a',
                        is_closed_won: flag === 'won',
                        is_closed_lost: flag === 'lost',
                    };
                });

            await requestJson('/api/crm/pipelines', {
                method: 'POST',
                body: JSON.stringify({
                    name: pipelineForm.name,
                    description: pipelineForm.description,
                    is_default: pipelineForm.is_default,
                    stages,
                }),
            });

            setShowPipelineModal(false);
            setPipelineForm(EMPTY_PIPELINE_FORM);
            await loadData();
        } catch (error) {
            alert(error.message || 'No se pudo crear el embudo.');
        } finally {
            setSavingPipeline(false);
        }
    };

    const handleCreateLead = async (event) => {
        event.preventDefault();
        setSavingLead(true);

        try {
            await requestJson('/api/crm/leads', {
                method: 'POST',
                body: JSON.stringify({
                    ...leadForm,
                    contacto_id: leadForm.contacto_id || null,
                    owner_id: leadForm.owner_id || null,
                    pipeline_id: Number(leadForm.pipeline_id),
                    stage_id: leadForm.stage_id ? Number(leadForm.stage_id) : null,
                    probability: Number(leadForm.probability || 0),
                    expected_value: Number(leadForm.expected_value || 0),
                    next_follow_up_at: leadForm.next_follow_up_at || null,
                }),
            });

            setShowLeadModal(false);
            setLeadForm(EMPTY_LEAD_FORM);
            await loadData();
        } catch (error) {
            alert(error.message || 'No se pudo crear el lead.');
        } finally {
            setSavingLead(false);
        }
    };

    const handleUpdateLead = async (event) => {
        event.preventDefault();
        if (!selectedLead) return;

        setSavingLeadUpdate(true);
        try {
            const updated = await requestJson(`/api/crm/leads/${selectedLead.id}`, {
                method: 'PUT',
                body: JSON.stringify({
                    ...leadEditForm,
                    owner_id: leadEditForm.owner_id || null,
                    probability: Number(leadEditForm.probability || 0),
                    expected_value: Number(leadEditForm.expected_value || 0),
                    next_follow_up_at: leadEditForm.next_follow_up_at || null,
                }),
            });

            setSelectedLead(updated);
            await loadData();
        } catch (error) {
            alert(error.message || 'No se pudo actualizar el lead.');
        } finally {
            setSavingLeadUpdate(false);
        }
    };

    const handleCreateActivity = async (event) => {
        event.preventDefault();
        if (!selectedLead) return;

        setSavingActivity(true);
        try {
            await requestJson(`/api/crm/leads/${selectedLead.id}/activities`, {
                method: 'POST',
                body: JSON.stringify({
                    ...activityForm,
                    user_id: activityForm.user_id || null,
                    due_at: activityForm.due_at || null,
                }),
            });

            setActivityForm({ ...EMPTY_ACTIVITY_FORM, user_id: selectedLead.owner_id ? String(selectedLead.owner_id) : '' });
            await Promise.all([loadActivities(selectedLead.id), loadData()]);
        } catch (error) {
            alert(error.message || 'No se pudo registrar el seguimiento.');
        } finally {
            setSavingActivity(false);
        }
    };

    const completeActivity = async (activityId) => {
        try {
            await requestJson(`/api/crm/activities/${activityId}/complete`, {
                method: 'POST',
                body: JSON.stringify({}),
            });
            if (selectedLead?.id) {
                await Promise.all([loadActivities(selectedLead.id), loadData()]);
            }
        } catch (error) {
            alert(error.message || 'No se pudo completar la actividad.');
        }
    };

    const deleteActivity = async (activityId) => {
        if (!window.confirm('Deseas eliminar esta actividad?')) return;

        try {
            await requestJson(`/api/crm/activities/${activityId}`, { method: 'DELETE' });
            if (selectedLead?.id) {
                await Promise.all([loadActivities(selectedLead.id), loadData()]);
            }
        } catch (error) {
            alert(error.message || 'No se pudo eliminar la actividad.');
        }
    };

    const handleDropLead = async (stageId) => {
        if (!draggedLeadId || !selectedPipeline) return;

        try {
            await requestJson(`/api/crm/leads/${draggedLeadId}/move`, {
                method: 'POST',
                body: JSON.stringify({
                    pipeline_id: selectedPipeline.id,
                    stage_id: stageId,
                }),
            });

            await loadData();
        } catch (error) {
            alert(error.message || 'No se pudo mover el lead.');
        } finally {
            setDraggedLeadId(null);
        }
    };

    return (
        <AuthenticatedLayout>
            <Head title="CRM" />

            <div className="max-w-[1680px] mx-auto px-4 py-8 space-y-6">
                <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-black text-slate-900">CRM</h1>
                        <p className="text-slate-600 mt-2">Kanban de prospectos, seguimiento comercial y recordatorios por correo.</p>
                    </div>

                    <div className="flex flex-wrap gap-3">
                        <button onClick={loadData} className="px-4 py-3 rounded-xl bg-white border border-slate-300 text-slate-700 font-bold inline-flex items-center gap-2">
                            <RefreshCw className="w-4 h-4" />
                            Recargar
                        </button>
                        <button onClick={() => setShowPipelineModal(true)} className="px-4 py-3 rounded-xl bg-slate-900 text-white font-bold inline-flex items-center gap-2">
                            <Funnel className="w-4 h-4" />
                            Nuevo Embudo
                        </button>
                        <button onClick={openLeadModal} disabled={!selectedPipeline} className={`px-4 py-3 rounded-xl font-bold inline-flex items-center gap-2 ${selectedPipeline ? 'bg-emerald-600 text-white' : 'bg-slate-300 text-slate-500 cursor-not-allowed'}`}>
                            <Plus className="w-4 h-4" />
                            Nuevo Lead
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                    <div className="bg-white rounded-2xl border border-slate-200 p-5">
                        <div className="text-slate-500 text-xs font-black uppercase tracking-wider">Leads activos</div>
                        <div className="mt-3 text-3xl font-black text-slate-900">{summary.totalLeads}</div>
                    </div>
                    <div className="bg-white rounded-2xl border border-slate-200 p-5">
                        <div className="text-slate-500 text-xs font-black uppercase tracking-wider">Valor esperado</div>
                        <div className="mt-3 text-3xl font-black text-slate-900">{money(summary.totalValue)}</div>
                    </div>
                    <div className="bg-white rounded-2xl border border-slate-200 p-5">
                        <div className="text-slate-500 text-xs font-black uppercase tracking-wider">Leads con seguimiento</div>
                        <div className="mt-3 text-3xl font-black text-slate-900">{summary.withFollowUp}</div>
                    </div>
                    <div className="bg-white rounded-2xl border border-slate-200 p-5">
                        <div className="text-slate-500 text-xs font-black uppercase tracking-wider">Recordatorios pendientes</div>
                        <div className="mt-3 text-3xl font-black text-slate-900">{summary.pendingActivities}</div>
                    </div>
                </div>

                {upcomingActivities.length > 0 && (
                    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
                        <h2 className="font-black text-amber-900 mb-3">Seguimientos pendientes</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                            {upcomingActivities.slice(0, 6).map((activity) => (
                                <button key={activity.id} onClick={() => openLeadPanel(activity.lead)} className="text-left bg-white rounded-xl border border-amber-100 p-4 hover:border-amber-300 transition">
                                    <div className="font-black text-slate-900">{activity.subject}</div>
                                    <div className="text-sm text-slate-600 mt-1">{activity.lead?.title}</div>
                                    <div className="text-xs text-amber-700 font-bold mt-2">{activity.due_at ? new Date(activity.due_at).toLocaleString('es-PA') : 'Sin fecha'}</div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                <div className="bg-white rounded-2xl border border-slate-200 p-5">
                    <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-2">Embudo activo</label>
                    <select value={selectedPipelineId} onChange={(event) => setSelectedPipelineId(event.target.value)} className="w-full md:w-96 px-4 py-3 rounded-xl border border-slate-300">
                        <option value="">Selecciona un embudo</option>
                        {pipelines.map((pipeline) => (
                            <option key={pipeline.id} value={pipeline.id}>
                                {pipeline.name}{pipeline.is_default ? ' (predeterminado)' : ''}
                            </option>
                        ))}
                    </select>
                </div>

                {loading ? (
                    <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500">Cargando tablero CRM...</div>
                ) : !selectedPipeline ? (
                    <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500">No hay embudos disponibles. Crea el primero para empezar.</div>
                ) : (
                    <div className="grid grid-cols-1 xl:grid-cols-[1fr_420px] gap-6 items-start">
                        <div className="flex gap-4 overflow-x-auto pb-2">
                            {selectedPipeline.stages?.map((stage) => {
                                const leads = stageMap.get(String(stage.id)) || [];

                                return (
                                    <div key={stage.id} className="min-w-[320px] max-w-[320px] bg-slate-100 rounded-2xl border border-slate-200 flex flex-col" onDragOver={(event) => event.preventDefault()} onDrop={() => handleDropLead(stage.id)}>
                                        <div className="p-4 border-b border-slate-200 bg-white rounded-t-2xl">
                                            <div className="flex items-center justify-between gap-3">
                                                <div className="flex items-center gap-3">
                                                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: stage.color || '#0f172a' }}></span>
                                                    <h2 className="font-black text-slate-900">{stage.name}</h2>
                                                </div>
                                                <span className="px-2 py-1 rounded-full text-xs font-black bg-slate-200 text-slate-700">{leads.length}</span>
                                            </div>
                                        </div>

                                        <div className="p-3 space-y-3 min-h-[420px]">
                                            {leads.map((lead) => (
                                                <div key={lead.id} draggable onDragStart={() => setDraggedLeadId(lead.id)} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm cursor-move">
                                                    <button type="button" onClick={() => openLeadPanel(lead)} className="text-left w-full">
                                                        <div className="flex items-start justify-between gap-3">
                                                            <div>
                                                                <div className="font-black text-slate-900">{lead.title}</div>
                                                                <div className="text-sm text-slate-500 mt-1">{lead.company_name || lead.contact_name || 'Sin empresa asignada'}</div>
                                                            </div>
                                                            <span className="text-xs font-black text-slate-500">{lead.probability}%</span>
                                                        </div>

                                                        <div className="mt-4 space-y-2 text-sm text-slate-600">
                                                            <div className="flex items-center gap-2"><DollarSign className="w-4 h-4" /><span>{money(lead.expected_value)}</span></div>
                                                            <div className="flex items-center gap-2"><Users className="w-4 h-4" /><span>{lead.owner?.name || 'Sin responsable'}</span></div>
                                                            <div className="flex items-center gap-2"><CalendarClock className="w-4 h-4" /><span>{lead.next_follow_up_at ? new Date(lead.next_follow_up_at).toLocaleString('es-PA') : 'Sin seguimiento'}</span></div>
                                                        </div>
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="bg-white rounded-2xl border border-slate-200 p-5 xl:sticky xl:top-6">
                            {!selectedLead ? (
                                <div className="text-slate-500 text-sm">Selecciona un lead para ver su seguimiento, agregar actividades y gestionar recordatorios.</div>
                            ) : (
                                <div className="space-y-5">
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <h2 className="text-2xl font-black text-slate-900">{selectedLead.title}</h2>
                                            <p className="text-slate-600 mt-1">{selectedLead.company_name || selectedLead.contact_name || 'Sin empresa asignada'}</p>
                                            <div className="mt-3 text-sm text-slate-500 space-y-1">
                                                <div>Responsable: <span className="font-bold text-slate-800">{selectedLead.owner?.name || 'Sin responsable'}</span></div>
                                                <div>Etapa: <span className="font-bold text-slate-800">{selectedLead.stage?.name || 'N/D'}</span></div>
                                                <div>Valor esperado: <span className="font-bold text-slate-800">{money(selectedLead.expected_value)}</span></div>
                                            </div>
                                        </div>
                                        <span className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-100 text-slate-700 text-sm font-bold">
                                            <Pencil className="w-4 h-4" />
                                            Editando
                                        </span>
                                    </div>

                                    <div className="border-t border-slate-200 pt-4">
                                        <h3 className="font-black text-slate-900 mb-3">Datos del lead</h3>
                                        <form onSubmit={handleUpdateLead} className="space-y-3">
                                            <div>
                                                <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-2">Titulo</label>
                                                <input value={leadEditForm.title} onChange={(e) => setLeadEditForm((prev) => ({ ...prev, title: e.target.value }))} className="w-full px-4 py-3 rounded-xl border border-slate-300" required />
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-2">Responsable</label>
                                                    <select value={leadEditForm.owner_id} onChange={(e) => setLeadEditForm((prev) => ({ ...prev, owner_id: e.target.value }))} className="w-full px-4 py-3 rounded-xl border border-slate-300">
                                                        <option value="">Sin asignar</option>
                                                        {users.map((user) => <option key={user.id} value={user.id}>{user.name}</option>)}
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-2">Origen</label>
                                                    <input value={leadEditForm.source} onChange={(e) => setLeadEditForm((prev) => ({ ...prev, source: e.target.value }))} className="w-full px-4 py-3 rounded-xl border border-slate-300" />
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-2">Empresa</label>
                                                    <input value={leadEditForm.company_name} onChange={(e) => setLeadEditForm((prev) => ({ ...prev, company_name: e.target.value }))} className="w-full px-4 py-3 rounded-xl border border-slate-300" />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-2">Contacto</label>
                                                    <input value={leadEditForm.contact_name} onChange={(e) => setLeadEditForm((prev) => ({ ...prev, contact_name: e.target.value }))} className="w-full px-4 py-3 rounded-xl border border-slate-300" />
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-2">Email</label>
                                                    <input type="email" value={leadEditForm.email} onChange={(e) => setLeadEditForm((prev) => ({ ...prev, email: e.target.value }))} className="w-full px-4 py-3 rounded-xl border border-slate-300" />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-2">Telefono</label>
                                                    <input value={leadEditForm.phone} onChange={(e) => setLeadEditForm((prev) => ({ ...prev, phone: e.target.value }))} className="w-full px-4 py-3 rounded-xl border border-slate-300" />
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-2">Probabilidad (%)</label>
                                                    <input type="number" min="0" max="100" value={leadEditForm.probability} onChange={(e) => setLeadEditForm((prev) => ({ ...prev, probability: e.target.value }))} className="w-full px-4 py-3 rounded-xl border border-slate-300" />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-2">Valor esperado</label>
                                                    <input type="number" min="0" step="0.01" value={leadEditForm.expected_value} onChange={(e) => setLeadEditForm((prev) => ({ ...prev, expected_value: e.target.value }))} className="w-full px-4 py-3 rounded-xl border border-slate-300" />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-2">Proximo seguimiento</label>
                                                <input type="datetime-local" value={leadEditForm.next_follow_up_at} onChange={(e) => setLeadEditForm((prev) => ({ ...prev, next_follow_up_at: e.target.value }))} className="w-full px-4 py-3 rounded-xl border border-slate-300" />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-2">Notas</label>
                                                <textarea value={leadEditForm.notes} onChange={(e) => setLeadEditForm((prev) => ({ ...prev, notes: e.target.value }))} className="w-full px-4 py-3 rounded-xl border border-slate-300" rows="3" />
                                            </div>
                                            <label className="flex items-center gap-3 text-sm font-bold text-slate-700">
                                                <input type="checkbox" checked={leadEditForm.is_archived} onChange={(e) => setLeadEditForm((prev) => ({ ...prev, is_archived: e.target.checked }))} />
                                                Archivar lead
                                            </label>
                                            <button type="submit" disabled={savingLeadUpdate} className="w-full px-4 py-3 rounded-xl bg-slate-900 text-white font-bold inline-flex items-center justify-center gap-2">
                                                <Save className="w-4 h-4" />
                                                {savingLeadUpdate ? 'Guardando...' : 'Guardar cambios del lead'}
                                            </button>
                                        </form>
                                    </div>

                                    <div className="border-t border-slate-200 pt-4">
                                        <h3 className="font-black text-slate-900 mb-3">Nuevo seguimiento</h3>
                                        <form onSubmit={handleCreateActivity} className="space-y-3">
                                            <div>
                                                <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-2">Asunto</label>
                                                <input value={activityForm.subject} onChange={(e) => setActivityForm((prev) => ({ ...prev, subject: e.target.value }))} className="w-full px-4 py-3 rounded-xl border border-slate-300" required />
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-2">Tipo</label>
                                                    <select value={activityForm.activity_type} onChange={(e) => setActivityForm((prev) => ({ ...prev, activity_type: e.target.value }))} className="w-full px-4 py-3 rounded-xl border border-slate-300">
                                                        <option value="seguimiento">Seguimiento</option>
                                                        <option value="llamada">Llamada</option>
                                                        <option value="reunion">Reunion</option>
                                                        <option value="correo">Correo</option>
                                                        <option value="tarea">Tarea</option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-2">Prioridad</label>
                                                    <select value={activityForm.priority} onChange={(e) => setActivityForm((prev) => ({ ...prev, priority: e.target.value }))} className="w-full px-4 py-3 rounded-xl border border-slate-300">
                                                        <option value="low">Baja</option>
                                                        <option value="normal">Normal</option>
                                                        <option value="high">Alta</option>
                                                        <option value="urgent">Urgente</option>
                                                    </select>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-2">Vence</label>
                                                    <input type="datetime-local" value={activityForm.due_at} onChange={(e) => setActivityForm((prev) => ({ ...prev, due_at: e.target.value }))} className="w-full px-4 py-3 rounded-xl border border-slate-300" />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-2">Responsable</label>
                                                    <select value={activityForm.user_id} onChange={(e) => setActivityForm((prev) => ({ ...prev, user_id: e.target.value }))} className="w-full px-4 py-3 rounded-xl border border-slate-300">
                                                        <option value="">Sin asignar</option>
                                                        {users.map((user) => <option key={user.id} value={user.id}>{user.name}</option>)}
                                                    </select>
                                                </div>
                                            </div>
                                            <label className="flex items-center gap-3 text-sm font-bold text-slate-700">
                                                <input type="checkbox" checked={activityForm.send_email_reminder} onChange={(e) => setActivityForm((prev) => ({ ...prev, send_email_reminder: e.target.checked }))} />
                                                Enviar recordatorio por email
                                            </label>
                                            <div>
                                                <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-2">Notas</label>
                                                <textarea value={activityForm.notes} onChange={(e) => setActivityForm((prev) => ({ ...prev, notes: e.target.value }))} className="w-full px-4 py-3 rounded-xl border border-slate-300" rows="3" />
                                            </div>
                                            <button type="submit" disabled={savingActivity} className="w-full px-4 py-3 rounded-xl bg-emerald-600 text-white font-bold">{savingActivity ? 'Guardando...' : 'Registrar seguimiento'}</button>
                                        </form>
                                    </div>

                                    <div className="border-t border-slate-200 pt-4">
                                        <h3 className="font-black text-slate-900 mb-3">Historial de actividades</h3>
                                        {loadingActivities ? (
                                            <div className="text-sm text-slate-500">Cargando actividades...</div>
                                        ) : activities.length === 0 ? (
                                            <div className="text-sm text-slate-500">Aun no hay actividades para este lead.</div>
                                        ) : (
                                            <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                                                {activities.map((activity) => {
                                                    const done = Boolean(activity.completed_at);
                                                    return (
                                                        <div key={activity.id} className={`rounded-2xl border p-4 ${done ? 'bg-slate-50 border-slate-200' : 'bg-white border-slate-200'}`}>
                                                            <div className="flex items-start justify-between gap-3">
                                                                <div>
                                                                    <div className="font-black text-slate-900">{activity.subject}</div>
                                                                    <div className="text-xs text-slate-500 mt-1 uppercase font-bold">{activity.activity_type} · {activity.priority}</div>
                                                                </div>
                                                                <div className="flex gap-2">
                                                                    {!done && (
                                                                        <button type="button" onClick={() => completeActivity(activity.id)} className="text-emerald-600 hover:text-emerald-700">
                                                                            <CheckCircle2 className="w-5 h-5" />
                                                                        </button>
                                                                    )}
                                                                    <button type="button" onClick={() => deleteActivity(activity.id)} className="text-red-500 hover:text-red-600">
                                                                        <Trash2 className="w-5 h-5" />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                            <div className="mt-2 text-sm text-slate-600 space-y-1">
                                                                <div>Responsable: <span className="font-bold text-slate-800">{activity.user?.name || 'Sin asignar'}</span></div>
                                                                <div>Vence: <span className="font-bold text-slate-800">{activity.due_at ? new Date(activity.due_at).toLocaleString('es-PA') : 'Sin fecha'}</span></div>
                                                                <div>Email: <span className="font-bold text-slate-800">{activity.send_email_reminder ? (activity.email_reminded_at ? 'Recordado' : 'Pendiente') : 'No aplica'}</span></div>
                                                                {activity.notes && <div className="text-slate-700 whitespace-pre-line">{activity.notes}</div>}
                                                                {done && <div className="text-emerald-700 font-bold">Completada: {new Date(activity.completed_at).toLocaleString('es-PA')}</div>}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {showPipelineModal && (
                    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
                        <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-2xl font-black text-slate-900">Nuevo embudo</h2>
                                <button onClick={() => setShowPipelineModal(false)} className="text-slate-500 font-bold">Cerrar</button>
                            </div>

                            <form onSubmit={handleCreatePipeline} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Nombre</label>
                                    <input value={pipelineForm.name} onChange={(event) => setPipelineForm((prev) => ({ ...prev, name: event.target.value }))} className="w-full px-4 py-3 rounded-xl border border-slate-300" required />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Descripcion</label>
                                    <textarea value={pipelineForm.description} onChange={(event) => setPipelineForm((prev) => ({ ...prev, description: event.target.value }))} className="w-full px-4 py-3 rounded-xl border border-slate-300" rows="3" />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Etapas</label>
                                    <textarea value={pipelineForm.stages_text} onChange={(event) => setPipelineForm((prev) => ({ ...prev, stages_text: event.target.value }))} className="w-full px-4 py-3 rounded-xl border border-slate-300 font-mono text-sm" rows="6" />
                                    <p className="text-xs text-slate-500 mt-2">Formato: `Nombre` o `Nombre|#color|won/lost`.</p>
                                </div>
                                <label className="flex items-center gap-3">
                                    <input type="checkbox" checked={pipelineForm.is_default} onChange={(event) => setPipelineForm((prev) => ({ ...prev, is_default: event.target.checked }))} />
                                    <span className="text-sm font-bold text-slate-700">Marcar como embudo predeterminado</span>
                                </label>
                                <div className="flex justify-end gap-3 pt-4">
                                    <button type="button" onClick={() => setShowPipelineModal(false)} className="px-4 py-3 rounded-xl border border-slate-300 font-bold">Cancelar</button>
                                    <button type="submit" disabled={savingPipeline} className="px-4 py-3 rounded-xl bg-slate-900 text-white font-bold">{savingPipeline ? 'Guardando...' : 'Crear embudo'}</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {showLeadModal && (
                    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
                        <div className="w-full max-w-3xl bg-white rounded-3xl shadow-2xl p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-2xl font-black text-slate-900">Nuevo lead</h2>
                                <button onClick={() => setShowLeadModal(false)} className="text-slate-500 font-bold">Cerrar</button>
                            </div>

                            <form onSubmit={handleCreateLead} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Titulo</label>
                                    <input value={leadForm.title} onChange={(event) => setLeadForm((prev) => ({ ...prev, title: event.target.value }))} className="w-full px-4 py-3 rounded-xl border border-slate-300" required />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Embudo</label>
                                    <select value={leadForm.pipeline_id} onChange={(event) => {
                                        const pipeline = pipelines.find((item) => String(item.id) === event.target.value);
                                        setLeadForm((prev) => ({ ...prev, pipeline_id: event.target.value, stage_id: pipeline?.stages?.[0] ? String(pipeline.stages[0].id) : '' }));
                                    }} className="w-full px-4 py-3 rounded-xl border border-slate-300" required>
                                        <option value="">Selecciona...</option>
                                        {pipelines.map((pipeline) => <option key={pipeline.id} value={pipeline.id}>{pipeline.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Etapa</label>
                                    <select value={leadForm.stage_id} onChange={(event) => setLeadForm((prev) => ({ ...prev, stage_id: event.target.value }))} className="w-full px-4 py-3 rounded-xl border border-slate-300" required>
                                        <option value="">Selecciona...</option>
                                        {(pipelines.find((item) => String(item.id) === String(leadForm.pipeline_id))?.stages || []).map((stage) => <option key={stage.id} value={stage.id}>{stage.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Contacto existente</label>
                                    <select value={leadForm.contacto_id} onChange={(event) => {
                                        const contacto = contacts.find((item) => String(item.id) === event.target.value);
                                        setLeadForm((prev) => ({ ...prev, contacto_id: event.target.value, company_name: contacto?.razon_social || prev.company_name, contact_name: contacto?.razon_social || prev.contact_name, email: contacto?.email || prev.email, phone: contacto?.telefono || prev.phone }));
                                    }} className="w-full px-4 py-3 rounded-xl border border-slate-300">
                                        <option value="">Sin vincular</option>
                                        {contacts.filter((contacto) => contacto.es_cliente || contacto.es_proveedor).map((contacto) => <option key={contacto.id} value={contacto.id}>{contacto.razon_social}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Responsable</label>
                                    <select value={leadForm.owner_id} onChange={(event) => setLeadForm((prev) => ({ ...prev, owner_id: event.target.value }))} className="w-full px-4 py-3 rounded-xl border border-slate-300">
                                        <option value="">Sin asignar</option>
                                        {users.map((user) => <option key={user.id} value={user.id}>{user.name}</option>)}
                                    </select>
                                </div>
                                <div><label className="block text-sm font-bold text-slate-700 mb-2">Empresa</label><input value={leadForm.company_name} onChange={(event) => setLeadForm((prev) => ({ ...prev, company_name: event.target.value }))} className="w-full px-4 py-3 rounded-xl border border-slate-300" /></div>
                                <div><label className="block text-sm font-bold text-slate-700 mb-2">Contacto</label><input value={leadForm.contact_name} onChange={(event) => setLeadForm((prev) => ({ ...prev, contact_name: event.target.value }))} className="w-full px-4 py-3 rounded-xl border border-slate-300" /></div>
                                <div><label className="block text-sm font-bold text-slate-700 mb-2">Email</label><input type="email" value={leadForm.email} onChange={(event) => setLeadForm((prev) => ({ ...prev, email: event.target.value }))} className="w-full px-4 py-3 rounded-xl border border-slate-300" /></div>
                                <div><label className="block text-sm font-bold text-slate-700 mb-2">Telefono</label><input value={leadForm.phone} onChange={(event) => setLeadForm((prev) => ({ ...prev, phone: event.target.value }))} className="w-full px-4 py-3 rounded-xl border border-slate-300" /></div>
                                <div><label className="block text-sm font-bold text-slate-700 mb-2">Origen</label><input value={leadForm.source} onChange={(event) => setLeadForm((prev) => ({ ...prev, source: event.target.value }))} className="w-full px-4 py-3 rounded-xl border border-slate-300" placeholder="WhatsApp, referido, web..." /></div>
                                <div><label className="block text-sm font-bold text-slate-700 mb-2">Probabilidad (%)</label><input type="number" min="0" max="100" value={leadForm.probability} onChange={(event) => setLeadForm((prev) => ({ ...prev, probability: event.target.value }))} className="w-full px-4 py-3 rounded-xl border border-slate-300" /></div>
                                <div><label className="block text-sm font-bold text-slate-700 mb-2">Valor esperado</label><input type="number" min="0" step="0.01" value={leadForm.expected_value} onChange={(event) => setLeadForm((prev) => ({ ...prev, expected_value: event.target.value }))} className="w-full px-4 py-3 rounded-xl border border-slate-300" /></div>
                                <div><label className="block text-sm font-bold text-slate-700 mb-2">Proximo seguimiento</label><input type="datetime-local" value={leadForm.next_follow_up_at} onChange={(event) => setLeadForm((prev) => ({ ...prev, next_follow_up_at: event.target.value }))} className="w-full px-4 py-3 rounded-xl border border-slate-300" /></div>
                                <div className="md:col-span-2"><label className="block text-sm font-bold text-slate-700 mb-2">Notas</label><textarea value={leadForm.notes} onChange={(event) => setLeadForm((prev) => ({ ...prev, notes: event.target.value }))} className="w-full px-4 py-3 rounded-xl border border-slate-300" rows="4" /></div>
                                <div className="md:col-span-2 flex justify-end gap-3 pt-4">
                                    <button type="button" onClick={() => setShowLeadModal(false)} className="px-4 py-3 rounded-xl border border-slate-300 font-bold">Cancelar</button>
                                    <button type="submit" disabled={savingLead} className="px-4 py-3 rounded-xl bg-emerald-600 text-white font-bold">{savingLead ? 'Guardando...' : 'Crear lead'}</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
}
