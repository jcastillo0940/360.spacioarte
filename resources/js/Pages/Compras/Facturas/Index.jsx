import React, { useState, useEffect } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import {
    FileText,
    Plus,
    Search,
    Filter,
    ChevronRight,
    Printer,
    ArrowRight,
    Clock,
    DollarSign,
    CheckCircle2,
    Briefcase,
    AlertTriangle,
    Package
} from 'lucide-react';

export default function Index() {
    const { auth } = usePage().props;
    const [facturas, setFacturas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = () => {
        fetch('/api/compras/facturas')
            .then(res => res.json())
            .then(data => {
                setFacturas(data || []);
                setLoading(false);
            })
            .catch(error => {
                console.error('Error loading facturas:', error);
                setFacturas([]);
                setLoading(false);
            });
    };

    const handleRecibir = (id) => {
        if (confirm('¿Generar ingreso de mercancía a bodega desde esta factura?')) {
            router.post(route('compras.recepciones.crear_desde_factura', id));
        }
    };

    const getStatusStyle = (status) => {
        switch (status) {
            case 'Abierta': return 'bg-orange-100 text-orange-600 border-orange-200';
            case 'Pagada': return 'bg-green-100 text-green-600 border-green-200';
            case 'Anulada': return 'bg-red-100 text-red-600 border-red-200';
            default: return 'bg-slate-100 text-slate-600 border-slate-200';
        }
    };

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
    };

    const filteredFacturas = facturas.filter(f =>
        (f.numero_factura_proveedor?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (f.proveedor?.razon_social?.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const stats = {
        total: facturas.length,
        abiertas: facturas.filter(f => f.estado === 'Abierta').length,
        pagadas: facturas.filter(f => f.estado === 'Pagada').length,
        saldoPendiente: facturas.filter(f => f.estado === 'Abierta').reduce((acc, f) => acc + parseFloat(f.saldo_pendiente || 0), 0)
    };

    return (
        <AuthenticatedLayout>
            <Head title="Facturas de Compra" />

            <div className="max-w-[1400px] mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-xl overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-blue-50 rounded-full -mr-48 -mt-48 z-0 opacity-40"></div>
                    <div className="relative z-10 flex items-center gap-5">
                        <div className="p-4 bg-slate-900 rounded-3xl text-white shadow-2xl shadow-slate-300">
                            <FileText size={32} />
                        </div>
                        <div>
                            <h1 className="text-4xl font-black text-slate-900 tracking-tighter">Facturación Compras</h1>
                            <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.15em] mt-1">Cuentas por Pagar y Provisiones</p>
                        </div>
                    </div>
                </div>

                {/* Dashboard Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Facturas</div>
                        <div className="text-3xl font-black text-slate-900">{stats.total}</div>
                    </div>
                    <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
                        <div className="text-[10px] font-black text-orange-400 uppercase tracking-widest mb-1">Por Pagar</div>
                        <div className="text-3xl font-black text-orange-600">{stats.abiertas}</div>
                    </div>
                    <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
                        <div className="text-[10px] font-black text-green-400 uppercase tracking-widest mb-1">Pagadas</div>
                        <div className="text-3xl font-black text-green-600">{stats.pagadas}</div>
                    </div>
                    <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
                        <div className="text-[10px] font-black text-red-400 uppercase tracking-widest mb-1">Deuda Total</div>
                        <div className="text-2xl font-black text-red-600">{formatCurrency(stats.saldoPendiente)}</div>
                    </div>
                </div>

                {/* Filters & Content */}
                <div className="space-y-6">
                    <div className="bg-white p-4 rounded-[1.5rem] border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center">
                        <div className="relative flex-1">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input
                                type="text"
                                placeholder="Buscar por factura o proveedor..."
                                className="w-full bg-slate-50 border-transparent rounded-xl pl-12 pr-4 py-3 font-bold text-slate-700 focus:ring-slate-900 transition-all border outline-none"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                        {loading ? (
                            <div className="bg-white p-20 rounded-[3rem] border border-slate-200 text-center space-y-4">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900 mx-auto"></div>
                                <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">Cargando cuentas por pagar...</p>
                            </div>
                        ) : filteredFacturas.length === 0 ? (
                            <div className="bg-white p-20 rounded-[3rem] border border-slate-200 text-center space-y-6 shadow-sm">
                                <div className="w-24 h-24 bg-slate-50 rounded-[2rem] flex items-center justify-center mx-auto text-slate-300">
                                    <FileText size={48} />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black text-slate-900 tracking-tighter">Sin facturas registros</h2>
                                    <p className="text-slate-400 font-bold uppercase text-[10px] mt-2 tracking-widest">No hay facturas que coincidan con los criterios</p>
                                </div>
                            </div>
                        ) : (
                            filteredFacturas.map(factura => (
                                <div key={factura.id} className="bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl hover:border-blue-200 transition-all duration-300 group overflow-hidden">
                                    <div className="p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                                        <div className="flex items-center gap-6">
                                            <div className="w-16 h-16 bg-slate-900 text-white rounded-2xl flex flex-col items-center justify-center shadow-lg group-hover:scale-105 transition duration-300">
                                                <span className="text-[10px] font-black opacity-60 uppercase">FAC</span>
                                                <span className="text-lg font-black">{factura.id}</span>
                                            </div>
                                            <div>
                                                <div className="flex flex-wrap items-center gap-3 mb-1">
                                                    <span className="font-black text-slate-900 text-xl tracking-tighter uppercase">{factura.proveedor?.razon_social || 'Proveedor Desconocido'}</span>
                                                    <span className={`px-4 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${getStatusStyle(factura.estado)}`}>
                                                        {factura.estado}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                    <span className="flex items-center gap-1 font-black text-blue-600"><Briefcase size={12} /> {factura.numero_factura_proveedor}</span>
                                                    <span className="flex items-center gap-1"><Clock size={12} /> Emisión: {new Date(factura.fecha_emision).toLocaleDateString()}</span>
                                                    <span className={`flex items-center gap-1 ${new Date(factura.fecha_vencimiento) < new Date() ? 'text-red-500' : ''}`}><AlertTriangle size={12} /> Vence: {new Date(factura.fecha_vencimiento).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex flex-col sm:flex-row items-center gap-8">
                                            <div className="text-center lg:text-right">
                                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Saldo Pendiente</div>
                                                <div className={`text-2xl font-black ${parseFloat(factura.saldo_pendiente) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                                    {formatCurrency(factura.saldo_pendiente)}
                                                </div>
                                                <div className="text-[9px] font-bold text-slate-400 uppercase">Total: {formatCurrency(factura.total)}</div>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <Link
                                                    href={route('compras.facturas.show', factura.id)}
                                                    className="p-3 bg-white text-slate-400 rounded-xl border border-slate-200 hover:text-slate-900 hover:border-slate-900 transition"
                                                    title="Ver Detalle"
                                                >
                                                    <ChevronRight size={20} />
                                                </Link>

                                                <a
                                                    href={route('compras.facturas.pdf', factura.id)}
                                                    target="_blank"
                                                    className="p-3 bg-white text-slate-400 rounded-xl border border-slate-200 hover:text-red-600 hover:border-red-600 transition"
                                                    title="Imprimir Factura"
                                                >
                                                    <Printer size={20} />
                                                </a>

                                                {(factura.estado === 'Abierta') && (
                                                    <Link
                                                        href={route('compras.pagos.create', { factura: factura.id })}
                                                        className="p-3 bg-white text-slate-400 rounded-xl border border-slate-200 hover:text-green-600 hover:border-green-600 transition"
                                                        title="Registrar Pago"
                                                    >
                                                        <DollarSign size={20} />
                                                    </Link>
                                                )}

                                                <button
                                                    onClick={() => handleRecibir(factura.id)}
                                                    className="px-6 py-3 bg-slate-900 text-white rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-blue-600 shadow-lg transition flex items-center gap-2"
                                                >
                                                    <Package size={16} /> Recibir Mercancía
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {factura.orden_compra_id && (
                                        <div className="px-8 py-3 bg-slate-50 border-t border-slate-100 flex items-center gap-2 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                            <CheckCircle2 size={12} className="text-green-500" /> Vinculada a Orden de Compra #{factura.orden_compra_id}
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}