import React, { useState, useEffect } from 'react';
import { Head, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Play, Square, Timer, Package, User, Cpu, AlertTriangle, ChevronLeft } from 'lucide-react';

export default function Index({ procesos }) {
    const [maquinaSeleccionada, setMaquinaSeleccionada] = useState(null);
    const [cola, setCola] = useState([]);
    const [loading, setLoading] = useState(false);
    const [mermaInput, setMermaInput] = useState({}); // Maneja la merma por ID de orden

    const { post, processing } = useForm();

    // Carga la cola de trabajo de la máquina seleccionada
    const fetchCola = (id) => {
        setLoading(true);
        fetch(route('produccion.planta.cola', id))
            .then(res => res.json())
            .then(data => {
                setMaquinaSeleccionada(data.proceso);
                setCola(data.trabajos);
                setLoading(false);
            });
    };

    // Iniciar trabajo (Captura timestamp de inicio)
    const handleIniciar = (id) => {
        post(route('produccion.iniciar', id), {
            preserveScroll: true,
            onSuccess: () => fetchCola(maquinaSeleccionada.id)
        });
    };

    // Terminar trabajo con reporte de merma opcional
    const handleTerminar = (id) => {
        const cantidadMerma = mermaInput[id] || 0;
        
        if (cantidadMerma > 0) {
            if (!confirm(`¿Confirmar que hubo ${cantidadMerma} piezas de merma? Se generará una orden de reimpresión automática.`)) {
                return;
            }
        }

        post(route('produccion.terminar', id), {
            data: { cantidad_merma: cantidadMerma },
            preserveScroll: true,
            onSuccess: () => {
                // Limpiar el input de merma para esta orden
                const nuevosInputs = { ...mermaInput };
                delete nuevosInputs[id];
                setMermaInput(nuevosInputs);
                fetchCola(maquinaSeleccionada.id);
            }
        });
    };

    return (
        <AuthenticatedLayout>
            <Head title="Control de Planta" />
            
            <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
                
                {/* 1. SELECTOR DE MÁQUINA (VISTA INICIAL) */}
                {!maquinaSeleccionada ? (
                    <div className="space-y-6">
                        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
                            <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tight">Panel de Planta</h1>
                            <p className="text-slate-500 font-bold">Seleccione el Centro de Trabajo para ver su cola</p>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {procesos.map(p => (
                                <button 
                                    key={p.id}
                                    onClick={() => fetchCola(p.id)}
                                    className="bg-white border-2 border-slate-200 p-10 rounded-[2.5rem] shadow-sm hover:border-blue-500 hover:bg-blue-50 transition-all text-center group active:scale-95"
                                >
                                    <div className="bg-slate-100 group-hover:bg-blue-100 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 transition-colors">
                                        <Cpu size={40} className="text-slate-400 group-hover:text-blue-600" />
                                    </div>
                                    <h3 className="text-2xl font-black text-slate-800 uppercase leading-tight">{p.nombre}</h3>
                                    <span className="inline-block mt-3 bg-slate-200 group-hover:bg-blue-200 text-slate-600 group-hover:text-blue-700 px-4 py-1 rounded-full font-black text-[10px] uppercase tracking-widest">
                                        {p.tipo_maquina}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>
                ) : (
                    /* 2. VISTA DE COLA DE TRABAJO */
                    <div className="space-y-6">
                        {/* Cabecera de la Máquina */}
                        <div className="flex flex-col md:flex-row justify-between items-center bg-slate-900 text-white p-6 rounded-3xl shadow-2xl gap-4">
                            <div className="flex items-center gap-4">
                                <button 
                                    onClick={() => setMaquinaSeleccionada(null)}
                                    className="bg-slate-800 p-3 rounded-2xl hover:bg-slate-700 transition-colors"
                                >
                                    <ChevronLeft size={24} />
                                </button>
                                <div>
                                    <h2 className="text-3xl font-black uppercase leading-none">{maquinaSeleccionada.nombre}</h2>
                                    <p className="text-blue-400 font-bold text-xs mt-1 uppercase tracking-widest">Cola de Producción Activa</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="bg-white/10 px-4 py-2 rounded-2xl font-bold text-sm">
                                    {cola.length} Trabajos pendientes
                                </span>
                            </div>
                        </div>

                        {loading ? (
                            <div className="text-center p-20">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                                <p className="text-slate-500 font-black uppercase tracking-tighter">Sincronizando cola...</p>
                            </div>
                        ) : cola.length === 0 ? (
                            <div className="bg-white p-24 rounded-[3rem] border-4 border-dashed border-slate-100 text-center">
                                <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <Package size={40} className="text-slate-200" />
                                </div>
                                <h3 className="text-2xl font-black text-slate-300 uppercase">Sin trabajos asignados</h3>
                            </div>
                        ) : (
                            /* Listado de Tarjetas de Trabajo */
                            <div className="grid grid-cols-1 gap-6">
                                {cola.map(trabajo => (
                                    <div key={trabajo.id} className="bg-white border-2 border-slate-100 rounded-[2.5rem] overflow-hidden shadow-xl flex flex-col lg:flex-row transition-all hover:border-blue-200">
                                        
                                        {/* Información del Trabajo */}
                                        <div className="p-8 flex-1">
                                            <div className="flex flex-wrap items-center gap-3 mb-4">
                                                <span className="bg-slate-900 text-white px-4 py-1.5 rounded-xl font-black text-sm uppercase">
                                                    #{trabajo.venta?.numero_orden}
                                                </span>
                                                <span className={`px-4 py-1.5 rounded-xl font-black text-sm uppercase ${
                                                    trabajo.estado === 'En Máquina' ? 'bg-blue-600 text-white animate-pulse' : 'bg-green-100 text-green-700'
                                                }`}>
                                                    {trabajo.estado}
                                                </span>
                                                {trabajo.notas_operario?.includes('REPROCESO') && (
                                                    <span className="bg-red-100 text-red-700 px-4 py-1.5 rounded-xl font-black text-sm uppercase flex items-center gap-1">
                                                        <AlertTriangle size={14}/> Reproceso
                                                    </span>
                                                )}
                                            </div>

                                            <h4 className="text-3xl font-black text-slate-900 mb-2 uppercase leading-tight">
                                                {trabajo.materia_prima?.nombre}
                                            </h4>
                                            
                                            <div className="flex items-center gap-2 text-slate-500 font-bold text-lg mb-6">
                                                <User size={20} className="text-blue-500"/>
                                                {trabajo.venta?.cliente?.razon_social}
                                            </div>
                                            
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                                    <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Cantidad a Producir</p>
                                                    <div className="flex items-center gap-2 text-2xl font-black text-slate-800">
                                                        <Package size={24} className="text-slate-400"/>
                                                        {trabajo.cantidad} <span className="text-sm font-bold text-slate-400 lowercase">uds</span>
                                                    </div>
                                                </div>
                                                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                                    <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Fecha Prometida</p>
                                                    <div className="flex items-center gap-2 text-xl font-black text-slate-800">
                                                        <Timer size={24} className="text-slate-400"/>
                                                        {new Date(trabajo.fecha_entrega_proyectada).toLocaleDateString()}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Acciones de Control */}
                                        <div className="bg-slate-50 p-6 lg:w-80 border-t lg:border-t-0 lg:border-l border-slate-200 flex flex-col justify-center gap-4">
                                            
                                            {trabajo.estado === 'Impreso' ? (
                                                <button 
                                                    disabled={processing}
                                                    onClick={() => handleIniciar(trabajo.id)}
                                                    className="w-full h-32 bg-green-600 hover:bg-green-500 text-white rounded-[2rem] flex flex-col items-center justify-center gap-2 shadow-lg shadow-green-100 transition-all active:scale-95 disabled:opacity-50"
                                                >
                                                    <Play size={40} fill="currentColor" />
                                                    <span className="font-black text-xl uppercase tracking-tighter">INICIAR TRABAJO</span>
                                                </button>
                                            ) : (
                                                <div className="space-y-4">
                                                    {/* Reporte de Merma */}
                                                    <div className="bg-white p-4 rounded-2xl border border-red-100">
                                                        <label className="block text-[10px] font-black text-red-500 uppercase mb-2 text-center">
                                                            Reportar Merma (Piezas dañadas)
                                                        </label>
                                                        <div className="flex items-center gap-3">
                                                            <button 
                                                                onClick={() => setMermaInput({...mermaInput, [trabajo.id]: Math.max(0, (mermaInput[trabajo.id] || 0) - 1)})}
                                                                className="w-12 h-12 bg-red-50 text-red-600 rounded-xl font-black text-xl"
                                                            >-</button>
                                                            <input 
                                                                type="number"
                                                                className="flex-1 border-0 bg-transparent text-center text-2xl font-black text-red-700 p-0 focus:ring-0"
                                                                value={mermaInput[trabajo.id] || 0}
                                                                onChange={(e) => setMermaInput({...mermaInput, [trabajo.id]: parseInt(e.target.value) || 0})}
                                                            />
                                                            <button 
                                                                onClick={() => setMermaInput({...mermaInput, [trabajo.id]: (mermaInput[trabajo.id] || 0) + 1})}
                                                                className="w-12 h-12 bg-red-50 text-red-600 rounded-xl font-black text-xl"
                                                            >+</button>
                                                        </div>
                                                    </div>

                                                    <button 
                                                        disabled={processing}
                                                        onClick={() => handleTerminar(trabajo.id)}
                                                        className="w-full h-32 bg-red-600 hover:bg-red-500 text-white rounded-[2rem] flex flex-col items-center justify-center gap-2 shadow-lg shadow-red-100 transition-all active:scale-95 disabled:opacity-50"
                                                    >
                                                        <Square size={40} fill="currentColor" />
                                                        <span className="font-black text-xl uppercase tracking-tighter">TERMINAR Y CERRAR</span>
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
}