import React, { useState, useEffect, useRef } from 'react';
import { Head, router, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Pusher from 'pusher-js';
import axios from 'axios';
import {
    MessageSquare,
    Send,
    CheckCircle,
    Clock,
    Copy,
    ExternalLink,
    FileText,
    Activity,
    Cpu,
    AlertCircle,
    Play,
    Square,
    Upload,
    History,
    Timer,
    DollarSign
} from 'lucide-react';

export default function Show({ ordenId }) {
    const [orden, setOrden] = useState(null);
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState(null);
    const [mensajes, setMensajes] = useState([]);
    const [historial, setHistorial] = useState([]);
    const [runningTimer, setRunningTimer] = useState(null);
    const [elapsedTime, setElapsedTime] = useState(0);
    const [uploading, setUploading] = useState(false);
    const scrollRef = useRef(null);
    const timerRef = useRef(null);

    const { data: uploadData, setData: setUploadData, post, processing: uploadProcessing, reset: resetUpload } = useForm({
        imagen: null,
        comentarios: ''
    });

    const { data, setData, processing, reset } = useForm({
        mensaje_texto: '',
        requiere_aprobacion: false,
    });

    const scrollToBottom = () => {
        scrollRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [mensajes]);

    const refreshData = () => {
        axios.get(`/api/ventas/ordenes/${ordenId}`)
            .then(res => {
                if (res.data.error) {
                    setErrorMsg(res.data.error);
                } else {
                    setOrden(res.data);
                    // Cargar historial
                    axios.get(`/api/ventas/ordenes/${ordenId}/historial`)
                        .then(h => setHistorial(h.data))
                        .catch(err => console.error("Error al cargar historial:", err));

                    // Verificar si hay un timer activo
                    const active = res.data.tiempos?.find(t => t.hora_fin === null);
                    if (active) {
                        setRunningTimer(active);
                        const start = new Date(active.hora_inicio).getTime();
                        setElapsedTime(Math.floor((Date.now() - start) / 1000));
                    } else {
                        setRunningTimer(null);
                        setElapsedTime(0);
                    }
                }
                setLoading(false);
            })
            .catch(err => {
                console.error("Error al cargar orden:", err);
                setErrorMsg(err.response?.data?.error || "Error de conexión al cargar la orden.");
                setLoading(false);
            });
    };

    useEffect(() => {
        refreshData();
    }, [ordenId]);

    // Timer effect
    useEffect(() => {
        if (runningTimer) {
            timerRef.current = setInterval(() => {
                setElapsedTime(prev => prev + 1);
            }, 1000);
        } else {
            clearInterval(timerRef.current);
        }
        return () => clearInterval(timerRef.current);
    }, [runningTimer]);

    useEffect(() => {
        if (!orden?.tracking_token) return;

        const pusher = new Pusher(import.meta.env.VITE_PUSHER_APP_KEY, {
            cluster: import.meta.env.VITE_PUSHER_APP_CLUSTER,
            forceTLS: true,
            enabledTransports: ['ws', 'wss']
        });

        const channel = pusher.subscribe(`chat.${orden.tracking_token}`);

        channel.bind('nuevo-mensaje', function (data) {
            const nuevoMensaje = data.mensaje || data;
            setMensajes(prev => {
                const existe = prev.some(m =>
                    (m.id && m.id === nuevoMensaje.id) ||
                    (m.texto === nuevoMensaje.texto && m.created_at === nuevoMensaje.created_at && m.emisor === nuevoMensaje.emisor)
                );
                if (existe) return prev;
                return [...prev, nuevoMensaje];
            });
        });

        return () => {
            pusher.unsubscribe(`chat.${orden.tracking_token}`);
            pusher.disconnect();
        };
    }, [orden?.tracking_token]);

    const handleAction = async (action, fase) => {
        try {
            if (action === 'start') {
                await axios.post('/api/diseno/timer/start', { orden_id: ordenId, fase });
            } else if (action === 'stop') {
                await axios.post('/api/diseno/timer/stop', { orden_id: ordenId, fase });
            } else if (action === 'update_status') {
                await axios.put(`/ventas/ordenes/${ordenId}/estado`, { estado: fase });
            }
            refreshData();
        } catch (error) {
            alert("Error al gestionar el proceso: " + (error.response?.data?.message || error.message));
        }
    };

    const handleReprint = async () => {
        if (!confirm('¿Desea enviar esta orden a RE-IMPRESIÓN? Esto creará nuevas tareas en producción.')) return;
        try {
            await axios.post(`/api/ventas/ordenes/${ordenId}/reimprimir`);
            alert("Orden enviada a re-impresión");
            refreshData();
        } catch (error) {
            alert("Error al generar re-impresión");
        }
    };

    const handleUploadDesign = async (e) => {
        e.preventDefault();
        if (!uploadData.imagen) return alert("Seleccione una imagen");

        const formData = new FormData();
        formData.append('imagen', uploadData.imagen);
        formData.append('comentarios', uploadData.comentarios);
        formData.append('numero_orden', orden.numero_orden);

        setUploading(true);
        try {
            await axios.post('/api/diseno/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            resetUpload();
            alert("Diseño subido correctamente");
            refreshData();
        } catch (error) {
            alert("Error: " + (error.response?.data?.error || "Falla al subir"));
        } finally {
            setUploading(false);
        }
    };

    const handleFacturar = () => {
        if (confirm('¿Desea generar la factura fiscal?')) {
            router.post(route('facturas.convertir', orden.id));
        }
    };

    const submitMensaje = async (e) => {
        e.preventDefault();
        if (!data.mensaje_texto) return;

        const msgObj = {
            id: Date.now(),
            texto: data.mensaje_texto,
            emisor: 'staff',
            created_at: new Date().toISOString(),
            requiere_aprobacion: data.requiere_aprobacion
        };

        setMensajes(prev => [...prev, msgObj]);

        try {
            await axios.post('/api/ventas/enviar-chat', {
                mensaje: msgObj,
                token: orden.tracking_token
            });
            reset('mensaje_texto', 'requiere_aprobacion');
        } catch (error) {
            console.error("Falla al enviar mensaje:", error);
        }
    };

    const copiarLink = () => {
        if (!orden?.tracking_token) {
            alert('No hay token de seguimiento generado para esta orden.');
            return;
        }
        const url = `${window.location.origin}/tracking/${orden.tracking_token}`;
        navigator.clipboard.writeText(url);
        alert('Enlace de seguimiento copiado');
    };

    const formatTime = (seconds) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return [h, m, s].map(v => v < 10 ? "0" + v : v).join(":");
    };

    const formatCurrency = (value) => {
        if (value === undefined || value === null) return '$0.00';
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
    };

    const getStatusStyles = (status) => {
        switch (status) {
            case 'Borrador': return 'bg-slate-100 text-slate-600 border-slate-200';
            case 'En Proceso de Diseño': return 'bg-blue-100 text-blue-700 border-blue-200 animate-pulse';
            case 'Enviado para Aprobación': return 'bg-purple-100 text-purple-700 border-purple-200';
            case 'Diseño Rechazado': return 'bg-red-100 text-red-700 border-red-200';
            case 'Rediseñando': return 'bg-orange-100 text-orange-700 border-orange-200 animate-pulse';
            case 'Diseño Aprobado': return 'bg-green-100 text-green-700 border-green-200';
            case 'En Impresión': return 'bg-cyan-100 text-cyan-700 border-cyan-200';
            case 'En Producción': return 'bg-indigo-100 text-indigo-700 border-indigo-200';
            case 'En Espera de Entrega': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
            case 'Entregado': return 'bg-emerald-600 text-white border-emerald-700';
            default: return 'bg-slate-100 text-slate-600 border-slate-200';
        }
    };

    if (loading) {
        return (
            <AuthenticatedLayout>
                <div className="max-w-6xl mx-auto p-12 text-center mt-20">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto"></div>
                    <p className="text-slate-500 mt-6 font-black uppercase tracking-[0.3em] animate-pulse">Sincronizando Orden...</p>
                </div>
            </AuthenticatedLayout>
        );
    }

    if (errorMsg) {
        return (
            <AuthenticatedLayout>
                <div className="max-w-3xl mx-auto p-12 mt-10">
                    <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-8 rounded-2xl shadow-sm flex flex-col items-center justify-center gap-4 text-center">
                        <AlertCircle size={48} className="text-red-500" />
                        <div>
                            <strong className="font-black text-xl block mb-2 uppercase tracking-tighter">Error del Servidor</strong>
                            <span className="text-base font-bold text-red-600 bg-white px-4 py-2 rounded-lg border border-red-100 shadow-inner block">{errorMsg}</span>
                        </div>
                    </div>
                </div>
            </AuthenticatedLayout>
        );
    }

    if (!orden) return null;

    return (
        <AuthenticatedLayout>
            <Head title={`Orden ${orden.numero_orden}`} />

            <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

                {/* HEADER DE ESTADO */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white p-6 rounded-3xl shadow-xl border border-slate-100">
                    <div className="flex items-center gap-6">
                        <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
                            <FileText size={32} />
                        </div>
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-3xl font-black text-slate-900 tracking-tighter italic">#{orden.numero_orden}</h1>
                                <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border-2 ${getStatusStyles(orden.estado)}`}>
                                    {orden.estado}
                                </span>
                            </div>
                            <p className="text-slate-500 font-bold uppercase text-xs mt-1">{orden.cliente?.razon_social} • Contacto: ID {orden.contacto_id}</p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        {orden.estado === 'Confirmada' && (
                            <button onClick={handleFacturar} className="px-6 py-3 bg-green-600 text-white rounded-2xl font-black text-xs hover:bg-green-700 flex items-center gap-2 shadow-xl shadow-green-100 transition-all active:scale-95">
                                <FileText size={18} /> GENERAR FACTURA
                            </button>
                        )}
                        <div className="flex items-center gap-2 px-5 py-3 bg-slate-900 text-white rounded-2xl shadow-xl">
                            <Activity size={18} className="text-blue-400" />
                            <span className="text-[10px] font-black uppercase tracking-widest">
                                Diseño: {orden.estado_diseno}
                            </span>
                        </div>
                        {orden.diseno_cobro_aprobado && (
                            <div className="flex items-center gap-2 px-5 py-3 bg-indigo-600 text-white rounded-2xl shadow-xl animate-pulse">
                                <DollarSign size={18} />
                                <span className="text-[10px] font-black uppercase tracking-widest">
                                    Cobro Activo: {Math.floor(orden.diseno_minutos_acumulados / 60)}h {orden.diseno_minutos_acumulados % 60}m • {formatCurrency(orden.diseno_monto_calculado)}
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                    {/* COLUMNA IZQUIERDA: DETALLES Y GESTIÓN */}
                    <div className="lg:col-span-8 space-y-8">

                        {/* TARJETA DE GESTIÓN DE TIEMPOS Y DISEÑO (KDS) */}
                        <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>

                            <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                                <div className="space-y-4 flex-1 w-full">
                                    <h3 className="text-blue-400 font-black uppercase tracking-[0.2em] text-xs flex items-center gap-2">
                                        <Timer size={16} /> Gestión de Procesos y Diseño
                                    </h3>

                                    <div className="flex flex-wrap gap-4">
                                        {!runningTimer ? (
                                            <>
                                                {/* Botón Diseño */}
                                                <button
                                                    onClick={() => handleAction('start', 'Diseño')}
                                                    disabled={['Diseño Aprobado', 'En Impresión', 'En Producción', 'Entregado'].includes(orden.estado)}
                                                    className={`flex-1 min-w-[180px] h-20 rounded-3xl flex items-center justify-center gap-4 transition-all active:scale-95 shadow-lg group ${['Diseño Aprobado', 'En Impresión', 'En Producción', 'Entregado'].includes(orden.estado) ? 'bg-slate-800 opacity-50' : 'bg-blue-600 hover:bg-blue-500 shadow-blue-900/40'}`}
                                                >
                                                    <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                                                        <Cpu size={20} />
                                                    </div>
                                                    <div className="text-left">
                                                        <div className="text-[10px] font-black uppercase tracking-widest opacity-60">Fase 1</div>
                                                        <div className="font-black text-sm">ENVIAR A DISEÑO</div>
                                                    </div>
                                                </button>

                                                {/* Botón Impresión */}
                                                <button
                                                    onClick={() => handleAction('start', 'Impresión')}
                                                    disabled={['En Impresión', 'En Producción', 'Entregado'].includes(orden.estado)}
                                                    className={`flex-1 min-w-[180px] h-20 rounded-3xl flex items-center justify-center gap-4 transition-all active:scale-95 border group ${['En Impresión', 'En Producción', 'Entregado'].includes(orden.estado) ? 'bg-slate-800 border-slate-700 opacity-50' : 'bg-slate-800 hover:bg-slate-700 border-slate-700 shadow-lg'}`}
                                                >
                                                    <Play fill="currentColor" size={20} className="text-slate-400" />
                                                    <div className="text-left">
                                                        <div className="text-[10px] font-black uppercase tracking-widest opacity-60">Fase 2</div>
                                                        <div className="font-black text-sm">ENVIAR A IMPRESIÓN</div>
                                                    </div>
                                                </button>

                                                {/* Botón Maquinado / Prensa */}
                                                <button
                                                    onClick={() => handleAction('start', 'Producción')}
                                                    disabled={['En Producción', 'Entregado'].includes(orden.estado)}
                                                    className={`flex-1 min-w-[180px] h-20 rounded-3xl flex items-center justify-center gap-4 transition-all active:scale-95 border group ${['En Producción', 'Entregado'].includes(orden.estado) ? 'bg-slate-800 border-slate-700 opacity-50' : 'bg-indigo-900 hover:bg-indigo-800 border-indigo-700 shadow-lg'}`}
                                                >
                                                    <Activity size={20} className="text-indigo-400" />
                                                    <div className="text-left">
                                                        <div className="text-[10px] font-black uppercase tracking-widest opacity-60">Fase 3</div>
                                                        <div className="font-black text-sm">ENVIAR A MÁQUINA</div>
                                                    </div>
                                                </button>

                                                {/* Botón Reimpresión */}
                                                <button
                                                    onClick={handleReprint}
                                                    className="flex-none w-20 h-20 bg-red-900/30 hover:bg-red-900/50 border border-red-900/50 rounded-3xl flex items-center justify-center transition-all active:scale-95 group shadow-xl"
                                                    title="Reimprimir / Reproceso"
                                                >
                                                    <History size={24} className="text-red-500 group-hover:rotate-180 transition-transform duration-500" />
                                                </button>
                                            </>
                                        ) : (
                                            <div className="w-full h-32 bg-blue-600 rounded-[2rem] flex items-center justify-between px-10 shadow-inner relative overflow-hidden">
                                                <div className="flex items-center gap-6 z-10">
                                                    <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center animate-spin-slow">
                                                        <Clock size={32} />
                                                    </div>
                                                    <div>
                                                        <div className="text-[10px] font-black uppercase tracking-[0.3em] opacity-80">PROCESANDO: {runningTimer.fase}</div>
                                                        <div className="text-4xl font-mono font-black tabular-nums">{formatTime(elapsedTime)}</div>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => handleAction('stop', runningTimer.fase)}
                                                    className="w-16 h-16 bg-white text-blue-600 rounded-full flex items-center justify-center hover:bg-red-50 hover:text-red-600 transition-all active:scale-90 z-10 shadow-2xl"
                                                >
                                                    <Square fill="currentColor" size={24} />
                                                </button>
                                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_2s_infinite]"></div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* FORMULARIO DE CARGA INTEGRADO */}
                                {orden.estado_diseno !== 'Aprobado' && (
                                    <div className="w-full md:w-80 bg-white/5 border border-white/10 p-6 rounded-[2rem] space-y-4 backdrop-blur-sm">
                                        <h4 className="text-[10px] font-black uppercase tracking-widest text-blue-300">Entregar Diseño</h4>
                                        <div className="space-y-3">
                                            <input
                                                type="file"
                                                id="design-file"
                                                hidden
                                                onChange={e => setUploadData('imagen', e.target.files[0])}
                                            />
                                            <label
                                                htmlFor="design-file"
                                                className={`w-full h-12 rounded-xl border-2 border-dashed border-white/20 flex items-center justify-center gap-2 text-[10px] font-black uppercase cursor-pointer transition-all ${uploadData.imagen ? 'bg-green-500/20 border-green-500/50 text-green-300' : 'hover:bg-white/10'}`}
                                            >
                                                <Upload size={14} /> {uploadData.imagen ? 'IMAGEN LISTA' : 'SELECCIONAR ARCHIVO'}
                                            </label>
                                            <textarea
                                                value={uploadData.comentarios}
                                                onChange={e => setUploadData('comentarios', e.target.value)}
                                                placeholder="Comentarios para el cliente..."
                                                className="w-full bg-white/5 border-white/10 rounded-xl text-[11px] font-bold text-white placeholder:text-white/20 h-16 resize-none focus:ring-blue-500"
                                            />
                                            <button
                                                onClick={handleUploadDesign}
                                                disabled={uploading || !uploadData.imagen}
                                                className="w-full h-12 bg-blue-600 hover:bg-blue-500 disabled:opacity-30 rounded-xl font-black text-[10px] uppercase shadow-lg shadow-blue-900 transition-all"
                                            >
                                                {uploading ? 'SUBIENDO...' : 'SUBIR Y NOTIFICAR CLIENTE'}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* PRODUCTOS */}
                        <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 overflow-hidden">
                            <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                                <h3 className="text-sm font-black uppercase tracking-widest text-slate-500 flex items-center gap-3">
                                    <FileText size={18} className="text-blue-500" /> Detalle de la Orden
                                </h3>
                                <div className="text-xs font-bold text-slate-400 bg-white px-4 py-2 rounded-2xl border border-slate-100 italic">
                                    Documento ID: {orden.id}
                                </div>
                            </div>
                            <div className="p-0 overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="bg-slate-50/50">
                                            <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest">Producto / Servicio</th>
                                            <th className="px-8 py-5 text-center text-[10px] font-black uppercase text-slate-400 tracking-widest">Cant.</th>
                                            <th className="px-8 py-5 text-right text-[10px] font-black uppercase text-slate-400 tracking-widest">Precio</th>
                                            <th className="px-8 py-5 text-right text-[10px] font-black uppercase text-slate-400 tracking-widest">Subtotal</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {orden.detalles?.map(item => (
                                            <tr key={item.id} className="group hover:bg-blue-50/30 transition-all">
                                                <td className="px-8 py-6">
                                                    <div className="font-black text-slate-800 text-base">{item.item?.nombre}</div>
                                                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Categoría: {item.item?.categoria?.nombre || 'General'}</div>
                                                </td>
                                                <td className="px-8 py-6 text-center">
                                                    <span className="bg-slate-100 text-slate-900 px-4 py-2 rounded-xl font-black text-sm">{item.cantidad}</span>
                                                </td>
                                                <td className="px-8 py-6 text-right font-bold text-slate-400 italic">
                                                    {formatCurrency(item.precio_unitario)}
                                                </td>
                                                <td className="px-8 py-6 text-right font-black text-slate-900 text-lg group-hover:text-blue-600 transition-colors">
                                                    {formatCurrency(item.total)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <div className="p-10 bg-slate-50 border-t border-slate-100">
                                <div className="flex flex-col gap-3 max-w-xs ml-auto">
                                    <div className="flex justify-between items-center text-slate-500 font-bold uppercase text-[10px] tracking-widest">
                                        <span>Subtotal</span>
                                        <span className="text-slate-800 text-sm tracking-normal">{formatCurrency(orden.subtotal)}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-slate-500 font-bold uppercase text-[10px] tracking-widest">
                                        <span>Impuestos (7%)</span>
                                        <span className="text-slate-800 text-sm tracking-normal">{formatCurrency(orden.itbms_total)}</span>
                                    </div>
                                    <div className="h-px bg-slate-200 my-2"></div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs font-black uppercase tracking-[0.2em] text-blue-600">Total Final</span>
                                        <span className="text-3xl font-black text-slate-900 tracking-tighter italic">{formatCurrency(orden.total)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* HISTORIAL DE DISEÑO */}
                        {historial.length > 0 && (
                            <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 overflow-hidden">
                                <div className="p-8 bg-white border-b border-slate-50 flex justify-between items-center">
                                    <h3 className="text-sm font-black uppercase tracking-widest text-slate-500 flex items-center gap-3">
                                        <History size={18} className="text-purple-500" /> Trazabilidad de Revisiones
                                    </h3>
                                    <span className="bg-purple-50 text-purple-700 px-4 py-1.5 rounded-full text-[10px] font-black uppercase ring-1 ring-purple-100">
                                        {historial.length} Entregas realizadas
                                    </span>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-8">
                                    {[...historial].reverse().map((hist, i) => (
                                        <div key={hist.id} className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm hover:shadow-xl transition-all hover:scale-[1.02] relative group">
                                            <div className="absolute -top-3 -left-3 w-8 h-8 bg-slate-900 text-white rounded-full flex items-center justify-center font-black text-[10px] shadow-lg group-hover:bg-blue-600 transition-colors">
                                                #{historial.length - i}
                                            </div>
                                            <img
                                                src={`/storage/${hist.imagen}`}
                                                className="w-full h-40 object-cover rounded-2xl mb-4 shadow-inner ring-1 ring-slate-100 cursor-zoom-in"
                                                onClick={() => window.open(`/storage/${hist.imagen}`, '_blank')}
                                            />
                                            <div className="space-y-3">
                                                <div className="flex justify-between items-center">
                                                    <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase ${hist.estado === 'Aprobado' ? 'bg-green-100 text-green-700' :
                                                        hist.estado === 'Rechazado' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                                                        }`}>
                                                        {hist.estado}
                                                    </span>
                                                    <span className="text-[9px] font-black text-slate-300 uppercase italic">
                                                        REV #{hist.intento}
                                                    </span>
                                                </div>
                                                <p className="text-[11px] font-bold text-slate-600 line-clamp-3 italic leading-relaxed">
                                                    {hist.comentarios_cliente || hist.comentarios_staff || 'Sin comentarios'}
                                                </p>
                                                <div className="text-[9px] text-slate-400 font-bold pt-2 border-t border-slate-50 flex items-center gap-1.5">
                                                    <Clock size={10} /> {new Date(hist.created_at).toLocaleString()}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* COLUMNA DERECHA: COMUNICACIÓN */}
                    <div className="lg:col-span-4 lg:sticky lg:top-8 self-start h-[calc(100vh-4rem)]">
                        <div className="bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 flex flex-col h-full overflow-hidden">
                            <div className="p-6 border-b bg-slate-900 text-white flex items-center justify-between shadow-lg">
                                <h3 className="font-black text-xs uppercase tracking-[0.2em] flex items-center gap-3">
                                    <MessageSquare size={20} className="text-blue-400" /> Chat Operativo
                                </h3>
                                <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 rounded-full ring-1 ring-green-500/20">
                                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]"></span>
                                    <span className="text-[10px] font-black text-green-400 tracking-tighter">CLIENTE ONLINE</span>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/30">
                                {mensajes.length === 0 && (
                                    <div className="text-center py-32 opacity-10">
                                        <MessageSquare size={64} className="mx-auto mb-4" />
                                        <p className="text-xs font-black uppercase tracking-[0.4em]">Inicia la conversación</p>
                                    </div>
                                )}
                                {mensajes.map((m, idx) => (
                                    <div key={idx} className={`flex ${m.emisor === 'staff' ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[85%] group`}>
                                            <div className={`p-4 rounded-3xl shadow-sm relative ${m.emisor === 'staff'
                                                ? 'bg-blue-600 text-white rounded-tr-none'
                                                : 'bg-white text-slate-800 border border-slate-200 rounded-tl-none shadow-slate-200/50'
                                                }`}>
                                                <p className="text-xs font-bold leading-relaxed">{m.texto}</p>
                                                {m.requiere_aprobacion && (
                                                    <div className="mt-3 py-2 px-3 bg-yellow-400 text-yellow-950 text-[9px] font-black rounded-xl uppercase flex items-center gap-2 shadow-inner">
                                                        <Clock size={12} className="animate-pulse" /> PENDIENTE DE APROBACIÓN
                                                    </div>
                                                )}
                                                <div className={`text-[8px] mt-2 opacity-60 font-black italic flex items-center gap-1 ${m.emisor === 'staff' ? 'justify-end' : 'justify-start'}`}>
                                                    <Clock size={8} /> {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                <div ref={scrollRef} />
                            </div>

                            <form onSubmit={submitMensaje} className="p-6 border-t bg-white space-y-4 shadow-inner">
                                <textarea
                                    value={data.mensaje_texto}
                                    onChange={e => setData('mensaje_texto', e.target.value)}
                                    placeholder="Escribe aquí tu mensaje externo..."
                                    className="w-full border-2 border-slate-100 rounded-3xl text-sm font-bold focus:ring-0 focus:border-blue-500 h-28 bg-slate-50/50 p-5 shadow-inner placeholder:text-slate-300 transition-all"
                                />

                                <div className="flex items-center justify-between gap-4">
                                    <label className="flex items-center gap-3 text-[10px] font-black text-slate-400 cursor-pointer hover:text-blue-600 transition-colors uppercase tracking-widest leading-none">
                                        <div className="relative">
                                            <input
                                                type="checkbox"
                                                checked={data.requiere_aprobacion}
                                                onChange={e => setData('requiere_aprobacion', e.target.checked)}
                                                className="peer appearance-none w-5 h-5 border-2 border-slate-200 rounded-lg checked:bg-blue-600 checked:border-blue-600 transition-all cursor-pointer"
                                            />
                                            <CheckCircle size={12} className="absolute top-1 left-1 text-white opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity" />
                                        </div>
                                        Pedir Aprobación
                                    </label>

                                    <button
                                        type="submit"
                                        disabled={!data.mensaje_texto || processing}
                                        className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-black text-xs flex items-center gap-3 disabled:opacity-20 hover:bg-blue-700 transition-all hover:scale-105 active:scale-95 shadow-xl shadow-blue-100"
                                    >
                                        <Send size={16} /> ENVIAR
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>

                {/* FOOTER DEL PORTAL */}
                <div className="bg-gradient-to-r from-blue-700 to-indigo-800 rounded-[2.5rem] p-8 text-white flex flex-col md:flex-row justify-between items-center gap-8 shadow-2xl">
                    <div className="space-y-3 text-center md:text-left">
                        <h3 className="font-black text-2xl flex items-center justify-center md:justify-start gap-4 uppercase tracking-tighter italic">
                            <ExternalLink size={28} className="text-blue-300" /> Link de Seguimiento
                        </h3>
                        <p className="text-blue-100/60 text-xs font-bold uppercase tracking-[0.2em]">Enlace público para que el cliente apruebe diseños y revise su pedido.</p>
                    </div>
                    <div className="flex items-center gap-4 bg-white/10 p-2 rounded-3xl border border-white/10 backdrop-blur-md">
                        <div className="px-5 font-mono text-sm opacity-60 text-blue-200 hidden sm:block">...{orden.tracking_token?.substring(0, 12)}...</div>
                        <button
                            onClick={copiarLink}
                            className="bg-white text-blue-900 px-10 py-5 rounded-2xl font-black text-sm hover:bg-blue-50 flex items-center gap-3 transition-all active:scale-95 shadow-2xl"
                        >
                            <Copy size={20} /> COPIAR ENLACE PRIVADO
                        </button>
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes shimmer {
                    100% { transform: translateX(100%); }
                }
                .animate-spin-slow {
                    animation: spin 8s linear infinite;
                }
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </AuthenticatedLayout>
    );
}