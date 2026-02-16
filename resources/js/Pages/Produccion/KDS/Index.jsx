import React, { useState, useEffect } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import axios from 'axios';
import {
    Monitor,
    Clock,
    ChevronRight,
    Timer,
    Box,
    Palette,
    Printer,
    Layers,
    AlertCircle,
    CheckCircle2,
    PlayCircle
} from 'lucide-react';

export default function Index({ procesos }) {
    const [data, setData] = useState({ disenos: [], producciones: [] });
    const [loading, setLoading] = useState(true);
    const [lastUpdate, setLastUpdate] = useState(new Date());

    const fetchData = async () => {
        try {
            const res = await axios.get('/api/produccion/kds/data');
            setData(res.data);
            setLastUpdate(new Date());
            setLoading(false);
        } catch (error) {
            console.error("Error fetching KDS data:", error);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 30000); // Refrescar cada 30 segundos
        return () => clearInterval(interval);
    }, []);

    const getStatusColor = (tipo, estado) => {
        if (tipo === 'diseno') {
            if (estado === 'En Proceso de Diseño' || estado === 'Rediseñando') return 'bg-blue-500';
            if (estado === 'Diseño Rechazado') return 'bg-red-500';
            return 'bg-slate-400';
        }
        if (estado === 'En Máquina') return 'bg-green-500';
        return 'bg-amber-500';
    };

    const renderCard = (job) => (
        <div key={`${job.tipo}-${job.id}`} className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl hover:border-blue-500/50 transition-all group relative overflow-hidden">
            {job.timer_activo && (
                <div className="absolute top-0 right-0 p-2">
                    <span className="flex h-3 w-3 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
                    </span>
                </div>
            )}

            <div className="flex justify-between items-start mb-4">
                <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest text-white ${getStatusColor(job.tipo, job.estado)}`}>
                    {job.estado}
                </div>
                <div className="text-[10px] font-bold text-slate-500 flex items-center gap-1">
                    <Clock size={12} /> {job.fecha_entrega ? new Date(job.fecha_entrega).toLocaleDateString() : 'S/F'}
                </div>
            </div>

            <div className="space-y-1 mb-4">
                <h4 className="text-white font-black text-lg tracking-tighter italic">#{job.numero}</h4>
                <p className="text-slate-400 text-xs font-bold uppercase truncate">{job.cliente}</p>
            </div>

            {job.item && (
                <div className="bg-white/5 rounded-xl p-3 mb-4">
                    <div className="text-[9px] font-black text-slate-500 uppercase">Trabajo:</div>
                    <div className="text-xs font-bold text-blue-400">{job.cantidad}x {job.item}</div>
                </div>
            )}

            <div className="flex justify-between items-center pt-4 border-t border-slate-800">
                {job.timer_activo ? (
                    <div className="flex items-center gap-2 text-blue-400 animate-pulse">
                        <Timer size={14} />
                        <span className="text-[10px] font-black font-mono">{job.minutos_transcurridos}m activado</span>
                    </div>
                ) : (
                    <div className="text-slate-600 text-[10px] font-bold italic">En espera...</div>
                )}

                <Link
                    href={job.tipo === 'diseno' ? `/ventas/ordenes/${job.id}` : '#'}
                    className="p-2 bg-slate-800 rounded-xl hover:bg-blue-600 transition-colors text-white"
                >
                    <ChevronRight size={16} />
                </Link>
            </div>
        </div>
    );

    return (
        <AuthenticatedLayout>
            <Head title="KDS Board - 360 SpacioArte" />

            <div className="bg-slate-950 min-h-screen p-6 space-y-8">

                {/* HEADER KDS */}
                <div className="flex flex-col md:flex-row justify-between items-center gap-6 bg-slate-900/50 p-6 rounded-[2.5rem] border border-slate-900 backdrop-blur-xl">
                    <div className="flex items-center gap-6">
                        <div className="w-16 h-16 bg-blue-600 rounded-[2rem] flex items-center justify-center text-white shadow-[0_0_30px_rgba(37,99,235,0.4)]">
                            <Monitor size={32} />
                        </div>
                        <div>
                            <h1 className="text-4xl font-black text-white tracking-tighter italic uppercase">Panel de Producción <span className="text-blue-500">KDS</span></h1>
                            <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.4em] mt-1">Real-time Production Monitoring System</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 bg-slate-950/50 px-6 py-4 rounded-[1.5rem] border border-slate-800">
                        <div className="text-right">
                            <div className="text-[9px] font-black text-slate-600 uppercase tracking-widest leading-none mb-1">Última Actualización</div>
                            <div className="text-blue-400 font-mono text-xs font-bold">{lastUpdate.toLocaleTimeString()}</div>
                        </div>
                        <div className="h-8 w-px bg-slate-800"></div>
                        <button onClick={fetchData} className="p-3 hover:bg-white/5 rounded-full transition-all active:scale-90 text-slate-400">
                            <PlayCircle size={20} />
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-8">

                    {/* COLUMNA DISEÑO */}
                    <div className="flex flex-col gap-6">
                        <div className="flex items-center justify-between px-4">
                            <div className="flex items-center gap-3">
                                <Palette className="text-blue-500" size={24} />
                                <h2 className="text-xl font-black text-white uppercase italic">DISEÑO</h2>
                            </div>
                            <span className="bg-blue-600/20 text-blue-400 px-3 py-1 rounded-full text-[10px] font-black border border-blue-500/20">
                                {data.disenos.length}
                            </span>
                        </div>
                        <div className="flex-1 bg-slate-900/20 border border-slate-900/50 p-4 rounded-[2rem] space-y-6 overflow-y-auto max-h-[1200px] scrollbar-hide shadow-inner">
                            {data.disenos.length === 0 && (
                                <div className="py-20 text-center opacity-10">
                                    <Palette size={48} className="mx-auto" />
                                    <p className="mt-4 font-black uppercase text-[10px]">Sin diseños pendientes</p>
                                </div>
                            )}
                            {data.disenos.map(job => renderCard(job))}
                        </div>
                    </div>

                    {/* COLUMNAS DINÁMICAS POR PROCESO */}
                    {procesos.map(proceso => {
                        const jobs = data.producciones.filter(p => p.proceso_id === proceso.id);
                        return (
                            <div key={proceso.id} className="flex flex-col gap-6">
                                <div className="flex items-center justify-between px-4">
                                    <div className="flex items-center gap-3">
                                        <Printer className="text-amber-500" size={24} />
                                        <h2 className="text-xl font-black text-white uppercase italic">{proceso.nombre}</h2>
                                    </div>
                                    <span className="bg-amber-600/20 text-amber-400 px-3 py-1 rounded-full text-[10px] font-black border border-amber-500/20">
                                        {jobs.length}
                                    </span>
                                </div>
                                <div className="flex-1 bg-slate-900/20 border border-slate-900/50 p-4 rounded-[2rem] space-y-6 overflow-y-auto max-h-[1200px] scrollbar-hide shadow-inner">
                                    {jobs.length === 0 && (
                                        <div className="py-20 text-center opacity-10">
                                            <Layers size={48} className="mx-auto" />
                                            <p className="mt-4 font-black uppercase text-[10px]">Sin trabajos en cola</p>
                                        </div>
                                    )}
                                    {jobs.map(job => renderCard(job))}
                                </div>
                            </div>
                        );
                    })}
                </div>

            </div>

            <style>{`
                .scrollbar-hide::-webkit-scrollbar { display: none; }
                .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
        </AuthenticatedLayout>
    );
}
