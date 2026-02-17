import React, { useState, useEffect, useRef } from 'react';
import { Head, router } from '@inertiajs/react';
import Pusher from 'pusher-js';
import axios from 'axios';
import {
    MessageSquare,
    Send,
    CheckCircle,
    Package,
    AlertCircle,
    XCircle,
    ChevronRight,
    UploadCloud,
    CreditCard,
    FileText,
    Clock
} from 'lucide-react';

export default function Show({ orden, max_intentos }) {
    // =========================================================================
    // LÓGICA Y ESTADOS (INTACTOS)
    // =========================================================================
    const [mensajes, setMensajes] = useState([]);
    const [mensajeTexto, setMensajeTexto] = useState('');
    const [enviando, setEnviando] = useState(false);
    const [comentariosRechazo, setComentariosRechazo] = useState('');
    const [mostrarRechazo, setMostrarRechazo] = useState(false);
    const [mostrarPropioDiseno, setMostrarPropioDiseno] = useState(false);
    const [propioDisenoFile, setPropioDisenoFile] = useState(null);
    const [aceptaResponsabilidad, setAceptaResponsabilidad] = useState(false);
    const [subiendoPropio, setSubiendoPropio] = useState(false);
    const scrollRef = useRef(null);

    const scrollToBottom = () => scrollRef.current?.scrollIntoView({ behavior: "smooth" });

    useEffect(() => { scrollToBottom(); }, [mensajes]);

    useEffect(() => {
        if (!orden?.tracking_token) return;

        if ("Notification" in window && Notification.permission === "default") {
            Notification.requestPermission();
        }

        const pusher = new Pusher(import.meta.env.VITE_PUSHER_APP_KEY, {
            cluster: import.meta.env.VITE_PUSHER_APP_CLUSTER,
            forceTLS: true,
            enabledTransports: ['ws', 'wss']
        });

        const chatChannel = pusher.subscribe(`chat.${orden.tracking_token}`);
        const ordersChannel = pusher.subscribe('orders');

        chatChannel.bind('nuevo-mensaje', function (data) {
            const nuevoMensaje = data.mensaje || data;

            if (nuevoMensaje.emisor === 'staff') {
                if ("Notification" in window && Notification.permission === "granted") {
                    new Notification("Nuevo mensaje de SpacioArte", {
                        body: nuevoMensaje.texto,
                        icon: '/logo.png'
                    });
                }
            }

            setMensajes(prev => {
                const existe = prev.some(m =>
                    (m.id && m.id === nuevoMensaje.id) ||
                    (m.texto === nuevoMensaje.texto && m.created_at === nuevoMensaje.created_at && m.emisor === nuevoMensaje.emisor)
                );
                if (existe) return prev;
                return [...prev, nuevoMensaje];
            });
        });

        // Escuchar cambios de estado de la orden
        ordersChannel.bind('OrderStateChanged', function (data) {
            if (data.id === orden.id) {
                router.reload({ only: ['orden'] });
            }
        });

        return () => {
            pusher.unsubscribe(`chat.${orden.tracking_token}`);
            pusher.unsubscribe('orders');
            pusher.disconnect();
        };
    }, [orden?.tracking_token, orden?.id]);

    const submitMensaje = async (e) => {
        e.preventDefault();
        if (!mensajeTexto) return;
        setEnviando(true);

        const msgObj = {
            id: Date.now(),
            texto: mensajeTexto,
            emisor: 'cliente',
            created_at: new Date().toISOString(),
            requiere_aprobacion: false
        };

        setMensajes(prev => [...prev, msgObj]);

        try {
            await axios.post('/api/ventas/enviar-chat', {
                mensaje: msgObj,
                token: orden.tracking_token
            });
            setMensajeTexto('');
        } catch (error) {
            console.error("Falla al enviar mensaje a Pusher:", error);
        } finally {
            setEnviando(false);
        }
    };

    const handleApprove = () => {
        if (confirm('¿Estás seguro de que deseas APROBAR este diseño? Una vez aprobado, tu orden pasará a producción y no se podrán hacer cambios.')) {
            router.post(`/tracking/${orden.tracking_token}/approve`, {}, { preserveScroll: true });
        }
    };

    const handleReject = (e) => {
        e.preventDefault();
        if (!comentariosRechazo) return;
        router.post(`/tracking/${orden.tracking_token}/reject`, { comentarios: comentariosRechazo }, {
            preserveScroll: true,
            onSuccess: () => { setMostrarRechazo(false); setComentariosRechazo(''); }
        });
    };

    const handleApproveBilling = () => {
        if (confirm('Hemos alcanzado el límite de 3 revisiones gratuitas. Para continuar con nuevas versiones, se aplicarán las tarifas de diseño por hora. ¿Deseas aprobar el cobro para solicitar la Rev #4?')) {
            router.post(`/tracking/${orden.tracking_token}/approve-billing`, {}, {
                preserveScroll: true,
                onSuccess: () => setMostrarRechazo(true)
            });
        }
    };

    const handleOwnDesignSubmit = (e) => {
        e.preventDefault();
        if (!propioDisenoFile || !aceptaResponsabilidad) {
            alert('Por favor adjunta el diseño y acepta los términos de responsabilidad.');
            return;
        }
        const formData = new FormData();
        formData.append('archivo', propioDisenoFile);
        setSubiendoPropio(true);
        router.post(`/tracking/${orden.tracking_token}/own-design`, formData, {
            onSuccess: () => setSubiendoPropio(false),
            onError: () => setSubiendoPropio(false),
            forceFormData: true
        });
    };

    const formatCurrency = (value) => {
        if (value === undefined || value === null) return '$0.00';
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
    };

    const [mostrarChat, setMostrarChat] = useState(false);
    const [briefData, setBriefData] = useState({ brief_cliente: '', archivo: null });
    const [enviandoBrief, setEnviandoBrief] = useState(false);

    // =========================================================================
    // VISTA 1: OBLIGATORIA (CARGA DE BRIEF) - Estilo Apple Modal
    // =========================================================================
    if (orden && orden.cliente_envia_archivo && !orden.brief_cliente) {
        const handleBriefSubmit = (e) => {
            e.preventDefault();
            if (!briefData.brief_cliente || !briefData.archivo) {
                alert('Por favor complete la descripción y adjunte un archivo para continuar.');
                return;
            }
            const formData = new FormData();
            formData.append('brief_cliente', briefData.brief_cliente);
            formData.append('archivo', briefData.archivo);
            setEnviandoBrief(true);
            router.post(`/tracking/${orden.tracking_token}/brief`, formData, {
                onSuccess: () => setEnviandoBrief(false),
                onError: () => setEnviandoBrief(false),
                forceFormData: true
            });
        };

        return (
            <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center p-4 md:p-8 selection:bg-blue-200">
                <Head title={`Acción Requerida - Orden #${orden.numero_orden}`} />
                <div className="max-w-xl w-full bg-white/80 backdrop-blur-2xl border border-white/40 rounded-[2.5rem] shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] overflow-hidden transition-all duration-500 transform hover:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)]">
                    <div className="p-10 md:p-12">
                        <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-8 shadow-sm">
                            <UploadCloud size={32} strokeWidth={1.5} />
                        </div>
                        <h2 className="text-2xl md:text-3xl font-semibold text-gray-900 tracking-tight mb-2">Comencemos tu proyecto</h2>
                        <p className="text-gray-500 text-sm mb-10 leading-relaxed">Necesitamos tus ideas y archivos de referencia para que nuestro equipo de diseño empiece a crear la magia.</p>

                        <form onSubmit={handleBriefSubmit} className="space-y-8">
                            <div className="space-y-2">
                                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">1. Instrucciones de diseño</label>
                                <textarea
                                    className="w-full bg-gray-50/50 border border-gray-200 rounded-2xl p-4 text-sm text-gray-800 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all resize-none h-32"
                                    placeholder="Colores, textos, ideas específicas..."
                                    value={briefData.brief_cliente}
                                    onChange={e => setBriefData({ ...briefData, brief_cliente: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">2. Archivos de referencia</label>
                                <div className="relative group">
                                    <input
                                        type="file"
                                        onChange={e => setBriefData({ ...briefData, archivo: e.target.files[0] })}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                        required
                                    />
                                    <div className="bg-gray-50/50 border-2 border-dashed border-gray-200 rounded-2xl p-8 text-center group-hover:bg-blue-50/50 group-hover:border-blue-300 transition-colors duration-300">
                                        <div className="text-sm font-medium text-gray-700 truncate px-4">
                                            {briefData.archivo ? briefData.archivo.name : 'Haz clic o arrastra tu archivo aquí'}
                                        </div>
                                        <p className="text-xs text-gray-400 mt-2">Max 10MB (PDF, JPG, PNG)</p>
                                    </div>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={enviandoBrief}
                                className="w-full bg-gray-900 text-white py-4 rounded-2xl font-medium text-sm hover:bg-black transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-gray-900/20"
                            >
                                {enviandoBrief ? 'Enviando...' : 'Iniciar Proyecto'}
                                {!enviandoBrief && <ChevronRight size={16} />}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        );
    }

    if (!orden) return null;

    // =========================================================================
    // VISTA PRINCIPAL: DASHBOARD TRACKING (Layout Tipo Apple)
    // =========================================================================

    // Función auxiliar para el timeline vertical
    const steps = [
        { label: 'Diseño', desc: 'Creación y propuesta', active: true, done: ['Diseño', 'Pre-Prensa', 'Producción', 'Terminado', 'Entregado'].includes(orden.estado) || orden.estado_diseno === 'Enviado' },
        { label: 'Aprobación', desc: 'Revisión del cliente', active: ['Diseño', 'Pre-Prensa', 'Producción', 'Terminado', 'Entregado'].includes(orden.estado), done: ['Pre-Prensa', 'Producción', 'Terminado', 'Entregado'].includes(orden.estado) },
        { label: 'Producción', desc: 'Impresión y ensamblaje', active: ['Pre-Prensa', 'Producción'].includes(orden.estado), done: ['Terminado', 'Entregado'].includes(orden.estado) },
        { label: 'Entrega', desc: 'Listo para ti', active: orden.estado === 'Terminado', done: orden.estado === 'Entregado' }
    ];

    return (
        <div className="min-h-screen bg-[#F5F5F7] font-sans text-gray-900 selection:bg-blue-200 pb-24">
            <Head title={`Orden #${orden.numero_orden}`} />

            {/* Header Glassmorphism */}
            <header className="sticky top-0 z-40 bg-white/70 backdrop-blur-xl border-b border-gray-200/50 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center text-white">
                            <Package size={16} strokeWidth={2} />
                        </div>
                        <span className="font-semibold text-lg tracking-tight">Portal Cliente</span>
                    </div>
                    <div className="flex flex-col items-end">
                        <span className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">Orden</span>
                        <span className="text-sm font-semibold">#{orden.numero_orden}</span>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

                {/* Alerta de Éxito Flotante */}
                {orden.estado_diseno === 'Aprobado' && (
                    <div className="mb-8 bg-green-50/80 backdrop-blur-md border border-green-200 p-4 rounded-2xl flex items-center gap-4 transition-all animate-in fade-in slide-in-from-top-4 duration-500">
                        <div className="w-10 h-10 bg-green-500 text-white rounded-full flex items-center justify-center shrink-0 shadow-sm">
                            <CheckCircle size={20} />
                        </div>
                        <div>
                            <h4 className="font-semibold text-green-800 text-sm">Diseño Aprobado</h4>
                            <p className="text-xs text-green-600 mt-0.5">Tu pedido ha sido liberado a producción de forma exitosa.</p>
                        </div>
                    </div>
                )}

                {/* Grid Principal: 2 Columnas en Desktop */}
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">

                    {/* COLUMNA IZQUIERDA: Área principal de acción (Diseño) */}
                    <div className="xl:col-span-8 space-y-8">

                        {/* TARJETA DE DISEÑO (APROBADO O EN REVISIÓN) */}
                        <div className="bg-white rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden border border-gray-100">

                            {/* Cabecera de la Tarjeta */}
                            <div className="p-6 md:p-8 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div>
                                    {orden.estado_diseno === 'Aprobado' ? (
                                        <>
                                            <h2 className="text-2xl font-semibold tracking-tight text-gray-900">Diseño Final</h2>
                                            <p className="text-sm text-gray-500 mt-1">Este archivo ya está en proceso de fabricación.</p>
                                        </>
                                    ) : (
                                        <>
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="bg-blue-50 text-blue-600 px-2.5 py-1 rounded-md text-[10px] font-semibold uppercase tracking-wider">Requiere Revisión</span>
                                                <span className="text-xs text-gray-400 font-medium">Intento {orden.diseno_intentos} de {max_intentos || 3}</span>
                                            </div>
                                            <h2 className="text-2xl font-semibold tracking-tight text-gray-900">Propuesta de Diseño</h2>
                                        </>
                                    )}
                                </div>

                                {/* Botones de Acción (Solo si NO está aprobado y NO está mostrando formularios) */}
                                {orden.estado_diseno === 'Enviado' && !mostrarRechazo && !mostrarPropioDiseno && (
                                    <div className="flex flex-wrap items-center gap-3">
                                        {orden.diseno_intentos >= (max_intentos || 3) && !orden.diseno_cobro_aprobado ? (
                                            <button onClick={handleApproveBilling} className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-orange-100 text-orange-700 hover:bg-orange-200 transition-colors flex items-center gap-2">
                                                <AlertCircle size={14} /> Solicitar Cambios Extras
                                            </button>
                                        ) : (
                                            <button onClick={() => setMostrarRechazo(true)} className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors">
                                                Solicitar Cambios
                                            </button>
                                        )}
                                        <button onClick={handleApprove} className="px-6 py-2.5 rounded-xl text-xs font-semibold bg-black text-white shadow-md hover:bg-gray-800 transition-all transform hover:scale-[1.02]">
                                            Aprobar Diseño
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Contenedor de Imagen */}
                            <div className="p-4 md:p-8 bg-gray-50/50 flex justify-center items-center min-h-[400px]">
                                {['jpg', 'jpeg', 'png', 'gif', 'webp'].some(ext => orden.imagen_diseno?.toLowerCase().endsWith(ext)) ? (
                                    <img src={`/storage/${orden.imagen_diseno}`} alt="Diseño" className="max-w-full h-auto rounded-2xl shadow-sm border border-gray-200/60" />
                                ) : (
                                    <div className="text-center space-y-4">
                                        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto shadow-sm border border-gray-200">
                                            <FileText size={24} className="text-gray-400" />
                                        </div>
                                        <p className="text-sm font-medium text-gray-500">Archivo de alta resolución</p>
                                        <a href={`/storage/${orden.imagen_diseno}`} target="_blank" className="inline-block bg-white border border-gray-200 text-gray-800 px-6 py-2 rounded-lg font-medium text-sm hover:bg-gray-50 transition-colors shadow-sm">
                                            Descargar / Ver Archivo
                                        </a>
                                    </div>
                                )}
                            </div>

                            {/* Footer de la tarjeta para subir diseño propio */}
                            {orden.estado_diseno === 'Enviado' && !mostrarPropioDiseno && !mostrarRechazo && (
                                <div className="bg-white border-t border-gray-100 p-4 text-center">
                                    <button onClick={() => setMostrarPropioDiseno(true)} className="text-xs font-medium text-gray-500 hover:text-black transition-colors underline decoration-gray-300 underline-offset-4">
                                        ¿Prefieres enviar tu propio archivo final?
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* FORMULARIO: SOLICITAR CAMBIOS */}
                        {mostrarRechazo && (
                            <div className="bg-white rounded-[2rem] p-6 md:p-8 shadow-lg border border-gray-200 animate-in fade-in slide-in-from-bottom-4 duration-300">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-xl font-semibold tracking-tight">Solicitar Cambios</h3>
                                    <button onClick={() => setMostrarRechazo(false)} className="text-gray-400 hover:text-gray-800 bg-gray-100 p-2 rounded-full transition-colors"><XCircle size={20} /></button>
                                </div>
                                <form onSubmit={handleReject} className="space-y-4">
                                    <textarea
                                        value={comentariosRechazo}
                                        onChange={(e) => setComentariosRechazo(e.target.value)}
                                        placeholder="Describe los ajustes que necesitas de forma clara..."
                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm focus:ring-2 focus:ring-black focus:border-transparent transition-all resize-none h-32"
                                        required
                                    />
                                    <div className="flex justify-end">
                                        <button type="submit" className="bg-black text-white px-6 py-3 rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors">
                                            Enviar Comentarios
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}

                        {/* FORMULARIO: DISEÑO PROPIO */}
                        {mostrarPropioDiseno && (
                            <div className="bg-white rounded-[2rem] p-6 md:p-8 shadow-lg border border-gray-200 animate-in fade-in slide-in-from-bottom-4 duration-300">
                                <div className="flex justify-between items-center mb-6">
                                    <div>
                                        <h3 className="text-xl font-semibold tracking-tight">Enviar mi propio diseño</h3>
                                        <p className="text-xs text-gray-500 mt-1">Salta el proceso editorial subiendo tu archivo final.</p>
                                    </div>
                                    <button onClick={() => setMostrarPropioDiseno(false)} className="text-gray-400 hover:text-gray-800 bg-gray-100 p-2 rounded-full transition-colors"><XCircle size={20} /></button>
                                </div>
                                <form onSubmit={handleOwnDesignSubmit} className="space-y-6">
                                    <div className="border-2 border-dashed border-gray-200 rounded-2xl p-6 hover:bg-gray-50 transition-colors">
                                        <input
                                            type="file"
                                            onChange={e => setPropioDisenoFile(e.target.files[0])}
                                            className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200 transition-all cursor-pointer"
                                            required
                                        />
                                    </div>
                                    <div className="bg-orange-50/50 border border-orange-100 p-4 rounded-xl flex gap-4">
                                        <AlertCircle size={20} className="text-orange-500 shrink-0 mt-0.5" />
                                        <div>
                                            <p className="text-xs text-orange-800 leading-relaxed mb-3">
                                                Al enviar su propio diseño, asume la responsabilidad total sobre resolución, ortografía y perfiles de color. SpacioArte no se hace responsable por errores en el archivo original.
                                            </p>
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={aceptaResponsabilidad}
                                                    onChange={e => setAceptaResponsabilidad(e.target.checked)}
                                                    className="w-4 h-4 rounded text-black focus:ring-black border-gray-300"
                                                    required
                                                />
                                                <span className="text-xs font-semibold text-gray-900">Acepto la responsabilidad técnica</span>
                                            </label>
                                        </div>
                                    </div>
                                    <div className="flex justify-end gap-3">
                                        <button type="button" onClick={() => setMostrarPropioDiseno(false)} className="px-5 py-3 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors">Cancelar</button>
                                        <button type="submit" disabled={subiendoPropio || !aceptaResponsabilidad} className="bg-black text-white px-6 py-3 rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
                                            {subiendoPropio ? 'Subiendo...' : 'Enviar Diseño'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}
                    </div>

                    {/* COLUMNA DERECHA: Contexto y Detalles (Sidebar) */}
                    <div className="xl:col-span-4 space-y-6">

                        {/* Estado Financiero (Estilo Apple Wallet Card) */}
                        <div className="bg-gray-900 text-white rounded-[2rem] p-6 relative overflow-hidden shadow-lg">
                            {/* Decoración sutil */}
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>

                            <div className="flex items-center justify-between mb-6 relative z-10">
                                <div className="flex items-center gap-2 text-gray-400">
                                    <CreditCard size={16} />
                                    <span className="text-xs font-medium uppercase tracking-wider">Pago</span>
                                </div>
                                <span className={`text-[10px] px-2 py-1 rounded-full font-semibold ${orden.total - (orden.monto_abonado || 0) <= 0 ? 'bg-green-500/20 text-green-400' : 'bg-orange-500/20 text-orange-400'}`}>
                                    {orden.total - (orden.monto_abonado || 0) <= 0 ? 'PAGADO' : 'PENDIENTE'}
                                </span>
                            </div>

                            <div className="relative z-10">
                                <p className="text-sm text-gray-400 mb-1">Total a pagar</p>
                                <div className="text-4xl font-semibold tracking-tight mb-6">{formatCurrency(orden.total)}</div>

                                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
                                    <div>
                                        <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Abonado</p>
                                        <p className="font-medium text-sm">{formatCurrency(orden.monto_abonado || 0)}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Restante</p>
                                        <p className="font-medium text-sm">{formatCurrency(orden.total - (orden.monto_abonado || 0))}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Tracker Vertical Limpio */}
                        <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100">
                            <h3 className="text-sm font-semibold mb-6 flex items-center gap-2">
                                <Clock size={16} className="text-gray-400" />
                                Estado del Proyecto
                            </h3>
                            <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-200 before:to-transparent">
                                {steps.map((step, i) => (
                                    <div key={i} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                                        <div className={`flex items-center justify-center w-10 h-10 rounded-full border-4 border-white shrink-0 z-10 shadow-sm transition-colors duration-300 ${step.done ? 'bg-black text-white' : step.active ? 'bg-blue-600 text-white animate-pulse' : 'bg-gray-100 text-gray-400'}`}>
                                            {step.done ? <CheckCircle size={16} /> : <span className="text-xs font-bold">{i + 1}</span>}
                                        </div>
                                        <div className="w-[calc(100%-3rem)] md:w-[calc(50%-2.5rem)] p-3 rounded-xl ml-4 md:ml-0 md:group-odd:mr-4 group-odd:text-right">
                                            <h4 className={`text-sm font-semibold ${step.active || step.done ? 'text-gray-900' : 'text-gray-400'}`}>{step.label}</h4>
                                            <p className="text-[10px] text-gray-500 mt-0.5">{step.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Resumen del Pedido */}
                        <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
                            <div className="p-5 border-b border-gray-100 bg-gray-50/50">
                                <h3 className="text-sm font-semibold">Detalles del Pedido</h3>
                            </div>
                            <div className="p-2">
                                {orden.detalles?.map(item => (
                                    <div key={item.id} className="flex justify-between items-center p-3 hover:bg-gray-50 rounded-xl transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center text-xs font-semibold text-gray-500">
                                                {item.cantidad}x
                                            </div>
                                            <div>
                                                <div className="text-sm font-medium text-gray-900 line-clamp-1">{item.item?.nombre}</div>
                                                <div className="text-[10px] text-gray-400">{formatCurrency(item.precio_unitario)} c/u</div>
                                            </div>
                                        </div>
                                        <div className="font-semibold text-sm">{formatCurrency(item.total)}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* ========================================================================= */}
            {/* CHAT FLOTANTE ESTILO iMESSAGE */}
            {/* ========================================================================= */}
            <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-4">
                {mostrarChat && (
                    <div className="bg-white/80 backdrop-blur-2xl w-[90vw] sm:w-[380px] h-[500px] rounded-[2rem] shadow-[0_20px_40px_-15px_rgba(0,0,0,0.15)] border border-white/50 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 origin-bottom-right mb-2">
                        {/* Cabecera Chat */}
                        <div className="p-4 bg-white/50 border-b border-gray-100 flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center text-white">
                                    <MessageSquare size={14} />
                                </div>
                                <div>
                                    <h3 className="text-sm font-semibold tracking-tight text-gray-900">Soporte SpacioArte</h3>
                                    <div className="flex items-center gap-1.5 mt-0.5">
                                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                                        <span className="text-[10px] text-gray-500 font-medium">En línea</span>
                                    </div>
                                </div>
                            </div>
                            <button onClick={() => setMostrarChat(false)} className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center text-gray-500 transition-colors">
                                <XCircle size={18} />
                            </button>
                        </div>

                        {/* Área de Mensajes */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/30">
                            {mensajes.length === 0 && (
                                <div className="h-full flex flex-col items-center justify-center opacity-50 space-y-3">
                                    <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                                        <MessageSquare size={20} className="text-gray-500" />
                                    </div>
                                    <p className="text-xs font-medium text-gray-500 text-center">Inicia la conversación.<br />¡Estamos para ayudarte!</p>
                                </div>
                            )}

                            {mensajes.map((m, idx) => (
                                <div key={idx} className={`flex ${m.emisor === 'cliente' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm ${m.emisor === 'sistema' ? 'bg-gray-100 text-gray-600 w-full text-center text-xs font-medium my-2' :
                                        m.emisor === 'cliente' ? 'bg-blue-600 text-white rounded-br-sm' :
                                            'bg-gray-100 text-gray-800 rounded-bl-sm border border-gray-200/50'
                                        }`}>
                                        <p className="leading-relaxed">{m.texto}</p>
                                        <div className={`text-[9px] mt-1 text-right ${m.emisor === 'cliente' ? 'text-blue-200' : 'text-gray-400'}`}>
                                            {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            <div ref={scrollRef} />
                        </div>

                        {/* Input Chat */}
                        <form onSubmit={submitMensaje} className="p-3 bg-white border-t border-gray-100">
                            <div className="relative flex items-center">
                                <input
                                    value={mensajeTexto}
                                    onChange={e => setMensajeTexto(e.target.value)}
                                    placeholder="Mensaje de iMessage..."
                                    className="w-full bg-gray-100 border-none rounded-full pl-4 pr-12 py-2.5 text-sm focus:ring-2 focus:ring-blue-500/20 transition-all placeholder:text-gray-400"
                                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitMensaje(e); } }}
                                />
                                <button
                                    type="submit"
                                    disabled={!mensajeTexto || enviando}
                                    className="absolute right-1.5 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:bg-gray-400"
                                >
                                    <Send size={14} className="-ml-0.5" />
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Botón Flotante (Gatillo) */}
                <button
                    onClick={() => setMostrarChat(!mostrarChat)}
                    className={`relative w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 hover:scale-105 active:scale-95 ${mostrarChat ? 'bg-gray-900 text-white rotate-90' : 'bg-black text-white hover:bg-gray-800'
                        }`}
                >
                    {mostrarChat ? <XCircle size={24} /> : <MessageSquare size={24} fill="currentColor" />}

                    {!mostrarChat && mensajes.length > 0 && (
                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full border-2 border-[#F5F5F7] flex items-center justify-center">
                            {mensajes.length}
                        </span>
                    )}
                </button>
            </div>
        </div>
    );
}