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
    AlertCircle
} from 'lucide-react';

export default function Show({ ordenId }) {
    const [orden, setOrden] = useState(null);
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState(null); 
    const [mensajes, setMensajes] = useState([]);
    const scrollRef = useRef(null);
    
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

    useEffect(() => {
        if (!orden?.tracking_token) return;

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

    const handleFacturar = () => {
        if (confirm('¿Desea generar la factura fiscal?')) {
            router.post(route('facturas.convertir', orden.id));
        }
    };

    const submitMensaje = async (e) => {
        e.preventDefault();
        if (!data.mensaje_texto) return;

        const msgObj = { 
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

    const formatCurrency = (value) => {
        if (value === undefined || value === null) return '$0.00';
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
    };

    if (loading) {
        return (
            <AuthenticatedLayout>
                <div className="max-w-6xl mx-auto p-12 text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="text-slate-600 mt-4 font-bold uppercase tracking-widest">Cargando datos de la orden...</p>
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

    const prodInfo = orden.produccion?.[0] || null;

    return (
        <AuthenticatedLayout>
            <Head title={`Orden ${orden.numero_orden}`} />
            
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 mt-6">
                
                <div className="bg-white rounded-2xl p-2 shadow-sm border border-slate-200 flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-xl">
                        <Activity size={18} className="text-blue-600"/>
                        <span className="text-xs font-black uppercase text-slate-700">Estado Real:</span>
                        <span className={`text-xs font-black px-2 py-1 rounded-lg ${
                            prodInfo?.estado === 'Terminado' ? 'bg-green-500 text-white' : 'bg-blue-500 text-white animate-pulse'
                        }`}>
                            {prodInfo ? prodInfo.estado : 'En Pre-Prensa'}
                        </span>
                    </div>
                    {prodInfo?.maquina && (
                        <div className="flex items-center gap-2 px-4 py-2 border-l border-slate-200">
                            <Cpu size={18} className="text-slate-400"/>
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-tighter">Máquina actual:</span>
                            <span className="text-xs font-black text-slate-800">{prodInfo.maquina.nombre}</span>
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                            <div className="p-6 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                                <div>
                                    <h1 className="text-2xl font-black text-slate-900 tracking-tighter italic">#{orden.numero_orden}</h1>
                                    <p className="text-sm font-bold text-slate-500 uppercase">{orden.cliente?.razon_social}</p>
                                </div>
                                <div className="flex gap-2">
                                    {orden.estado === 'Confirmada' && (
                                        <button onClick={handleFacturar} className="px-4 py-2 bg-green-600 text-white rounded-xl font-black text-xs hover:bg-green-700 flex items-center gap-2 shadow-lg transition-all">
                                            <FileText size={16}/> FACTURAR
                                        </button>
                                    )}
                                    <span className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 ${
                                        orden.estado_diseno === 'Aprobado' ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-yellow-100 text-yellow-700 border border-yellow-200'
                                    }`}>
                                        {orden.estado_diseno === 'Aprobado' ? <CheckCircle size={14}/> : <Clock size={14}/>}
                                        Diseño: {orden.estado_diseno}
                                    </span>
                                </div>
                            </div>

                            <div className="p-6 overflow-x-auto">
                                <table className="w-full">
                                    <thead className="border-b border-slate-100">
                                        <tr>
                                            <th className="pb-4 text-left text-[10px] font-black uppercase text-slate-400 tracking-widest">Descripción</th>
                                            <th className="pb-4 text-center text-[10px] font-black uppercase text-slate-400 tracking-widest">Cant.</th>
                                            <th className="pb-4 text-right text-[10px] font-black uppercase text-slate-400 tracking-widest">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {orden.detalles?.map(item => (
                                            <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                                                <td className="py-4">
                                                    <div className="font-bold text-slate-800 text-sm">{item.item?.nombre || 'Producto sin nombre'}</div>
                                                    <div className="text-[9px] text-slate-400 font-black uppercase tracking-tighter">SKU: {item.item?.codigo || 'N/A'}</div>
                                                </td>
                                                <td className="py-4 text-center font-black text-slate-600">{item.cantidad}</td>
                                                <td className="py-4 text-right font-black text-slate-900">{formatCurrency(item.total)}</td>
                                            </tr>
                                        ))}
                                        {!orden.detalles?.length && (
                                            <tr>
                                                <td colSpan="3" className="py-8 text-center text-slate-400 text-sm font-bold uppercase">No hay productos en esta orden</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-slate-900 to-blue-900 rounded-2xl p-6 text-white flex justify-between items-center shadow-2xl">
                            <div>
                                <h3 className="font-black text-lg flex items-center gap-2 uppercase tracking-tighter">
                                    <ExternalLink size={20} className="text-blue-400"/> Portal del Cliente
                                </h3>
                                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Canal Pusher Realtime • Seguimiento Externo</p>
                            </div>
                            <button 
                                onClick={copiarLink}
                                className="bg-white text-blue-900 px-6 py-3 rounded-xl font-black text-xs hover:bg-blue-50 flex items-center gap-2 transition-all active:scale-95 shadow-lg"
                            >
                                <Copy size={16}/> COPIAR LINK
                            </button>
                        </div>
                    </div>

                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col h-[700px] sticky top-6">
                            <div className="p-4 border-b bg-slate-900 text-white rounded-t-2xl flex items-center justify-between">
                                <h3 className="font-black text-xs uppercase tracking-widest flex items-center gap-2">
                                    <MessageSquare size={18} className="text-blue-400"/> Chat Externo
                                </h3>
                                <span className="flex items-center gap-1.5 px-2 py-1 bg-green-500/10 rounded-full">
                                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                                    <span className="text-[9px] font-black text-green-400">EN VIVO</span>
                                </span>
                            </div>

                            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
                                {mensajes.length === 0 && (
                                    <div className="text-center py-20 opacity-20 grayscale">
                                        <MessageSquare size={40} className="mx-auto mb-2 text-slate-400"/>
                                        <p className="text-[9px] font-black uppercase tracking-widest">Esperando interacción...</p>
                                    </div>
                                )}
                                {mensajes.map((m, idx) => (
                                    <div key={idx} className={`flex ${m.emisor === 'staff' ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[85%] p-4 rounded-2xl shadow-sm ${
                                            m.emisor === 'staff' 
                                                ? 'bg-blue-600 text-white rounded-tr-none' 
                                                : 'bg-white text-slate-800 border border-slate-200 rounded-tl-none'
                                        }`}>
                                            <p className="text-xs font-bold leading-relaxed">{m.texto}</p>
                                            {m.requiere_aprobacion && (
                                                <div className="mt-3 py-1.5 px-3 bg-yellow-400 text-yellow-950 text-[9px] font-black rounded-lg uppercase flex items-center gap-2 shadow-inner">
                                                    <Clock size={12}/> PENDIENTE DE APROBACIÓN
                                                </div>
                                            )}
                                            <div className="text-[8px] mt-2 opacity-60 text-right font-black italic">
                                                {new Date(m.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                <div ref={scrollRef} />
                            </div>

                            <form onSubmit={submitMensaje} className="p-4 border-t bg-white rounded-b-2xl space-y-3">
                                <textarea 
                                    value={data.mensaje_texto}
                                    onChange={e => setData('mensaje_texto', e.target.value)}
                                    placeholder="Mensaje instantáneo vía Pusher..."
                                    className="w-full border-none rounded-xl text-xs font-bold focus:ring-0 h-24 bg-slate-100 p-3 shadow-inner placeholder:text-slate-400"
                                />
                                
                                <div className="flex items-center justify-between">
                                    <label className="flex items-center gap-2 text-[10px] font-black text-slate-500 cursor-pointer hover:text-blue-600 transition-colors uppercase tracking-tighter">
                                        <input 
                                            type="checkbox" 
                                            checked={data.requiere_aprobacion}
                                            onChange={e => setData('requiere_aprobacion', e.target.checked)}
                                            className="rounded text-blue-600 border-slate-300 focus:ring-blue-600"
                                        />
                                        Pedir Aprobación
                                    </label>
                                    
                                    <button 
                                        type="submit"
                                        disabled={!data.mensaje_texto || processing}
                                        className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-black text-xs flex items-center gap-2 disabled:opacity-30 hover:bg-blue-700 transition-all hover:scale-105 active:scale-95 shadow-lg shadow-blue-100"
                                    >
                                        <Send size={14}/> ENVIAR
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>

                </div>
            </div>
        </AuthenticatedLayout>
    );
}