import React, { useState, useEffect, useRef } from 'react';
import { Head, router } from '@inertiajs/react';
import Pusher from 'pusher-js';
import axios from 'axios';
import { 
    MessageSquare, 
    Send, 
    CheckCircle, 
    Package,
    AlertCircle
} from 'lucide-react';

export default function Show({ orden }) {
    const [mensajes, setMensajes] = useState([]);
    const [mensajeTexto, setMensajeTexto] = useState('');
    const [enviando, setEnviando] = useState(false);
    const scrollRef = useRef(null);

    const scrollToBottom = () => {
        scrollRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [mensajes]);

    useEffect(() => {
        if (!orden?.tracking_token) return;

        // Conexión segura a la nube de Pusher usando variables de entorno
        const pusher = new Pusher(import.meta.env.VITE_PUSHER_APP_KEY, {
            cluster: import.meta.env.VITE_PUSHER_APP_CLUSTER,
            forceTLS: true,
            enabledTransports: ['ws', 'wss']
        });

        const channel = pusher.subscribe(`chat.${orden.tracking_token}`);
        
        channel.bind('nuevo-mensaje', function(data) {
            const nuevoMensaje = data.mensaje || data;
            setMensajes(prev => [...prev, nuevoMensaje]);
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

    const formatCurrency = (value) => {
        if (value === undefined || value === null) return '$0.00';
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
    };

    if (!orden) return null;

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-800 selection:bg-blue-200">
            <Head title={`Seguimiento Orden #${orden.numero_orden}`} />
            
            <div className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center shadow-sm">
                <div className="font-black text-xl text-blue-900 tracking-tighter flex items-center gap-2">
                    <Package size={24} className="text-blue-600"/>
                    PORTAL DEL CLIENTE
                </div>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                    SpacioArte
                </div>
            </div>

            <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
                
                {orden.estado_diseno === 'Pendiente' && (
                    <div className="bg-yellow-400 text-yellow-950 rounded-2xl p-6 shadow-lg shadow-yellow-400/20 flex flex-col sm:flex-row justify-between items-center gap-6">
                        <div className="flex items-start gap-4">
                            <AlertCircle size={32} className="text-yellow-700 shrink-0"/>
                            <div>
                                <h3 className="font-black text-lg uppercase tracking-tighter">¡Atención Requerida!</h3>
                                <p className="text-sm font-medium mt-1 opacity-90 max-w-xl">
                                    Hemos enviado el diseño de tu pedido por el chat. Por favor revísalo y, si estás de acuerdo, haz clic en Aprobar para que tu orden ingrese a producción de inmediato.
                                </p>
                            </div>
                        </div>
                        <button 
                            onClick={handleApprove}
                            className="bg-yellow-950 text-yellow-400 px-8 py-4 rounded-xl font-black text-sm uppercase tracking-widest hover:bg-black hover:scale-105 transition-all shadow-xl whitespace-nowrap active:scale-95"
                        >
                            Aprobar Diseño
                        </button>
                    </div>
                )}

                {orden.estado_diseno === 'Aprobado' && (
                    <div className="bg-green-500 text-white rounded-2xl p-4 shadow-lg shadow-green-500/20 flex items-center justify-center gap-3">
                        <CheckCircle size={24} />
                        <span className="font-black text-sm uppercase tracking-widest">Diseño Aprobado - En Producción</span>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                            <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
                                <div>
                                    <h1 className="text-2xl font-black tracking-tighter italic">#{orden.numero_orden}</h1>
                                    <p className="text-[10px] font-bold text-blue-300 uppercase tracking-widest mt-1">Detalles de tu Orden</p>
                                </div>
                                <div className="text-right">
                                    <div className="text-xs font-black text-slate-400 uppercase tracking-widest">Total a Pagar</div>
                                    <div className="text-xl font-black">{formatCurrency(orden.total)}</div>
                                </div>
                            </div>

                            <div className="p-6 overflow-x-auto">
                                <table className="w-full">
                                    <thead className="border-b border-slate-100">
                                        <tr>
                                            <th className="pb-4 text-left text-[10px] font-black uppercase text-slate-400 tracking-widest">Producto</th>
                                            <th className="pb-4 text-center text-[10px] font-black uppercase text-slate-400 tracking-widest">Cant.</th>
                                            <th className="pb-4 text-right text-[10px] font-black uppercase text-slate-400 tracking-widest">Subtotal</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {orden.detalles?.map(item => (
                                            <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                                                <td className="py-4">
                                                    <div className="font-bold text-slate-800 text-sm">{item.item?.nombre || 'Producto'}</div>
                                                </td>
                                                <td className="py-4 text-center font-black text-slate-600">{item.cantidad}</td>
                                                <td className="py-4 text-right font-black text-slate-900">{formatCurrency(item.total)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-2xl shadow-xl shadow-blue-900/5 border border-slate-200 flex flex-col h-[600px] sticky top-6">
                            <div className="p-4 border-b bg-blue-600 text-white rounded-t-2xl flex items-center justify-between shadow-sm z-10">
                                <h3 className="font-black text-xs uppercase tracking-widest flex items-center gap-2">
                                    <MessageSquare size={18} className="text-blue-200"/> SpacioArte Chat
                                </h3>
                                <span className="flex items-center gap-1.5 px-2 py-1 bg-white/20 rounded-full">
                                    <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
                                    <span className="text-[9px] font-black text-white">EN VIVO</span>
                                </span>
                            </div>

                            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
                                {mensajes.length === 0 && (
                                    <div className="text-center py-20 opacity-40">
                                        <MessageSquare size={40} className="mx-auto mb-3 text-slate-400"/>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">¿Tienes dudas o cambios?<br/>¡Escríbenos!</p>
                                    </div>
                                )}
                                
                                {mensajes.map((m, idx) => (
                                    <div key={idx} className={`flex ${m.emisor === 'cliente' ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[85%] p-4 rounded-2xl shadow-sm ${
                                            m.emisor === 'sistema' ? 'bg-green-100 text-green-800 w-full text-center border border-green-200 text-[10px] uppercase font-black tracking-widest' :
                                            m.emisor === 'cliente' ? 'bg-slate-800 text-white rounded-tr-none' : 'bg-white text-slate-800 border border-slate-200 rounded-tl-none'
                                        }`}>
                                            <p className={`text-xs leading-relaxed ${m.emisor !== 'sistema' && 'font-bold'}`}>{m.texto}</p>
                                            
                                            {m.requiere_aprobacion && m.emisor === 'staff' && orden.estado_diseno === 'Pendiente' && (
                                                <div className="mt-3 py-2 px-3 bg-yellow-100 text-yellow-800 text-[9px] font-black rounded-lg uppercase border border-yellow-200">
                                                    👆 REQUIERE TU APROBACIÓN
                                                </div>
                                            )}
                                            
                                            {m.emisor !== 'sistema' && (
                                                <div className="text-[8px] mt-2 opacity-50 text-right font-black italic">
                                                    {new Date(m.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                <div ref={scrollRef} />
                            </div>

                            <form onSubmit={submitMensaje} className="p-4 border-t bg-white rounded-b-2xl shadow-[0_-10px_15px_-3px_rgba(0,0,0,0.05)]">
                                <textarea 
                                    value={mensajeTexto}
                                    onChange={e => setMensajeTexto(e.target.value)}
                                    placeholder="Escribe tu mensaje aquí..."
                                    className="w-full border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-blue-600 focus:border-transparent h-20 bg-slate-50 p-3 shadow-inner placeholder:text-slate-400 mb-3 resize-none transition-all"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            submitMensaje(e);
                                        }
                                    }}
                                />
                                
                                <button 
                                    type="submit"
                                    disabled={!mensajeTexto || enviando}
                                    className="w-full bg-blue-600 text-white px-6 py-3 rounded-xl font-black text-xs flex items-center justify-center gap-2 disabled:opacity-50 hover:bg-blue-700 transition-all hover:scale-[1.02] active:scale-95 shadow-lg shadow-blue-600/30"
                                >
                                    {enviando ? 'ENVIANDO...' : <><Send size={16}/> ENVIAR MENSAJE</>}
                                </button>
                            </form>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}