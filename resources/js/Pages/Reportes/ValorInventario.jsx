import React from 'react';
import { Head, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import ReportFilter from '@/Components/ReportFilter';
import { Boxes, ArrowDownToLine, ArrowUpFromLine, Warehouse } from 'lucide-react';

export default function ValorInventario({ reportData, filtros }) {
    const handleFilter = (newFilters) => {
        router.get(route('reportes.admin.inventario-valor'), newFilters, { preserveState: true });
    };

    const formatCurrency = (value) =>
        new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value || 0);

    const formatNumber = (value) =>
        new Intl.NumberFormat('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(value || 0);

    const items = reportData?.items || [];
    const movimientos = reportData?.movimientos || [];
    const fuenteMovimientos = reportData?.fuente_movimientos || 'reconstruido';
    const resumen = reportData?.resumen || {
        valor_total: 0,
        entradas_periodo: 0,
        salidas_periodo: 0,
        movimientos_periodo: 0,
    };

    return (
        <AuthenticatedLayout>
            <Head title="Valorizacion de Inventario" />

            <div className="max-w-7xl mx-auto py-8 space-y-8">
                <div>
                    <h1 className="text-3xl font-black text-slate-900">Kardex y Valorizacion de Inventario</h1>
                    <p className="text-slate-600 mt-2">
                        Vista valorizada del stock actual con trazabilidad de entradas y salidas de inventario.
                    </p>
                </div>

                <ReportFilter filters={filtros} onFilter={handleFilter} />

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
                        <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mb-4">
                            <Warehouse size={24} />
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Valor Inventario</p>
                        <p className="text-2xl font-black text-slate-900">{formatCurrency(resumen.valor_total)}</p>
                    </div>

                    <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
                        <div className="w-12 h-12 bg-green-100 text-green-600 rounded-2xl flex items-center justify-center mb-4">
                            <ArrowDownToLine size={24} />
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Entradas Periodo</p>
                        <p className="text-2xl font-black text-slate-900">{formatNumber(resumen.entradas_periodo)}</p>
                    </div>

                    <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
                        <div className="w-12 h-12 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mb-4">
                            <ArrowUpFromLine size={24} />
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Salidas Periodo</p>
                        <p className="text-2xl font-black text-slate-900">{formatNumber(resumen.salidas_periodo)}</p>
                    </div>

                    <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
                        <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mb-4">
                            <Boxes size={24} />
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Movimientos Periodo</p>
                        <p className="text-2xl font-black text-slate-900">{formatNumber(resumen.movimientos_periodo)}</p>
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="px-6 py-5 border-b border-slate-100">
                        <h2 className="text-xl font-black text-slate-900">Inventario Valorizado</h2>
                        <p className="text-sm text-slate-500 mt-1">Stock actual y actividad del periodo por articulo.</p>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-900 text-white">
                                <tr>
                                    <th className="px-6 py-4 text-xs font-black uppercase tracking-widest">Codigo</th>
                                    <th className="px-6 py-4 text-xs font-black uppercase tracking-widest">Articulo</th>
                                    <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-right">Stock</th>
                                    <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-right">Costo Prom.</th>
                                    <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-right">Entradas</th>
                                    <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-right">Salidas</th>
                                    <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-right">Neto</th>
                                    <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-right">Valor Total</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {items.map((item) => (
                                    <tr key={item.id} className="hover:bg-slate-50 transition">
                                        <td className="px-6 py-4 text-sm font-black text-blue-600">{item.codigo}</td>
                                        <td className="px-6 py-4 text-sm font-bold text-slate-900">{item.nombre}</td>
                                        <td className="px-6 py-4 text-sm text-right font-bold text-slate-700">{formatNumber(item.stock_actual)}</td>
                                        <td className="px-6 py-4 text-sm text-right text-slate-500">{formatCurrency(item.costo_promedio)}</td>
                                        <td className="px-6 py-4 text-sm text-right font-bold text-green-600">{formatNumber(item.entradas_periodo)}</td>
                                        <td className="px-6 py-4 text-sm text-right font-bold text-red-600">{formatNumber(item.salidas_periodo)}</td>
                                        <td className={`px-6 py-4 text-sm text-right font-black ${Number(item.neto_periodo) >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                                            {formatNumber(item.neto_periodo)}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-right font-black text-slate-900">{formatCurrency(item.valor_total)}</td>
                                    </tr>
                                ))}
                                {items.length === 0 && (
                                    <tr>
                                        <td colSpan="8" className="px-6 py-12 text-center text-slate-400 font-bold">
                                            No hay articulos inventariables para mostrar
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="px-6 py-5 border-b border-slate-100">
                        <h2 className="text-xl font-black text-slate-900">Movimientos del Periodo</h2>
                        <p className="text-sm text-slate-500 mt-1">
                            {fuenteMovimientos === 'persistente'
                                ? 'Kardex persistente registrado desde los movimientos operativos del sistema.'
                                : 'Kardex reconstruido a partir de documentos fuente del sistema.'}
                        </p>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-100">
                                <tr>
                                    <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-slate-600">Fecha</th>
                                    <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-slate-600">Origen</th>
                                    <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-slate-600">Referencia</th>
                                    <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-slate-600">Articulo</th>
                                    <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-right text-slate-600">Cantidad</th>
                                    <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-right text-slate-600">Costo Ref.</th>
                                    <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-right text-slate-600">Valor Ref.</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {movimientos.map((movimiento, index) => (
                                    <tr key={`${movimiento.referencia}-${movimiento.item_id}-${index}`} className="hover:bg-slate-50 transition">
                                        <td className="px-6 py-4 text-sm text-slate-500">{String(movimiento.fecha).slice(0, 10)}</td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex px-2 py-1 rounded-full text-[10px] font-black uppercase ${movimiento.naturaleza === 'Entrada' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                {movimiento.origen}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm font-black text-blue-600">{movimiento.referencia}</td>
                                        <td className="px-6 py-4 text-sm font-bold text-slate-900">
                                            {movimiento.codigo} - {movimiento.nombre}
                                        </td>
                                        <td className={`px-6 py-4 text-sm text-right font-black ${movimiento.naturaleza === 'Entrada' ? 'text-green-600' : 'text-red-600'}`}>
                                            {movimiento.naturaleza === 'Entrada' ? '+' : '-'}{formatNumber(movimiento.cantidad)}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-right text-slate-500">{formatCurrency(movimiento.costo_unitario)}</td>
                                        <td className="px-6 py-4 text-sm text-right font-bold text-slate-900">{formatCurrency(movimiento.valor_movimiento)}</td>
                                    </tr>
                                ))}
                                {movimientos.length === 0 && (
                                    <tr>
                                        <td colSpan="7" className="px-6 py-12 text-center text-slate-400 font-bold">
                                            No hay movimientos de inventario en el periodo seleccionado
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 text-sm text-slate-600">
                    {fuenteMovimientos === 'persistente'
                        ? 'Este reporte ya usa el kardex historico persistente del sistema para mostrar las entradas y salidas del inventario.'
                        : 'Este reporte esta usando una reconstruccion operativa basada en recepciones de compra, facturas de venta y notas de credito mientras se termina de poblar el kardex persistente.'}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
