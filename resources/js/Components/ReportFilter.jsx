import React from 'react';
import { useForm } from '@inertiajs/react';
import { Calendar, Search, FileDown } from 'lucide-react';

const ReportFilter = ({ filters, onFilter }) => {
    const handlePreset = (type) => {
        const now = new Date();
        let start, end;

        switch (type) {
            case 'este_mes':
                start = new Date(now.getFullYear(), now.getMonth(), 1);
                end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                break;
            case 'este_anio':
                start = new Date(now.getFullYear(), 0, 1);
                end = new Date(now.getFullYear(), 11, 31);
                break;
            case 'trimestre':
                const quarter = Math.floor(now.getMonth() / 3);
                start = new Date(now.getFullYear(), quarter * 3, 1);
                end = new Date(now.getFullYear(), (quarter + 1) * 3, 0);
                break;
            case 'semestre':
                const semester = now.getMonth() < 6 ? 0 : 6;
                start = new Date(now.getFullYear(), semester, 1);
                end = new Date(now.getFullYear(), semester + 6, 0);
                break;
            case 'ultimos_6':
                start = new Date(now.getFullYear(), now.getMonth() - 6, 1);
                end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                break;
            default:
                return;
        }

        onFilter({
            fecha_inicio: start.toISOString().split('T')[0],
            fecha_fin: end.toISOString().split('T')[0],
        });
    };

    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 mb-8">
            <div className="flex flex-wrap items-end gap-6">
                <div>
                    <label className="block text-xs font-black uppercase text-slate-500 mb-2 tracking-widest flex items-center gap-2">
                        <Calendar size={14} /> Fecha Inicio
                    </label>
                    <input
                        type="date"
                        value={filters.fecha_inicio}
                        onChange={e => onFilter({ ...filters, fecha_inicio: e.target.value })}
                        className="w-full px-4 py-2 rounded-xl border-slate-200 bg-slate-50 font-bold text-slate-700 focus:bg-white transition"
                    />
                </div>
                <div>
                    <label className="block text-xs font-black uppercase text-slate-500 mb-2 tracking-widest flex items-center gap-2">
                        <Calendar size={14} /> Fecha Fin
                    </label>
                    <input
                        type="date"
                        value={filters.fecha_fin}
                        onChange={e => onFilter({ ...filters, fecha_fin: e.target.value })}
                        className="w-full px-4 py-2 rounded-xl border-slate-200 bg-slate-50 font-bold text-slate-700 focus:bg-white transition"
                    />
                </div>

                <div className="flex-1 flex flex-wrap gap-2">
                    <button
                        onClick={() => handlePreset('este_mes')}
                        className="px-4 py-2 text-xs font-black uppercase bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-lg transition"
                    >
                        Este Mes
                    </button>
                    <button
                        onClick={() => handlePreset('trimestre')}
                        className="px-4 py-2 text-xs font-black uppercase bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-lg transition"
                    >
                        Este Trimestre
                    </button>
                    <button
                        onClick={() => handlePreset('semestre')}
                        className="px-4 py-2 text-xs font-black uppercase bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-lg transition"
                    >
                        Este Semestre
                    </button>
                    <button
                        onClick={() => handlePreset('este_anio')}
                        className="px-4 py-2 text-xs font-black uppercase bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-lg transition"
                    >
                        Este Año
                    </button>
                    <button
                        onClick={() => handlePreset('ultimos_6')}
                        className="px-4 py-2 text-xs font-black uppercase bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-lg transition"
                    >
                        Últimos 6 meses
                    </button>
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={() => {
                            const url = new URL(window.location.href);
                            url.searchParams.set('export_pdf', '1');
                            url.searchParams.set('fecha_inicio', filters.fecha_inicio);
                            url.searchParams.set('fecha_fin', filters.fecha_fin);
                            window.open(url.toString(), '_blank');
                        }}
                        className="p-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition flex items-center gap-2"
                    >
                        <FileDown size={18} />
                        PDF
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ReportFilter;
