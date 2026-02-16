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
    XCircle
} from 'lucide-react';

export default function Show({ orden, max_intentos }) {
    const [mensajes, setMensajes] = useState([]);
    const [mensajeTexto, setMensajeTexto] = useState('');
    const [enviando, setEnviando] = useState(false);
    const [comentariosRechazo, setComentariosRechazo] = useState('');
    const [mostrarRechazo, setMostrarRechazo] = useState(false);
    const scrollRef = useRef(null);

    const scrollToBottom = () => {
        scrollRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [mensajes]);

    useEffect(() => {
        if (!orden?.tracking_token) return;

        // Solicitar permisos para notificaciones push
        if ("Notification" in window && Notification.permission === "default") {
            Notification.requestPermission();
        }

        // Conexión segura a la nube de Pusher usando variables de entorno
        const pusher = new Pusher(import.meta.env.VITE_PUSHER_APP_KEY, {
            cluster: import.meta.env.VITE_PUSHER_APP_CLUSTER,
            forceTLS: true,
            enabledTransports: ['ws', 'wss']
        });

        const channel = pusher.subscribe(`chat.${orden.tracking_token}`);

        channel.bind('nuevo-mensaje', function (data) {
            const nuevoMensaje = data.mensaje || data;

            // Notificación Push si es del staff y el chat está cerrado o la pestaña no es visible
            if (nuevoMensaje.emisor === 'staff') {
                if ("Notification" in window && Notification.permission === "granted") {
                    new Notification("Nuevo mensaje de SpacioArte", {
                        body: nuevoMensaje.texto,
                        icon: '/logo.png' // Asegurar que el logo exista o usar uno genérico
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

        return () => {
            pusher.unsubscribe(`chat.${orden.tracking_token}`);
            pusher.disconnect();
        };
    }, [orden?.tracking_token]);

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

        // Añadimos localmente para respuesta instantánea en la UI
        setMensajes(prev => [...prev, msgObj]);

        try {
            // Usamos axios para asegurar el envío del token CSRF
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
            router.post(`/tracking/${orden.tracking_token}/approve`, {}, {
                preserveScroll: true
            });
        }
    };

    const handleReject = (e) => {
        e.preventDefault();
        if (!comentariosRechazo) return;

        router.post(`/tracking/${orden.tracking_token}/reject`, {
            comentarios: comentariosRechazo
        }, {
            preserveScroll: true,
            onSuccess: () => {
                setMostrarRechazo(false);
                setComentariosRechazo('');
            }
        });
    };

    const handleApproveBilling = () => {
        if (confirm('¿Deseas autorizar la continuación del diseño bajo el esquema de tarifas por horas adicionales?')) {
            router.post(`/tracking/${orden.tracking_token}/approve-billing`, {}, {
                preserveScroll: true
            });
        }
    };

    const formatCurrency = (value) => {
        if (value === undefined || value === null) return '$0.00';
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
    };

    const [mostrarChat, setMostrarChat] = useState(false);

    if (!orden) return null;

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-800 selection:bg-blue-200 pb-20">
            <Head title={`Seguimiento Orden #${orden.numero_orden}`} />

            {/* Header Moderno */}
            <div className="bg-white/80 backdrop-blur-md sticky top-0 z-40 border-b border-slate-200 px-6 py-4 flex justify-between items-center shadow-sm">
                <div className="font-black text-xl text-blue-900 tracking-tighter flex items-center gap-2">
                    <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
                        <Package size={20} />
                    </div>
                    PORTAL CLIENTE
                </div>
                <div className="flex flex-col items-end">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Orden #</span>
                    <span className="text-sm font-black text-slate-900">{orden.numero_orden}</span>
                </div>
            </div>

            <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">

                {/* Resumen de Pago (NUEVO) */}
                <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden group">
                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
                        <div className="text-center md:text-left">
                            <h3 className="text-blue-400 text-[10px] font-black uppercase tracking-[0.2em] mb-2">Estado Financiero</h3>
                            <div className="text-5xl font-black tracking-tighter italic">
                                {formatCurrency(orden.total)}
                            </div>
                            <p className="text-slate-400 text-xs font-bold mt-2 uppercase">Total del pedido</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4 w-full md:w-auto">
                            <div className="bg-white/5 backdrop-blur-sm p-4 rounded-3xl border border-white/10">
                                <span className="block text-[8px] font-black text-green-400 uppercase mb-1">Pagado</span>
                                <span className="text-xl font-black">{formatCurrency(orden.monto_abonado || 0)}</span>
                            </div>
                            <div className="bg-white/5 backdrop-blur-sm p-4 rounded-3xl border border-white/10">
                                <span className="block text-[8px] font-black text-red-400 uppercase mb-1">Pendiente</span>
                                <span className="text-xl font-black">{formatCurrency(orden.total - (orden.monto_abonado || 0))}</span>
                            </div>
                        </div>
                    </div>
                    {/* Decoración */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
                </div>

                {/* FLUJO DE DISEÑO */}
                {orden.estado_diseno === 'Enviado' && !mostrarRechazo && (
                    <div className="bg-white rounded-[3rem] border-2 border-blue-600 shadow-2xl overflow-hidden animate-fade-in-up">
                        <div className="bg-blue-600 text-white p-8">
                            <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                                <div>
                                    <span className="bg-white/20 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest mb-3 inline-block">Revisión Requerida</span>
                                    <h3 className="font-black text-3xl uppercase tracking-tighter italic">Nueva Propuesta de Diseño</h3>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-blue-200 mt-2">Intento {orden.diseno_intentos} de {max_intentos || 3}</p>
                                </div>
                                <div className="flex gap-4">
                                    {orden.diseno_intentos >= (max_intentos || 3) && !orden.diseno_cobro_aprobado ? (
                                        <button
                                            onClick={handleApproveBilling}
                                            className="bg-yellow-400 text-yellow-950 px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl flex items-center gap-2"
                                        >
                                            <AlertCircle size={16} />
                                            Aprobar Cobro por Revisiones
                                        </button>
                                    ) : (
                                        <>
                                            <button
                                                onClick={() => setMostrarRechazo(true)}
                                                className="bg-white/10 hover:bg-white/20 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase transition-all border border-white/20"
                                            >
                                                Solicitar Cambios
                                            </button>
                                            <button
                                                onClick={handleApprove}
                                                className="bg-white text-blue-600 px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-blue-900/40"
                                            >
                                                Aprobar Diseño
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="p-4 md:p-12 bg-slate-100">
                            <div className="bg-white p-4 rounded-[2.5rem] shadow-inner border border-slate-200">
                                <img src={`/storage/${orden.imagen_diseno}`} alt="Diseño Propuesto" className="w-full h-auto rounded-[2rem] shadow-2xl" />
                            </div>
                        </div>
                    </div>
                )}

                {mostrarRechazo && (
                    <div className="bg-white rounded-[3rem] border-2 border-red-500 shadow-2xl p-10 space-y-8 animate-fade-in-up">
                        <div className="flex justify-between items-center border-b border-slate-100 pb-6">
                            <div>
                                <h3 className="font-black text-3xl text-slate-900 tracking-tighter">¿QUÉ CAMBIAMOS?</h3>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2">
                                    {orden.diseno_intentos < (max_intentos || 3)
                                        ? `Te quedan ${(max_intentos || 3) - orden.diseno_intentos} revisiones sin costo.`
                                        : 'Límite gratuito alcanzado. El tiempo adicional se facturará.'}
                                </p>
                            </div>
                            <button onClick={() => setMostrarRechazo(false)} className="bg-slate-100 p-3 rounded-full text-slate-400 hover:text-slate-900 transition-colors">
                                <XCircle size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleReject} className="space-y-6">
                            <textarea
                                value={comentariosRechazo}
                                onChange={e => setComentariosRechazo(e.target.value)}
                                placeholder="Ejemplo: 'Me gustaría el logo un poco más grande y el fondo en azul marino...'"
                                className="w-full h-48 bg-slate-50 border-none rounded-[2rem] p-8 text-sm font-bold focus:ring-4 focus:ring-red-500/10 transition-all shadow-inner placeholder:text-slate-300"
                                required
                            />
                            <div className="flex justify-end gap-4">
                                <button
                                    type="button"
                                    onClick={() => setMostrarRechazo(false)}
                                    className="px-10 py-5 rounded-2xl font-black text-xs uppercase text-slate-500 hover:bg-slate-50 transition-all"
                                >
                                    Volver
                                </button>
                                <button
                                    type="submit"
                                    className="bg-red-600 text-white px-12 py-5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-red-600/30 hover:scale-105 active:scale-95 transition-all"
                                >
                                    Enviar Comentarios
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Tracking Progress */}
                <div className="bg-white rounded-[3rem] p-8 shadow-sm border border-slate-200">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-8 text-center">Progreso de fabricación</h3>

                    <div className="relative flex justify-between items-start max-w-2xl mx-auto">
                        {/* Línea de Carril */}
                        <div className="absolute top-6 left-0 w-full h-1 bg-slate-100 -z-0"></div>

                        {[
                            { label: 'Diseño', active: true, done: ['Diseño Aprobado', 'En Impresión', 'En Producción', 'En Espera de Entrega', 'Entregado'].includes(orden.estado) || orden.estado_diseno === 'Enviado' },
                            { label: 'Aprobación', active: ['Diseño Aprobado', 'En Impresión', 'En Producción', 'En Espera de Entrega', 'Entregado'].includes(orden.estado), done: ['Diseño Aprobado', 'En Impresión', 'En Producción', 'En Espera de Entrega', 'Entregado'].includes(orden.estado) },
                            { label: 'Producción', active: ['En Impresión', 'En Producción', 'En Espera de Entrega', 'Entregado'].includes(orden.estado), done: ['En Espera de Entrega', 'Entregado'].includes(orden.estado) },
                            { label: 'Listo', active: ['En Espera de Entrega', 'Entregado'].includes(orden.estado), done: orden.estado === 'Entregado' }
                        ].map((step, i) => (
                            <div key={i} className="relative z-10 flex flex-col items-center gap-3">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 ${step.done ? 'bg-green-500 text-white shadow-lg shadow-green-100' : step.active ? 'bg-blue-600 text-white shadow-xl shadow-blue-200 animate-pulse' : 'bg-white border-2 border-slate-100 text-slate-300'}`}>
                                    {step.done ? <CheckCircle size={20} /> : <span className="font-black text-sm">{i + 1}</span>}
                                </div>
                                <span className={`text-[10px] font-black uppercase tracking-widest ${step.active ? 'text-slate-900' : 'text-slate-300'}`}>{step.label}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Detalles del Pedido */}
                <div className="bg-white rounded-[3rem] shadow-sm border border-slate-200 overflow-hidden">
                    <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                        <h3 className="font-black text-xl uppercase tracking-tighter italic">Resumen del Pedido</h3>
                        <span className="text-[10px] font-black text-slate-400 bg-white border border-slate-200 px-3 py-1 rounded-full uppercase italic uppercase">{orden.estado}</span>
                    </div>
                    <div className="p-8">
                        <div className="space-y-6">
                            {orden.detalles?.map(item => (
                                <div key={item.id} className="flex justify-between items-center group">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center font-black text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors">
                                            {item.cantidad}
                                        </div>
                                        <div>
                                            <div className="font-bold text-slate-900">{item.item?.nombre}</div>
                                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Unidad: {formatCurrency(item.precio_unitario)}</div>
                                        </div>
                                    </div>
                                    <div className="font-black text-slate-900">{formatCurrency(item.total)}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* CHAT BURBUJA (FLOTANTE) */}
            <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-4">
                {mostrarChat && (
                    <div className="bg-white w-[350px] sm:w-[400px] h-[550px] rounded-[2.5rem] shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-scale-in mb-4">
                        <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center">
                                    <MessageSquare size={16} />
                                </div>
                                <div>
                                    <h3 className="font-black text-sm tracking-tighter uppercase italic">Chat SpacioArte</h3>
                                    <span className="text-[8px] font-bold text-green-400 uppercase tracking-widest flex items-center gap-1">
                                        <span className="w-1 h-1 bg-green-400 rounded-full animate-pulse"></span>
                                        Operadores en línea
                                    </span>
                                </div>
                            </div>
                            <button onClick={() => setMostrarChat(false)} className="text-slate-500 hover:text-white transition-colors">
                                <XCircle size={20} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/50">
                            {mensajes.length === 0 && (
                                <div className="text-center py-20 opacity-40">
                                    <MessageSquare size={40} className="mx-auto mb-3 text-slate-300" />
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">¿Tienes dudas o cambios?<br />¡Escríbenos!</p>
                                </div>
                            )}

                            {mensajes.map((m, idx) => (
                                <div key={idx} className={`flex ${m.emisor === 'cliente' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[85%] p-4 rounded-[1.5rem] shadow-sm ${m.emisor === 'sistema' ? 'bg-green-100 text-green-800 w-full text-center border border-green-200 text-[10px] uppercase font-black tracking-widest' :
                                        m.emisor === 'cliente' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white text-slate-800 border border-slate-200 rounded-tl-none'
                                        }`}>
                                        <p className="text-xs font-bold leading-relaxed">{m.texto}</p>
                                        <div className={`text-[8px] mt-2 font-black italic opacity-50 ${m.emisor === 'cliente' ? 'text-blue-100' : 'text-slate-400'}`}>
                                            {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            <div ref={scrollRef} />
                        </div>

                        <form onSubmit={submitMensaje} className="p-4 bg-white border-t border-slate-100 flex items-center gap-2">
                            <input
                                value={mensajeTexto}
                                onChange={e => setMensajeTexto(e.target.value)}
                                placeholder="Escribe tu mensaje..."
                                className="flex-1 bg-slate-50 border-none rounded-2xl px-4 py-3 text-xs font-bold focus:ring-2 focus:ring-blue-600 transition-all shadow-inner"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitMensaje(e); }
                                }}
                            />
                            <button
                                type="submit"
                                disabled={!mensajeTexto || enviando}
                                className="bg-blue-600 text-white p-3 rounded-2xl hover:bg-blue-700 transition-all disabled:opacity-50 shadow-lg shadow-blue-200"
                            >
                                <Send size={18} />
                            </button>
                        </form>
                    </div>
                )}

                <button
                    onClick={() => setMostrarChat(!mostrarChat)}
                    className={`w-16 h-16 rounded-[2rem] flex items-center justify-center shadow-2xl transition-all hover:scale-110 active:scale-95 ${mostrarChat ? 'bg-slate-900 text-white rotate-90' : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                >
                    {mostrarChat ? <XCircle size={28} /> : <MessageSquare size={28} fill="currentColor" />}
                    {!mostrarChat && mensajes.length > 0 && (
                        <span className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white text-[10px] font-black rounded-full border-2 border-white flex items-center justify-center animate-bounce">
                            {mensajes.length}
                        </span>
                    )}
                </button>
            </div>
        </div>
    );
}