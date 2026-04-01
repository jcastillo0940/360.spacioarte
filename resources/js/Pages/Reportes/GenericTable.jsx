import React, { useMemo, useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import ReportFilter from '@/Components/ReportFilter';

const formatCurrency = (value) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(value || 0));

const formatValue = (value, type) => {
    if (type === 'currency') {
        return formatCurrency(value);
    }

    if (value === null || value === undefined || value === '') {
        return '-';
    }

    return value;
};

export default function GenericTable({
    title,
    description,
    routeName,
    columns = [],
    reportData = [],
    filtros = {},
    summaryCards = [],
}) {
    const [rows, setRows] = useState(reportData);

    const normalizedFilters = useMemo(() => ({
        fecha_inicio: filtros.fecha_inicio || (filtros.year ? `${filtros.year}-01-01` : ''),
        fecha_fin: filtros.fecha_fin || (filtros.year ? `${filtros.year}-12-31` : ''),
        year: filtros.year,
    }), [filtros]);

    const handleFilter = (newFilters) => {
        router.get(route(routeName), { ...newFilters, year: normalizedFilters.year }, {
            preserveState: true,
            replace: true,
            onSuccess: (page) => setRows(page.props.reportData ?? []),
        });
    };

    return (
        <AuthenticatedLayout>
            <Head title={title} />

            <div className="max-w-7xl mx-auto py-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-black text-slate-900">{title}</h1>
                    <p className="text-slate-600 mt-2">{description}</p>
                </div>

                <ReportFilter filters={normalizedFilters} onFilter={handleFilter} />

                {summaryCards.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
                        {summaryCards.map((card) => (
                            <div key={card.label} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                                <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">{card.label}</p>
                                <p className="mt-3 text-2xl font-black text-slate-900">
                                    {formatValue(card.value, card.type)}
                                </p>
                            </div>
                        ))}
                    </div>
                )}

                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-900 text-white">
                                <tr>
                                    {columns.map((column) => (
                                        <th
                                            key={column.key}
                                            className={`px-6 py-4 text-xs font-black uppercase tracking-widest ${column.type === 'currency' ? 'text-right' : ''}`}
                                        >
                                            {column.label}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {rows.map((row, index) => (
                                    <tr key={`${index}-${row.id ?? row.codigo ?? row.referencia ?? 'row'}`} className="hover:bg-slate-50 transition">
                                        {columns.map((column) => (
                                            <td
                                                key={`${index}-${column.key}`}
                                                className={`px-6 py-4 text-sm text-slate-700 ${column.type === 'currency' ? 'text-right font-bold text-slate-900' : ''}`}
                                            >
                                                {formatValue(row[column.key], column.type)}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                                {rows.length === 0 && (
                                    <tr>
                                        <td colSpan={columns.length} className="px-6 py-12 text-center text-slate-400 font-bold">
                                            No hay datos para el periodo seleccionado
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
