import React, { useState, useEffect } from 'react';
import { Head, useForm, router, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import {
    Palette, Clock, Upload, Play, Pause, CheckCircle,
    MessageSquare, FileText, Image as ImageIcon, ArrowLeft,
    AlertCircle
} from 'lucide-react';

export default function Show({ orden }) {
    const [timerRunning, setTimerRunning] = useState(false);
    const [elapsedSeconds, setElapsedSeconds] = useState(0);
    const [timerInterval, setTimerInterval] = useState(null);

    // Formulario para subir propuesta
    const { data, setData, post, processing, reset, errors } = useForm({
        imagen: null,
        comentarios: ''
    });

    // Calcular tiempo total acumulado (Sesiones cerradas + Sesión activa)
    useEffect(() => {
        if (orden.tiempos && orden.tiempos.length > 0) {
            let totalSeconds = 0;
            let activeTimer = false;

            orden.tiempos.forEach(t => {
                const inicio = new Date(t.hora_inicio);
                if (t.hora_fin) {
                    const fin = new Date(t.hora_fin);
                    totalSeconds += Math.floor((fin - inicio) / 1000);
                } else {
                    activeTimer = true;
                    const ahora = new Date();
                    totalSeconds += Math.floor((ahora - inicio) / 1000);
                }
            });

            setElapsedSeconds(totalSeconds);
            setTimerRunning(activeTimer);
        }
    }, [orden.tiempos]);

    // Actualizar contador cada segundo si está corriendo
    useEffect(() => {
        let interval = null;
        if (timerRunning) {
            interval = setInterval(() => {
                setElapsedSeconds(prev => prev + 1);
            }, 1000);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [timerRunning]);

    const formatTime = (seconds) => {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const handleStartTimer = () => {
        fetch('/api/diseno/timer/start', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content
            },
            body: JSON.stringify({
                orden_id: orden.id,
                fase: 'Diseño'
            })
        }).then(() => {
            setTimerRunning(true);
            router.reload({ only: ['orden'] });
        });
    };

    const handlePauseTimer = () => {
        fetch('/api/diseno/timer/stop', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content
            },
            body: JSON.stringify({
                orden_id: orden.id,
                fase: 'Diseño'
            })
        }).then(() => {
            setTimerRunning(false);
            // Forzar recarga de datos para tener los tiempos finales exactos del servidor
            router.reload({ only: ['orden'] });
        });
    };

    const handleUploadSubmit = (e) => {
        e.preventDefault();
        post(route('produccion.diseno.enviar', orden.id), {
            onSuccess: () => {
                reset();
                router.reload();
            }
        });
    };

    return (
        <AuthenticatedLayout>
            <Head title={`Diseño - ${orden.numero_orden}`} />

            <div className="max-w-7xl mx-auto p-6 space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <div className="flex items-center gap-4">
                        <Link
                            href={route('produccion.diseno.index')}
                            className="p-2 hover:bg-slate-100 rounded-xl transition"
                        >
                            <ArrowLeft size={24} className="text-slate-600" />
                        </Link>
                        <div>
                            <h1 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                                <Palette className="text-purple-600" size={32} />
                                PROCESO DE DISEÑO
                            </h1>
                            <p className="text-slate-500 font-medium mt-1">Orden #{orden.numero_orden} - {orden.cliente?.razon_social}</p>
                        </div>
                    </div>

                    {/* Timer */}
                    <div className="bg-slate-900 text-white px-6 py-4 rounded-2xl shadow-lg">
                        <div className="text-xs uppercase tracking-widest opacity-70 mb-1">Tiempo de Diseño</div>
                        <div className="text-3xl font-black font-mono">{formatTime(elapsedSeconds)}</div>
                        <div className="flex gap-2 mt-3">
                            {!timerRunning ? (
                                <button
                                    onClick={handleStartTimer}
                                    className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-xl font-bold text-xs uppercase flex items-center gap-2 transition"
                                >
                                    <Play size={14} fill="currentColor" /> Iniciar
                                </button>
                            ) : (
                                <button
                                    onClick={handlePauseTimer}
                                    className="bg-orange-600 hover:bg-orange-500 text-white px-4 py-2 rounded-xl font-bold text-xs uppercase flex items-center gap-2 transition"
                                >
                                    <Pause size={14} /> Pausar
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Columna Izquierda: Instrucciones y Brief */}
                    <div className="lg:col-span-1 space-y-6">
                        {/* Instrucciones del Proyecto */}
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                            <h3 className="font-black text-sm uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
                                <FileText size={16} /> Instrucciones del Proyecto
                            </h3>
                            {orden.detalle_diseno ? (
                                <p className="text-slate-700 text-sm leading-relaxed">{orden.detalle_diseno}</p>
                            ) : (
                                <p className="text-slate-400 italic text-sm">Sin instrucciones específicas</p>
                            )}
                        </div>

                        {/* Brief del Cliente */}
                        {orden.brief_cliente && (
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                                <h3 className="font-black text-sm uppercase tracking-wider text-slate-400 mb-4">Brief del Cliente</h3>
                                <p className="text-slate-700 text-sm leading-relaxed">{orden.brief_cliente}</p>
                            </div>
                        )}

                        {/* Materiales de Referencia */}
                        {orden.archivo_brief_path && (
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                                <h3 className="font-black text-sm uppercase tracking-wider text-slate-400 mb-4">Materiales de Referencia</h3>
                                <a
                                    href={`/storage/${orden.archivo_brief_path}`}
                                    target="_blank"
                                    className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-bold text-sm"
                                >
                                    <Upload size={16} /> Descargar
                                </a>
                                <a
                                    href={`/storage/${orden.archivo_brief_path}`}
                                    target="_blank"
                                    className="mt-2 block text-xs text-slate-500 hover:underline"
                                >
                                    VER ARCHIVO
                                </a>
                            </div>
                        )}
                    </div>

                    {/* Columna Central: Trazabilidad de Revisiones */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                            <h3 className="font-black text-sm uppercase tracking-wider text-slate-400 mb-4">Trazabilidad de Revisiones</h3>
                            <p className="text-xs text-slate-500 mb-4">{orden.diseno_historial?.length || 0} Entregas realizadas</p>

                            <div className="space-y-4 max-h-[600px] overflow-y-auto">
                                {orden.diseno_historial && orden.diseno_historial.length > 0 ? (
                                    orden.diseno_historial.map((historial, index) => (
                                        <div key={historial.id} className={`p-4 rounded-xl border-2 ${historial.estado === 'Aprobado' ? 'bg-green-50 border-green-200' :
                                            historial.estado === 'Rechazado' ? 'bg-red-50 border-red-200' :
                                                'bg-blue-50 border-blue-200'
                                            }`}>
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="font-black text-xs uppercase">#{orden.diseno_historial.length - index}</span>
                                                <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase ${historial.estado === 'Aprobado' ? 'bg-green-200 text-green-800' :
                                                    historial.estado === 'Rechazado' ? 'bg-red-200 text-red-800' :
                                                        'bg-blue-200 text-blue-800'
                                                    }`}>
                                                    {historial.estado}
                                                </span>
                                            </div>
                                            <div className="text-[10px] text-slate-500 font-bold mb-2">REV #{historial.intento}</div>
                                            {historial.comentarios_cliente && (
                                                <p className="text-sm text-slate-700 mb-2">{historial.comentarios_cliente}</p>
                                            )}
                                            {historial.comentarios_staff && (
                                                <p className="text-sm text-slate-700 mb-2 italic">{historial.comentarios_staff}</p>
                                            )}
                                            <div className="text-[10px] text-slate-400 mt-2">
                                                {new Date(historial.created_at).toLocaleString('es-PA')}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-slate-400 italic text-sm text-center py-8">Sin historial de revisiones</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Columna Derecha: Subir Propuesta */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                            <h3 className="font-black text-sm uppercase tracking-wider text-slate-400 mb-4">Enviar Propuesta al Cliente</h3>

                            <form onSubmit={handleUploadSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                                        Imagen de Propuesta (JPG/PNG)
                                    </label>
                                    <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:bg-slate-50 transition-colors cursor-pointer relative">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            required
                                            onChange={e => setData('imagen', e.target.files[0])}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                        />
                                        <Upload className="mx-auto text-slate-400 mb-2" size={32} />
                                        <span className="text-sm font-bold text-slate-600 block">
                                            {data.imagen ? data.imagen.name : 'Click para seleccionar archivo'}
                                        </span>
                                    </div>
                                    {errors.imagen && <p className="text-red-500 text-xs mt-1">{errors.imagen}</p>}
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                                        Comentarios para el Cliente
                                    </label>
                                    <textarea
                                        className="w-full border-slate-200 rounded-xl text-sm"
                                        rows="4"
                                        placeholder="Hola, te envío la propuesta lista..."
                                        value={data.comentarios}
                                        onChange={e => setData('comentarios', e.target.value)}
                                    ></textarea>
                                </div>

                                <button
                                    disabled={processing}
                                    className="w-full bg-purple-600 hover:bg-purple-700 text-white font-black py-3 rounded-xl shadow-lg shadow-purple-200 disabled:opacity-50 flex justify-center items-center gap-2"
                                >
                                    {processing ? 'Enviando...' : (
                                        <>
                                            <CheckCircle size={18} />
                                            {orden.estado_diseno === 'Enviado' ? 'ENVIAR NUEVA VERSIÓN' : 'ENVIAR AL CLIENTE'}
                                        </>
                                    )}
                                </button>
                            </form>
                        </div>

                        {/* Información Adicional */}
                        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                            <h4 className="font-black text-xs uppercase tracking-wider text-slate-400 mb-3">Información de la Orden</h4>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Estado:</span>
                                    <span className="font-bold text-slate-900">{orden.estado}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Fecha Entrega:</span>
                                    <span className="font-bold text-slate-900">{orden.fecha_entrega}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Intentos:</span>
                                    <span className="font-bold text-slate-900">{orden.diseno_intentos || 0}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Vendedor:</span>
                                    <span className="font-bold text-slate-900">{orden.vendedor?.nombre || 'N/A'}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
