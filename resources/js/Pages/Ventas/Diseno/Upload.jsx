import React, { useState } from 'react';
import { Head } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import axios from 'axios';
import {
    Upload,
    Search,
    CheckCircle,
    AlertTriangle,
    XCircle,
    Image as ImageIcon,
    FileText
} from 'lucide-react';

export default function DesignUpload() {
    const [q, setQ] = useState('');
    const [orden, setOrden] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [comentarios, setComentarios] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleSearch = async (e) => {
        if (e) e.preventDefault();
        if (!q) return;

        setLoading(true);
        setError(null);
        setOrden(null);
        setSuccess(false);

        try {
            const res = await axios.get(`/api/diseno/search?q=${q}`);
            setOrden(res.data);
        } catch (err) {
            setError(err.response?.data?.error || 'No se encontró la orden especificada.');
        } finally {
            setLoading(false);
        }
    };

    const handleFileChange = (e) => {
        const selected = e.target.files[0];
        if (selected) {
            setFile(selected);
            setPreview(URL.createObjectURL(selected));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!file || !orden) return;

        setSubmitting(true);
        setError(null);

        const formData = new FormData();
        formData.append('numero_orden', orden.numero_orden);
        formData.append('imagen', file);
        formData.append('comentarios', comentarios);

        try {
            await axios.post('/api/diseno/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setSuccess(true);
            setFile(null);
            setPreview(null);
            setComentarios('');
            // Recargar datos de la orden
            handleSearch();
        } catch (err) {
            setError(err.response?.data?.error || 'Error al subir el diseño.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <AuthenticatedLayout>
            <Head title="Carga de Diseño" />

            <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
                <div className="text-center space-y-2">
                    <h1 className="text-3xl font-black text-slate-900 tracking-tighter italic">CARGA DE DISEÑO</h1>
                    <p className="text-slate-500 font-bold text-xs uppercase tracking-widest">Módulo de Pre-Prensa y Diseño</p>
                </div>

                {/* Buscador Rápido */}
                <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 p-6">
                    <form onSubmit={handleSearch} className="flex gap-3">
                        <div className="relative flex-1">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                            <input
                                type="text"
                                value={q}
                                onChange={e => setQ(e.target.value)}
                                placeholder="Escanea QR o escribe número de orden..."
                                className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-blue-600 font-bold text-slate-800"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="bg-slate-900 text-white px-8 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-black transition-all active:scale-95 disabled:opacity-50"
                        >
                            {loading ? 'Buscando...' : 'Buscar'}
                        </button>
                    </form>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-2xl flex items-center gap-3 animate-shake">
                        <XCircle size={20} />
                        <span className="text-xs font-black uppercase tracking-tight">{error}</span>
                    </div>
                )}

                {success && (
                    <div className="bg-green-50 border border-green-100 text-green-600 p-4 rounded-2xl flex items-center gap-3 animate-bounce-short">
                        <CheckCircle size={20} />
                        <span className="text-xs font-black uppercase tracking-tight">¡Diseño enviado correctamente al cliente!</span>
                    </div>
                )}

                {orden && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in-up">
                        {/* Datos de la Orden */}
                        <div className="bg-white rounded-3xl border border-slate-100 p-6 space-y-6 flex flex-col justify-between">
                            <div className="space-y-4">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h2 className="text-2xl font-black text-slate-900 italic">#{orden.numero_orden}</h2>
                                        <p className="text-xs font-bold text-slate-500 uppercase">{orden.cliente}</p>
                                    </div>
                                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${orden.estado_diseno === 'Aprobado' ? 'bg-green-100 text-green-600' :
                                            orden.estado_diseno === 'Rechazado' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
                                        }`}>
                                        {orden.estado_diseno}
                                    </span>
                                </div>

                                <div className="bg-slate-50 rounded-2xl p-4 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-white p-2 rounded-xl border border-slate-100">
                                            <AlertTriangle size={20} className="text-yellow-500" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Vez Subida</p>
                                            <p className="font-black text-lg text-slate-800">{orden.intentos} veces</p>
                                        </div>
                                    </div>
                                    <span className="text-[10px] font-black text-slate-400">Diseño Real Realizado</span>
                                </div>
                            </div>

                            <div className="bg-blue-50 border border-blue-100 p-4 rounded-2xl">
                                <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest mb-1">Instrucciones</p>
                                <p className="text-xs font-bold text-blue-900">Al subir el archivo, el sistema notificará automáticamente al cliente vía WhatsApp/Chat para su aprobación inmediata.</p>
                            </div>
                        </div>

                        {/* Formulario de Carga */}
                        <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-xl shadow-blue-900/5">
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Seleccionar Archivo (Imagen)</label>
                                    <label className={`w-full h-40 border-2 border-dashed rounded-3xl flex flex-col items-center justify-center gap-2 cursor-pointer transition-all ${preview ? 'border-blue-500 bg-blue-50/20' : 'border-slate-200 hover:border-blue-400 hover:bg-slate-50'
                                        }`}>
                                        {preview ? (
                                            <img src={preview} className="h-full w-full object-contain p-4 rounded-3xl" />
                                        ) : (
                                            <>
                                                <Upload size={32} className="text-slate-300" />
                                                <span className="text-[10px] font-black text-slate-400 uppercase">Haz clic para subir imagen</span>
                                            </>
                                        )}
                                        <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                                    </label>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Comentarios para el Cliente</label>
                                    <textarea
                                        value={comentarios}
                                        onChange={e => setComentarios(e.target.value)}
                                        placeholder="Ej: Se ajustaron colores según referencia..."
                                        className="w-full bg-slate-50 border-none rounded-2xl p-4 text-xs font-bold focus:ring-2 focus:ring-blue-600 h-24"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={!file || submitting || orden.estado_diseno === 'Aprobado'}
                                    className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 disabled:opacity-50"
                                >
                                    {submitting ? 'SUBIENDO...' : 'ENVIAR DISEÑO PARA APROBACIÓN'}
                                </button>
                            </form>
                        </div>
                    </div>
                )}

                {/* Historial rápido (Placeholder) */}
                {orden && (
                    <div className="bg-white rounded-3xl border border-slate-100 p-6">
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <FileText size={14} /> Historial de Revisiones
                        </h3>
                        <div className="space-y-3 opacity-50 grayscale italic text-[10px] font-bold py-10 text-center">
                            Próximamente: Historial de comentarios del cliente aparecerá aquí.
                        </div>
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
}
