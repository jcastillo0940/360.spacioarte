import React, { useState, useEffect } from 'react';
import { Head, useForm, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

export default function Index() {
    const { auth } = usePage().props;
    const [settings, setSettings] = useState(null);
    const [accounts, setAccounts] = useState([]);
    const [feStatus, setFeStatus] = useState(null);
    const [feResources, setFeResources] = useState({ environment: null, companies: [], offices: [], locations: [] });
    const [feLoading, setFeLoading] = useState(false);
    const [smtpTestLoading, setSmtpTestLoading] = useState(false);
    const [smtpTestEmail, setSmtpTestEmail] = useState('');
    const [feActionLoading, setFeActionLoading] = useState('');
    const [certificateFiles, setCertificateFiles] = useState({
        signature_certificate: null,
        signature_password: '',
        authentication_certificate: null,
        authentication_password: '',
    });
    const [officeForm, setOfficeForm] = useState({
        code: '0001',
        type: 'associated',
        coordinates: '',
        address: '',
        telephone: '',
        location: '',
        email: '',
        setAsDefault: true,
    });
    const canManageAlanube = auth?.user?.roles?.includes('Developer') || auth?.user?.roles?.includes('Superadmin');
    const { data, setData, post, processing } = useForm({
        razon_social: '',
        ruc: '',
        dv: '',
        direccion: '',
        telefono: '',
        email: '',
        smtp_host: '',
        smtp_port: 587,
        smtp_user: '',
        smtp_pass: '',
        smtp_encryption: 'tls',
        itbms_porcentaje: 7,
        factura_serie: 'FAC',
        factura_inicio: 1,
        max_intentos_diseno: 3,
        fe_enabled: false,
        fe_auto_emit: false,
        fe_provider: 'alanube_pan',
        fe_environment: 'sandbox',
        fe_api_base_url: 'https://sandbox-api.alanube.co/pan/v1',
        fe_jwt_token: '',
        fe_company_id: '',
        fe_office_id: '',
        fe_security_code: '',
        fe_company_type: 'associated',
        fe_type_ruc: 2,
        fe_trade_name: '',
        fe_logo_url: '',
        fe_portal_email: '',
        fe_portal_password: '',
        fe_company_qr: '',
        fe_invoice_range_start: '',
        fe_invoice_range_end: '',
        fe_test_ruc: '',
        cta_inventario_id: '',
        cta_recepcion_transitoria_id: '',
        cta_itbms_id: '',
        cta_itbms_compras_id: '',
        cta_cxp_id: '',
        logo: null
    });

    const getCsrfToken = () => document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
    const alanubeChecklist = [
        { label: 'Ambiente guardado', ready: ['sandbox', 'production'].includes(data.fe_environment) },
        { label: 'Base URL API', ready: !!data.fe_api_base_url },
        { label: 'JWT Alanube', ready: !!data.fe_jwt_token },
        { label: 'Certificado de firma', ready: !!feResources.environment?.has_signature_certificate },
        { label: 'Certificado de autenticación', ready: !!feResources.environment?.has_authentication_certificate },
        { label: 'Compañía Alanube', ready: !!data.fe_company_id },
        { label: 'Oficina Alanube', ready: !!data.fe_office_id },
        { label: 'Security Code', ready: !!data.fe_security_code },
        { label: 'Rango FE', ready: !!data.fe_invoice_range_start && !!data.fe_invoice_range_end },
        { label: 'Afiliación DGI/PAC', ready: feStatus?.affiliated === 'SUBSCRIBED' },
    ];
    const alanubeReadyCount = alanubeChecklist.filter(item => item.ready).length;

    const loadFeResources = async (companyId = '') => {
        if (!canManageAlanube || !data.fe_jwt_token || !data.fe_api_base_url) {
            setFeResources({ environment: null, companies: [], offices: [], locations: [] });
            return;
        }

        try {
            const params = new URLSearchParams();
            if (companyId || data.fe_company_id) {
                params.set('companyId', companyId || data.fe_company_id);
            }

            const response = await fetch(`${route('api.settings.fe.resources')}${params.toString() ? `?${params.toString()}` : ''}`);
            const payload = await response.json();

            if (!response.ok) {
                throw new Error(payload.message || 'No se pudieron cargar los recursos de Alanube.');
            }

            setFeResources(payload);
        } catch (error) {
            alert(error.message || 'No se pudieron cargar los recursos de Alanube.');
        }
    };

    const loadFeStatus = async () => {
        if (!canManageAlanube || !data.fe_enabled || !data.fe_jwt_token) {
            setFeStatus(null);
            return;
        }

        setFeLoading(true);

        try {
            const response = await fetch(route('api.settings.fe.status'));
            const payload = await response.json();

            if (!response.ok) {
                throw new Error(payload.message || 'No se pudo consultar el estado FE.');
            }

            setFeStatus(payload);
            setData(prev => ({
                ...prev,
                fe_company_id: payload.company?.id || prev.fe_company_id,
                fe_office_id: payload.office?.id || prev.fe_office_id,
                fe_company_qr: payload.company?.qr || prev.fe_company_qr,
            }));
        } catch (error) {
            alert(error.message || 'No se pudo consultar el estado FE.');
        } finally {
            setFeLoading(false);
        }
    };

    const handleFeAffiliate = async () => {
        setFeActionLoading('affiliate');

        try {
            const response = await fetch(route('api.settings.fe.affiliate'));
            const payload = await response.json();

            if (!response.ok) {
                throw new Error(payload.message || 'No se pudo solicitar la afiliacion.');
            }

            setFeStatus(payload.status || null);
            alert(payload.next_step || 'Solicitud de afiliacion enviada correctamente.');
        } catch (error) {
            alert(error.message || 'No se pudo solicitar la afiliacion.');
        } finally {
            setFeActionLoading('');
        }
    };

    const handleFeRequestQr = async () => {
        setFeActionLoading('request_qr');

        try {
            const response = await fetch(route('api.settings.fe.request-qr'));
            const payload = await response.json();

            if (!response.ok) {
                throw new Error(payload.message || 'No se pudo solicitar el QR.');
            }

            setFeStatus(payload.status || null);
            if (payload.request?.body?.qr) {
                setData(prev => ({
                    ...prev,
                    fe_company_qr: payload.request.body.qr,
                }));
            }
            alert(payload.next_step || 'QR solicitado correctamente.');
        } catch (error) {
            alert(error.message || 'No se pudo solicitar el QR.');
        } finally {
            setFeActionLoading('');
        }
    };

    const handleSaveCertificates = async () => {
        setFeActionLoading('certificates');

        try {
            const formData = new FormData();

            if (certificateFiles.signature_certificate) {
                formData.append('signature_certificate', certificateFiles.signature_certificate);
            }

            if (certificateFiles.signature_password) {
                formData.append('signature_password', certificateFiles.signature_password);
            }

            if (certificateFiles.authentication_certificate) {
                formData.append('authentication_certificate', certificateFiles.authentication_certificate);
            }

            if (certificateFiles.authentication_password) {
                formData.append('authentication_password', certificateFiles.authentication_password);
            }

            const response = await fetch(route('settings.fe.certificates'), {
                method: 'POST',
                headers: {
                    'X-CSRF-TOKEN': getCsrfToken(),
                    'Accept': 'application/json',
                },
                credentials: 'same-origin',
                body: formData,
            });

            const payload = await response.json();

            if (!response.ok) {
                throw new Error(payload.message || 'No se pudieron guardar los certificados.');
            }

            setFeResources(prev => ({ ...prev, environment: payload.environment }));
            alert('Certificados guardados para el ambiente actual.');
        } catch (error) {
            alert(error.message || 'No se pudieron guardar los certificados.');
        } finally {
            setFeActionLoading('');
        }
    };

    const handleCreateCompany = async () => {
        setFeActionLoading('create_company');

        try {
            const response = await fetch(route('settings.fe.company'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': getCsrfToken(),
                },
                credentials: 'same-origin',
                body: JSON.stringify({
                    name: data.razon_social,
                    tradeName: data.fe_trade_name || data.razon_social,
                    ruc: data.ruc,
                    checkDigit: data.dv,
                    type: data.fe_company_type,
                    typeRuc: Number(data.fe_type_ruc || 2),
                    replyTo: data.fe_portal_email || data.email,
                    emailMessage: '',
                    qr: data.fe_company_qr || undefined,
                    logo: data.fe_logo_url || undefined,
                }),
            });

            const payload = await response.json();

            if (!response.ok) {
                throw new Error(payload.message || 'No se pudo crear la compañía en Alanube.');
            }

            setFeStatus(payload.status || null);
            setData(prev => ({
                ...prev,
                fe_company_id: payload.company?.id || prev.fe_company_id,
            }));
            await loadFeResources(payload.company?.id || '');
            alert('Compañía creada correctamente en Alanube.');
        } catch (error) {
            alert(error.message || 'No se pudo crear la compañía en Alanube.');
        } finally {
            setFeActionLoading('');
        }
    };

    const handleCreateOffice = async () => {
        setFeActionLoading('create_office');

        try {
            const response = await fetch(route('settings.fe.office'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': getCsrfToken(),
                },
                credentials: 'same-origin',
                body: JSON.stringify({
                    companyId: data.fe_company_id,
                    ...officeForm,
                }),
            });

            const payload = await response.json();

            if (!response.ok) {
                throw new Error(payload.message || 'No se pudo guardar la oficina en Alanube.');
            }

            setFeStatus(payload.status || null);
            setData(prev => ({
                ...prev,
                fe_office_id: payload.office?.id || prev.fe_office_id,
            }));
            await loadFeResources(data.fe_company_id);
            alert('Oficina guardada correctamente.');
        } catch (error) {
            alert(error.message || 'No se pudo guardar la oficina en Alanube.');
        } finally {
            setFeActionLoading('');
        }
    };

    const handleSelectCompany = async (companyId) => {
        setFeActionLoading(`select_company_${companyId}`);

        try {
            const response = await fetch(route('settings.fe.company.select'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': getCsrfToken(),
                },
                credentials: 'same-origin',
                body: JSON.stringify({ companyId }),
            });

            const payload = await response.json();

            if (!response.ok) {
                throw new Error(payload.message || 'No se pudo seleccionar la compañía.');
            }

            setFeStatus(payload);
            setData(prev => ({
                ...prev,
                fe_company_id: companyId,
                fe_office_id: '',
            }));
            await loadFeResources(companyId);
        } catch (error) {
            alert(error.message || 'No se pudo seleccionar la compañía.');
        } finally {
            setFeActionLoading('');
        }
    };

    const handleSelectOffice = async (officeId) => {
        setFeActionLoading(`select_office_${officeId}`);

        try {
            const response = await fetch(route('settings.fe.office.select'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': getCsrfToken(),
                },
                credentials: 'same-origin',
                body: JSON.stringify({ officeId }),
            });

            const payload = await response.json();

            if (!response.ok) {
                throw new Error(payload.message || 'No se pudo seleccionar la oficina.');
            }

            setFeStatus(payload);
            setData(prev => ({
                ...prev,
                fe_office_id: officeId,
            }));
            await loadFeResources(data.fe_company_id);
        } catch (error) {
            alert(error.message || 'No se pudo seleccionar la oficina.');
        } finally {
            setFeActionLoading('');
        }
    };

    const handleFeQrUpdate = async () => {
        setFeActionLoading('qr');

        try {
            const response = await fetch(route('settings.fe.qr'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': getCsrfToken(),
                },
                credentials: 'same-origin',
                body: JSON.stringify({ qr: data.fe_company_qr }),
            });

            const payload = await response.json();

            if (!response.ok) {
                throw new Error(payload.message || 'No se pudo actualizar el QR.');
            }

            setFeStatus(payload.status || null);
            alert('QR actualizado correctamente en Alanube.');
        } catch (error) {
            alert(error.message || 'No se pudo actualizar el QR.');
        } finally {
            setFeActionLoading('');
        }
    };

    const useCurrentAlanubeQr = () => {
        const qr = feStatus?.company?.qr || '';
        if (qr) {
            setData('fe_company_qr', qr);
        }
    };

    const useSupportSecurityCode = () => {
        setData('fe_security_code', '301525944');
    };

    const handleFeSecurityCodeUpdate = async () => {
        setFeActionLoading('security_code');

        try {
            const response = await fetch(route('settings.fe.qr'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': getCsrfToken(),
                },
                credentials: 'same-origin',
                body: JSON.stringify({ securityCode: data.fe_security_code }),
            });

            const payload = await response.json();

            if (!response.ok) {
                throw new Error(payload.message || 'No se pudo actualizar el securityCode.');
            }

            setFeStatus(payload.status || null);
            alert('SecurityCode actualizado correctamente en Alanube.');
        } catch (error) {
            alert(error.message || 'No se pudo actualizar el securityCode.');
        } finally {
            setFeActionLoading('');
        }
    };

    useEffect(() => {
        // Cargar Configuración
        fetch(route('api.settings.index'))
            .then(res => res.json())
            .then(data => {
                setSettings(data);
                setData(prev => ({ ...prev, ...data }));
                setOfficeForm(prev => ({
                    ...prev,
                    address: data.direccion || prev.address,
                    telephone: data.telefono || prev.telephone,
                }));
                setSmtpTestEmail(data.email || '');
            });

        // Cargar Cuentas Contables
        fetch('/api/contabilidad/cuentas?flat=1')
            .then(res => res.json())
            .then(data => {
                setAccounts(data || []);
            });
    }, []);

    useEffect(() => {
        if (settings && canManageAlanube && data.fe_jwt_token) {
            loadFeStatus();
            loadFeResources();
        }
    }, [settings, canManageAlanube]);

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('settings.update'), {
            onSuccess: () => alert('Configuración actualizada')
        });
    };

    return (
        <AuthenticatedLayout>
            <Head title="Configuración del Sistema" />

            <div className="max-w-4xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-black text-slate-900">Configuración General</h1>
                    <p className="text-slate-600 mt-2">Datos fiscales y parámetros del sistema</p>
                </div>

                <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="p-8 space-y-6">
                        {/* Información Fiscal */}
                        <div className="border-b border-slate-200 pb-6">
                            <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                                <svg className="w-5 h-5 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                                Información Fiscal
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Razón Social</label>
                                    <input
                                        type="text"
                                        value={data.razon_social}
                                        onChange={e => setData('razon_social', e.target.value)}
                                        className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                                        placeholder="Empresa S.A."
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase text-slate-500 mb-2">RUC</label>
                                    <input
                                        type="text"
                                        value={data.ruc}
                                        onChange={e => setData('ruc', e.target.value)}
                                        className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase text-slate-500 mb-2">DV</label>
                                    <input
                                        type="text"
                                        maxLength="2"
                                        value={data.dv}
                                        onChange={e => setData('dv', e.target.value)}
                                        className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition text-center"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Contacto */}
                        <div className="border-b border-slate-200 pb-6">
                            <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                                <svg className="w-5 h-5 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                                Datos de Contacto
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Teléfono</label>
                                    <input
                                        type="text"
                                        value={data.telefono}
                                        onChange={e => setData('telefono', e.target.value)}
                                        className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Email</label>
                                    <input
                                        type="email"
                                        value={data.email}
                                        onChange={e => setData('email', e.target.value)}
                                        className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Dirección</label>
                                    <textarea
                                        value={data.direccion}
                                        onChange={e => setData('direccion', e.target.value)}
                                        rows="2"
                                        className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Facturación */}
                        <div className="border-b border-slate-200 pb-6">
                            <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                                <svg className="w-5 h-5 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                Parámetros de Facturación
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Serie</label>
                                    <input
                                        type="text"
                                        value={data.factura_serie}
                                        onChange={e => setData('factura_serie', e.target.value)}
                                        className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Correlativo Inicial</label>
                                    <input
                                        type="number"
                                        value={data.factura_inicio}
                                        onChange={e => setData('factura_inicio', e.target.value)}
                                        className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase text-slate-500 mb-2">ITBMS (%)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={data.itbms_porcentaje}
                                        onChange={e => setData('itbms_porcentaje', e.target.value)}
                                        className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="border-b border-slate-200 pb-6">
                            <h2 className="text-lg font-bold text-slate-800 mb-4">Parámetros Operativos</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Máximo intentos de diseño</label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="10"
                                        value={data.max_intentos_diseno}
                                        onChange={e => setData('max_intentos_diseno', e.target.value)}
                                        className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Configuración Contable */}
                        <div className={`${canManageAlanube ? '' : 'hidden '}border-b border-slate-200 pb-6`}>
                            <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                                <svg className="w-5 h-5 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0 1.657-1.79 3-4 3S4 12.657 4 11s1.79-3 4-3 4 1.343 4 3zm0 0V9a2 2 0 114 0v2m-4 0c0 1.657 1.79 3 4 3s4-1.343 4-3-1.79-3-4-3-4 1.343-4 3zM4 19h16" />
                                </svg>
                                Integración Alanube Panamá
                            </h2>
                            <p className="text-xs text-slate-500 mb-4 bg-amber-50 p-3 rounded-lg border border-amber-100">
                                Configura el ambiente, el JWT de Alanube y si quieres que el ERP intente emitir automáticamente las facturas electrónicas al crearlas.
                            </p>
                            <p className="text-xs text-slate-500 mb-4 bg-slate-50 p-3 rounded-lg border border-slate-200">
                                Guarda primero los cambios de <span className="font-bold">Ambiente</span>, <span className="font-bold">Base URL</span> y <span className="font-bold">JWT</span>. Las acciones remotas usan el ambiente actualmente guardado.
                            </p>
                            <div className="mb-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
                                <div className="flex items-center justify-between gap-4 mb-4">
                                    <div>
                                        <h3 className="text-sm font-black uppercase tracking-widest text-slate-700">Checklist del ambiente activo</h3>
                                        <p className="text-xs text-slate-500 mt-1">Esto no ejecuta nada. Solo indica si el ambiente actual quedó listo para emitir.</p>
                                    </div>
                                    <div className="text-sm font-black text-slate-900">{alanubeReadyCount}/{alanubeChecklist.length}</div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {alanubeChecklist.map(item => (
                                        <div key={item.label} className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm ${item.ready ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-white text-slate-700 border border-slate-200'}`}>
                                            <span>{item.label}</span>
                                            <span className="font-bold">{item.ready ? 'OK' : 'Pendiente'}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <label className="flex items-center gap-3 rounded-lg border border-slate-200 px-4 py-3 bg-slate-50">
                                    <input type="checkbox" checked={!!data.fe_enabled} onChange={e => setData('fe_enabled', e.target.checked)} />
                                    <span className="text-sm font-bold text-slate-700">Activar facturación electrónica</span>
                                </label>
                                <label className="flex items-center gap-3 rounded-lg border border-slate-200 px-4 py-3 bg-slate-50">
                                    <input type="checkbox" checked={!!data.fe_auto_emit} onChange={e => setData('fe_auto_emit', e.target.checked)} />
                                    <span className="text-sm font-bold text-slate-700">Emitir automáticamente al facturar</span>
                                </label>
                                <div>
                                    <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Proveedor</label>
                                    <input type="text" value={data.fe_provider} onChange={e => setData('fe_provider', e.target.value)} className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Ambiente</label>
                                    <select value={data.fe_environment} onChange={e => setData('fe_environment', e.target.value)} className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition">
                                        <option value="sandbox">Sandbox</option>
                                        <option value="production">Producción</option>
                                    </select>
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Base URL API</label>
                                    <input type="text" value={data.fe_api_base_url} onChange={e => setData('fe_api_base_url', e.target.value)} className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition" />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-bold uppercase text-slate-500 mb-2">JWT Alanube</label>
                                    <textarea value={data.fe_jwt_token} onChange={e => setData('fe_jwt_token', e.target.value)} rows="4" className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition" placeholder="Pega aquí el token JWT de Alanube" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase text-slate-500 mb-2">ID Compañía Alanube</label>
                                    <input type="text" value={data.fe_company_id} onChange={e => setData('fe_company_id', e.target.value)} className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase text-slate-500 mb-2">ID Sucursal / Oficina Alanube</label>
                                    <input type="text" value={data.fe_office_id} onChange={e => setData('fe_office_id', e.target.value)} className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Security Code FE</label>
                                    <input type="text" value={data.fe_security_code} onChange={e => setData('fe_security_code', e.target.value)} className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition" placeholder="Ej. 301525944" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Correo portal</label>
                                    <input type="email" value={data.fe_portal_email} onChange={e => setData('fe_portal_email', e.target.value)} className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Contraseña portal</label>
                                    <input type="text" value={data.fe_portal_password} onChange={e => setData('fe_portal_password', e.target.value)} className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Rango inicio</label>
                                    <input type="number" value={data.fe_invoice_range_start} onChange={e => setData('fe_invoice_range_start', e.target.value)} className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Rango fin</label>
                                    <input type="number" value={data.fe_invoice_range_end} onChange={e => setData('fe_invoice_range_end', e.target.value)} className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase text-slate-500 mb-2">RUC de prueba</label>
                                    <input type="text" value={data.fe_test_ruc} onChange={e => setData('fe_test_ruc', e.target.value)} className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Tipo de compañía</label>
                                    <select value={data.fe_company_type} onChange={e => setData('fe_company_type', e.target.value)} className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition">
                                        <option value="associated">Asociada</option>
                                        <option value="main">Principal</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Tipo de RUC</label>
                                    <select value={data.fe_type_ruc} onChange={e => setData('fe_type_ruc', e.target.value)} className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition">
                                        <option value="2">Jurídico</option>
                                        <option value="1">Natural</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Trade Name Alanube</label>
                                    <input type="text" value={data.fe_trade_name} onChange={e => setData('fe_trade_name', e.target.value)} className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Logo URL PDF</label>
                                    <input type="text" value={data.fe_logo_url} onChange={e => setData('fe_logo_url', e.target.value)} className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition" placeholder="https://..." />
                                </div>
                            </div>
                            <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
                                <div className="flex flex-wrap items-center gap-3">
                                    <span className="text-xs font-black uppercase tracking-widest text-slate-500">Estado de afiliacion PAC</span>
                                    <span className={`px-3 py-1 rounded-full text-[11px] font-black uppercase ${
                                        feStatus?.affiliated === 'SUBSCRIBED'
                                            ? 'bg-emerald-100 text-emerald-800'
                                            : feStatus?.affiliated === 'REQUESTED'
                                                ? 'bg-amber-100 text-amber-800'
                                                : 'bg-slate-200 text-slate-700'
                                    }`}>
                                        {feLoading ? 'Consultando...' : (feStatus?.affiliated || 'Sin consultar')}
                                    </span>
                                </div>
                                <div className="mt-3 grid gap-2 text-sm text-slate-600 md:grid-cols-2">
                                    <div>Compania Alanube: <span className="font-bold text-slate-900">{feStatus?.company?.id || data.fe_company_id || 'Pendiente'}</span></div>
                                    <div>Oficina Alanube: <span className="font-bold text-slate-900">{feStatus?.office?.id || data.fe_office_id || 'Pendiente'}</span></div>
                                    <div>RUC emisor Alanube: <span className="font-bold text-slate-900">{feStatus?.company?.ruc || data.ruc || 'Pendiente'}</span></div>
                                    <div>Puede emitir: <span className="font-bold text-slate-900">{feStatus?.can_emit ? 'Si' : 'No aun'}</span></div>
                                </div>
                                <div className="mt-4 flex flex-wrap gap-3">
                                    <button
                                        type="button"
                                        onClick={loadFeStatus}
                                        className="px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-bold hover:bg-slate-800 transition"
                                    >
                                        {feLoading ? 'Consultando...' : 'Consultar estado'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleFeAffiliate}
                                        disabled={feActionLoading === 'affiliate'}
                                        className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 transition disabled:opacity-50"
                                    >
                                        {feActionLoading === 'affiliate' ? 'Solicitando...' : 'Solicitar afiliacion PAC'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleFeRequestQr}
                                        disabled={feActionLoading === 'request_qr'}
                                        className="px-4 py-2 rounded-lg bg-violet-600 text-white text-sm font-bold hover:bg-violet-700 transition disabled:opacity-50"
                                    >
                                        {feActionLoading === 'request_qr' ? 'Solicitando...' : 'Solicitar QR'}
                                    </button>
                                </div>
                                <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                                    {data.fe_environment === 'sandbox'
                                        ? <>En sandbox puedes solicitar QR y re-guardarlo desde el ERP. Si Alanube invalida el QR tras un rechazo <span className="font-bold">4003</span>, vuelve a solicitarlo antes de una nueva emision.</>
                                        : <>Paso manual obligatorio: luego de solicitar la afiliacion, debes entrar a Etax/DGI y aceptar la solicitud PAC. Despues vuelves aqui y pulsas <span className="font-bold">Consultar estado</span> hasta que cambie a <span className="font-bold">SUBSCRIBED</span>.</>}
                                </div>
                                <div className="mt-4">
                                    <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Codigo QR / seguridad</label>
                                    <div className="flex flex-col gap-3 md:flex-row">
                                        <input
                                            type="text"
                                            value={data.fe_company_qr}
                                            onChange={e => setData('fe_company_qr', e.target.value)}
                                            className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                                            placeholder={data.fe_environment === 'sandbox' ? 'QR mock actual devuelto por Alanube sandbox' : 'Pega aqui el QR del emisor'}
                                        />
                                        <button
                                            type="button"
                                            onClick={handleFeQrUpdate}
                                            disabled={feActionLoading === 'qr' || !data.fe_company_qr}
                                            className="px-4 py-3 rounded-lg bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 transition disabled:opacity-50"
                                        >
                                            {feActionLoading === 'qr' ? 'Guardando...' : (data.fe_environment === 'sandbox' ? 'Re-guardar QR en Alanube' : 'Guardar QR en Alanube')}
                                        </button>
                                    <button
                                        type="button"
                                        onClick={useCurrentAlanubeQr}
                                        disabled={!feStatus?.company?.qr}
                                        className="px-4 py-3 rounded-lg bg-slate-200 text-slate-800 text-sm font-bold hover:bg-slate-300 transition disabled:opacity-50"
                                    >
                                        Usar QR actual
                                    </button>
                                </div>
                                <div className="mt-3 flex flex-col gap-3 md:flex-row">
                                    <input
                                        type="text"
                                        value={data.fe_security_code}
                                        onChange={e => setData('fe_security_code', e.target.value)}
                                        className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                                        placeholder="SecurityCode para FE. Soporte indicó 301525944"
                                    />
                                    <button
                                        type="button"
                                        onClick={handleFeSecurityCodeUpdate}
                                        disabled={feActionLoading === 'security_code' || !data.fe_security_code}
                                        className="px-4 py-3 rounded-lg bg-cyan-600 text-white text-sm font-bold hover:bg-cyan-700 transition disabled:opacity-50"
                                    >
                                        {feActionLoading === 'security_code' ? 'Guardando...' : 'Guardar SecurityCode'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={useSupportSecurityCode}
                                        className="px-4 py-3 rounded-lg bg-slate-200 text-slate-800 text-sm font-bold hover:bg-slate-300 transition"
                                    >
                                        Usar 301525944
                                    </button>
                                </div>
                                <p className="mt-2 text-xs text-slate-500">
                                        {feStatus?.sandbox_qr_note || 'En produccion puedes registrar aqui el QR si fue generado fuera de Alanube.'}
                                </p>
                            </div>
                            <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
                                <div className="rounded-xl border border-slate-200 bg-white p-4">
                                    <h3 className="text-sm font-black uppercase tracking-widest text-slate-700 mb-4">Certificados .p12</h3>
                                    <div className="grid gap-4">
                                        <div>
                                            <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Firma .p12</label>
                                            <input type="file" accept=".p12,application/x-pkcs12" onChange={e => setCertificateFiles(prev => ({ ...prev, signature_certificate: e.target.files?.[0] || null }))} className="w-full text-sm" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Contraseña firma</label>
                                            <input type="text" value={certificateFiles.signature_password} onChange={e => setCertificateFiles(prev => ({ ...prev, signature_password: e.target.value }))} className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Autenticación .p12</label>
                                            <input type="file" accept=".p12,application/x-pkcs12" onChange={e => setCertificateFiles(prev => ({ ...prev, authentication_certificate: e.target.files?.[0] || null }))} className="w-full text-sm" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Contraseña autenticación</label>
                                            <input type="text" value={certificateFiles.authentication_password} onChange={e => setCertificateFiles(prev => ({ ...prev, authentication_password: e.target.value }))} className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition" />
                                        </div>
                                        <div className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3 text-xs">
                                            <span>Firma: <span className="font-bold">{feResources.environment?.has_signature_certificate ? 'cargada' : 'pendiente'}</span></span>
                                            <span>Autenticación: <span className="font-bold">{feResources.environment?.has_authentication_certificate ? 'cargada' : 'pendiente'}</span></span>
                                        </div>
                                        <button type="button" onClick={handleSaveCertificates} disabled={feActionLoading === 'certificates'} className="px-4 py-3 rounded-lg bg-slate-900 text-white text-sm font-bold hover:bg-slate-800 transition disabled:opacity-50">
                                            {feActionLoading === 'certificates' ? 'Guardando...' : 'Guardar certificados'}
                                        </button>
                                    </div>
                                </div>
                                <div className="rounded-xl border border-slate-200 bg-white p-4">
                                    <h3 className="text-sm font-black uppercase tracking-widest text-slate-700 mb-4">Alta de compañía Alanube</h3>
                                    <div className="grid gap-4">
                                        <div className="text-xs text-slate-500 bg-slate-50 rounded-lg px-4 py-3">
                                            Esta acción usa el ambiente activo y guarda el resultado sin tocar el otro ambiente.
                                        </div>
                                        <button type="button" onClick={handleCreateCompany} disabled={feActionLoading === 'create_company'} className="px-4 py-3 rounded-lg bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 transition disabled:opacity-50">
                                            {feActionLoading === 'create_company' ? 'Creando...' : 'Crear compañía desde esta configuración'}
                                        </button>
                                        <div className="text-xs text-slate-600">
                                            Company ID activo: <span className="font-bold text-slate-900">{data.fe_company_id || 'Sin crear/seleccionar'}</span>
                                        </div>
                                        <div className="max-h-48 overflow-auto rounded-lg border border-slate-200">
                                            {feResources.companies?.length ? feResources.companies.map(company => (
                                                <div key={company.id} className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3 text-sm last:border-b-0">
                                                    <div>
                                                        <div className="font-bold text-slate-900">{company.tradeName || company.name}</div>
                                                        <div className="text-xs text-slate-500">{company.ruc} · {company.type} · {company.affiliated}</div>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleSelectCompany(company.id)}
                                                        disabled={feActionLoading === `select_company_${company.id}` || data.fe_company_id === company.id}
                                                        className="px-3 py-2 rounded-lg bg-slate-200 text-slate-800 text-xs font-bold hover:bg-slate-300 transition disabled:opacity-50"
                                                    >
                                                        {data.fe_company_id === company.id ? 'Activa' : 'Usar'}
                                                    </button>
                                                </div>
                                            )) : (
                                                <div className="px-4 py-6 text-sm text-slate-500">Sin compañías remotas cargadas aún.</div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="mt-6 rounded-xl border border-slate-200 bg-white p-4">
                                <h3 className="text-sm font-black uppercase tracking-widest text-slate-700 mb-4">Oficinas y puntos de emisión</h3>
                                <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                                    <div className="grid gap-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Código</label>
                                                <input type="text" maxLength="4" value={officeForm.code} onChange={e => setOfficeForm(prev => ({ ...prev, code: e.target.value }))} className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition" />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Tipo</label>
                                                <select value={officeForm.type} onChange={e => setOfficeForm(prev => ({ ...prev, type: e.target.value }))} className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition">
                                                    <option value="associated">Asociada</option>
                                                    <option value="main">Principal</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Teléfono</label>
                                                <input type="text" value={officeForm.telephone} onChange={e => setOfficeForm(prev => ({ ...prev, telephone: e.target.value }))} className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition" />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Coordenadas</label>
                                                <input type="text" value={officeForm.coordinates} onChange={e => setOfficeForm(prev => ({ ...prev, coordinates: e.target.value }))} className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition" placeholder="+8.89400,-79.5230" />
                                            </div>
                                            <div className="md:col-span-2">
                                                <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Dirección</label>
                                                <input type="text" value={officeForm.address} onChange={e => setOfficeForm(prev => ({ ...prev, address: e.target.value }))} className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition" />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Ubicación DGI</label>
                                                <select value={officeForm.location} onChange={e => setOfficeForm(prev => ({ ...prev, location: e.target.value }))} className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition">
                                                    <option value="">Selecciona una ubicación</option>
                                                    {feResources.locations?.map(location => (
                                                        <option key={location.code || location.value} value={location.code || location.value}>
                                                            {location.code || location.value} - {location.label || location.name || location.value}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Email</label>
                                                <input type="email" value={officeForm.email} onChange={e => setOfficeForm(prev => ({ ...prev, email: e.target.value }))} className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition" />
                                            </div>
                                        </div>
                                        <label className="flex items-center gap-3 rounded-lg border border-slate-200 px-4 py-3 bg-slate-50">
                                            <input type="checkbox" checked={!!officeForm.setAsDefault} onChange={e => setOfficeForm(prev => ({ ...prev, setAsDefault: e.target.checked }))} />
                                            <span className="text-sm font-bold text-slate-700">Usar esta oficina como predeterminada para FE</span>
                                        </label>
                                        <button type="button" onClick={handleCreateOffice} disabled={feActionLoading === 'create_office' || !data.fe_company_id} className="px-4 py-3 rounded-lg bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 transition disabled:opacity-50">
                                            {feActionLoading === 'create_office' ? 'Guardando...' : 'Crear / actualizar oficina'}
                                        </button>
                                    </div>
                                    <div className="max-h-80 overflow-auto rounded-lg border border-slate-200">
                                        {feResources.offices?.length ? feResources.offices.map(office => (
                                            <div key={office.id} className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3 text-sm last:border-b-0">
                                                <div>
                                                    <div className="font-bold text-slate-900">{office.code} · {office.type}</div>
                                                    <div className="text-xs text-slate-500">{office.address}</div>
                                                    <div className="text-xs text-slate-400">{office.id}</div>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => handleSelectOffice(office.id)}
                                                    disabled={feActionLoading === `select_office_${office.id}` || data.fe_office_id === office.id}
                                                    className="px-3 py-2 rounded-lg bg-slate-200 text-slate-800 text-xs font-bold hover:bg-slate-300 transition disabled:opacity-50"
                                                >
                                                    {data.fe_office_id === office.id ? 'Activa' : 'Usar'}
                                                </button>
                                            </div>
                                        )) : (
                                            <div className="px-4 py-6 text-sm text-slate-500">Sin oficinas remotas para la compañía seleccionada.</div>
                                        )}
                                    </div>
                                </div>
                            </div>
                            </div>
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                                <svg className="w-5 h-5 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Enlace de Cuentas Contables
                            </h2>
                            <p className="text-xs text-slate-500 mb-4 bg-blue-50 p-3 rounded-lg border border-blue-100 italic">
                                Configura las cuentas necesarias para que el sistema genere los asientos contables automáticos en compras y recepciones.
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-xs font-black uppercase text-slate-500 mb-2 tracking-widest">Cuenta de Inventario</label>
                                    <select
                                        value={data.cta_inventario_id || ''}
                                        onChange={e => setData('cta_inventario_id', e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl border-slate-200 bg-slate-50 font-bold text-slate-700 focus:bg-white transition"
                                    >
                                        <option value="">-- Seleccionar Cuenta --</option>
                                        {accounts.map(acc => (
                                            <option key={acc.id} value={acc.id}>{acc.codigo} - {acc.nombre}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-black uppercase text-slate-500 mb-2 tracking-widest">Cuenta Puente (Recepción)</label>
                                    <select
                                        value={data.cta_recepcion_transitoria_id || ''}
                                        onChange={e => setData('cta_recepcion_transitoria_id', e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl border-slate-200 bg-slate-50 font-bold text-slate-700 focus:bg-white transition"
                                    >
                                        <option value="">-- Seleccionar Cuenta --</option>
                                        {accounts.map(acc => (
                                            <option key={acc.id} value={acc.id}>{acc.codigo} - {acc.nombre}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-black uppercase text-slate-500 mb-2 tracking-widest">Cuenta ITBMS por Pagar (Ventas)</label>
                                    <select
                                        value={data.cta_itbms_id || ''}
                                        onChange={e => setData('cta_itbms_id', e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl border-slate-200 bg-slate-50 font-bold text-slate-700 focus:bg-white transition"
                                    >
                                        <option value="">-- Seleccionar Cuenta --</option>
                                        {accounts.map(acc => (
                                            <option key={acc.id} value={acc.id}>{acc.codigo} - {acc.nombre}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-black uppercase text-slate-500 mb-2 tracking-widest">Cuenta ITBMS por Cobrar (Compras)</label>
                                    <select
                                        value={data.cta_itbms_compras_id || ''}
                                        onChange={e => setData('cta_itbms_compras_id', e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl border-slate-200 bg-slate-50 font-bold text-slate-700 focus:bg-white transition"
                                    >
                                        <option value="">-- Seleccionar Cuenta --</option>
                                        {accounts.map(acc => (
                                            <option key={acc.id} value={acc.id}>{acc.codigo} - {acc.nombre}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-black uppercase text-slate-500 mb-2 tracking-widest">Cuenta por Pagar (CXP)</label>
                                    <select
                                        value={data.cta_cxp_id || ''}
                                        onChange={e => setData('cta_cxp_id', e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl border-slate-200 bg-slate-50 font-bold text-slate-700 focus:bg-white transition"
                                    >
                                        <option value="">-- Seleccionar Cuenta --</option>
                                        {accounts.map(acc => (
                                            <option key={acc.id} value={acc.id}>{acc.codigo} - {acc.nombre}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-50 px-8 py-4 flex justify-end gap-4 border-t border-slate-200">
                        <button
                            type="submit"
                            disabled={processing}
                            className="px-8 py-3 bg-slate-900 text-white rounded-lg font-bold hover:bg-slate-800 transition disabled:opacity-50 flex items-center gap-2"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                            </svg>
                            {processing ? 'Guardando...' : 'Guardar Configuración'}
                        </button>
                    </div>
                </form>
            </div>
        </AuthenticatedLayout>
    );
}
