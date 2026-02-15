import React, { useState, useEffect, useRef } from 'react';
import { Head, router, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Pusher from 'pusher-js'; // Importante tener instalado: npm install pusher-js
import { 
    MessageSquare, 
    Send, 
    CheckCircle, 
    Clock, 
    Copy, 
    ExternalLink, 
    FileText,
    Activity,
    Cpu
} from 'lucide-react';

export default function Show({ ordenId }) {
    const [orden, setOrden] = useState(null);
    const [loading, setLoading] = useState(true);
    const [mensajes, setMensajes] = useState([]); // Historial en memoria (Pusher)
    const scrollRef = useRef(null);
    
    const { data, setData, processing, reset } = useForm({
        mensaje_texto: '',
        requiere_aprobacion: false,
    });

    // Función para bajar el scroll automáticamente cuando llega un mensaje
    const scrollToBottom = () => {
        scrollRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [mensajes]);

    const refreshData = () => {
        fetch(`/api/ventas/ordenes/${ordenId}`)
            .then(res => res.json())
            .then(data => {
                setOrden(data);
                setLoading(false);
            })
            .catch(err => console.error("Error al cargar orden:", err));
    };

    // EFECTO: Carga inicial y Conexión Pusher
    useEffect(() => {
        refreshData();

        // Configuración Pusher (Tus credenciales reales)
        const pusher = new Pusher('423d616fb70f7d534cdc', {
            cluster: 'mt1'
        });

        // Solo nos suscribimos si tenemos el token
        if (orden?.tracking_token) {
            const channel = pusher.subscribe(`chat.${orden.tracking_token}`);
            
            // Escuchamos el evento broadcasted desde Laravel
            channel.bind('nuevo-mensaje', function(data) {
                setMensajes(prev => [...prev, data.mensaje]);
            });

            return () => {
                pusher.unsubscribe(`chat.${orden.tracking_token}`);
            };
        }
    }, [ordenId, orden?.tracking_token]);

    const handleFacturar = () => {
        if (confirm('¿Desea generar la factura fiscal?')) {
            router.post(route('facturas.convertir', orden.id));
        }
    };

    // ENVÍO DE MENSAJE: Vía API -> Evento Pusher -> Otros Clientes
    const submitMensaje = async (e) => {
        e.preventDefault();
        if (!data.mensaje_texto) return;

        const msgObj = { 
            texto: data.mensaje_texto, 
            emisor: 'staff', 
            created_at: new Date().toISOString(),
            requiere_aprobacion: data.requiere_aprobacion 
        };

        // 1. Añadimos localmente (Instantáneo)
        setMensajes(prev => [...prev, msgObj]);

        // 2. Enviamos al endpoint que dispara el evento de Pusher
        try {
            await fetch('/api/ventas/enviar-chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    mensaje: msgObj, 
                    token: orden.tracking_token 
                })
            });
            reset('mensaje_texto', 'requiere_aprobacion');
        } catch (error) {
            console.error("Falla al enviar a Pusher:", error);
        }
    };

    const copiarLink = () => {
        const url = `${window.location.origin}/tracking/${orden.tracking_token}`;
        navigator.clipboard.writeText(url);
        alert('Enlace de seguimiento copiado');
    };

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
    };

    if (loading) {
        return (
            <AuthenticatedLayout>
                <div className="max-w-6xl mx-auto p-12 text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="text-slate-600 mt-4 font-bold uppercase tracking-widest">Sincronizando con Pusher...</p>
                </div>
            </AuthenticatedLayout>
        );
    }

    const prodInfo = orden.produccion?.[0] || null;

    return (
        <AuthenticatedLayout>
            <Head title={`Orden ${orden.numero_orden}`} />
            
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
                
                {/* BARRA DE ESTADO SUPERIOR */}
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
                    
                    {/* COLUMNA IZQUIERDA: DETALLES DE ORDEN */}
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
                                                    <div className="font-bold text-slate-800 text-sm">{item.item?.nombre}</div>
                                                    <div className="text-[9px] text-slate-400 font-black uppercase tracking-tighter">SKU: {item.item?.codigo}</div>
                                                </td>
                                                <td className="py-4 text-center font-black text-slate-600">{item.cantidad}</td>
                                                <td className="py-4 text-right font-black text-slate-900">{formatCurrency(item.total)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* ACCESO RÁPIDO AL PORTAL */}
                        <div className="bg-gradient-to-br from-slate-900 to-blue-900 rounded-2xl p-6 text-white flex justify-between items-center shadow-2xl">
                            <div>
                                <h3 className="font-black text-lg flex items-center gap-2 uppercase tracking-tighter">
                                    <ExternalLink size={20} className="text-blue-400"/> Portal del Cliente
                                </h3>
                                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Vía Canal Pusher mt1 • No consume servidor</p>
                            </div>
                            <button 
                                onClick={copiarLink}
                                className="bg-white text-blue-900 px-6 py-3 rounded-xl font-black text-xs hover:bg-blue-50 flex items-center gap-2 transition-all active:scale-95 shadow-lg"
                            >
                                <Copy size={16}/> COPIAR LINK
                            </button>
                        </div>
                    </div>

                    {/* COLUMNA DERECHA: CHAT REALTIME (PUSHER) */}
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

                            {/* Área de Mensajes */}
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

                            {/* Formulario Pusher */}
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
                                            className="rounded text-blue-600 border-slate-300"
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