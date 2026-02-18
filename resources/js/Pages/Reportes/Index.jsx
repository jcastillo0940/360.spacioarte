import React from 'react';
import { Head, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import {
    TrendingUp,
    Admin,
    Landmark,
    PieChart,
    Download,
    ChevronRight,
    Search
} from 'lucide-react';

const MasterViewCard = ({ title, description, href, icon: Icon, colorClass }) => (
    <Link
        href={href}
        className="group bg-white p-8 rounded-3xl shadow-sm border border-slate-200 hover:border-blue-500 hover:shadow-xl transition-all relative overflow-hidden flex flex-col h-full"
    >
        <div className={`w-16 h-16 rounded-2xl ${colorClass} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
            <Icon size={32} className="text-white" />
        </div>
        <h3 className="text-2xl font-black text-slate-900 group-hover:text-blue-600 transition-colors">{title}</h3>
        <p className="text-slate-500 mt-3 flex-1 leading-relaxed">
            {description}
        </p>
        <div className="mt-6 flex items-center gap-2 text-blue-600 font-black text-sm uppercase tracking-widest">
            Explorar Reportes <ChevronRight size={16} />
        </div>
        <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-slate-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
    </Link>
);

export default function Index() {
    return (
        <AuthenticatedLayout>
            <Head title="Centro de Inteligencia de Negocios" />

            <div className="max-w-7xl mx-auto py-12">
                <div className="mb-16">
                    <h1 className="text-5xl font-black text-slate-900 tracking-tight">Centro de Reportes</h1>
                    <p className="text-slate-500 text-xl mt-4 max-w-2xl font-medium leading-relaxed">
                        Selecciona una categoría maestra para gestionar los indicadores clave de rendimiento (KPIs) de Spacio Arte.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    <MasterViewCard
                        title="Ventas"
                        description="Ventas generales, por ítem, rentabilidad y ranking de clientes."
                        icon={TrendingUp}
                        href={route('reportes.ventas.index')}
                        colorClass="bg-blue-600"
                    />
                    <MasterViewCard
                        title="Administrativos"
                        description="Cartera de cobro (CxC), deudas (CxP), inventario y compras."
                        icon={Search}
                        href={route('reportes.admin.index')}
                        colorClass="bg-slate-900"
                    />
                    <MasterViewCard
                        title="Financieros"
                        description="Flujo de caja, cuadres de caja y estados de resultados (P&L)."
                        icon={PieChart}
                        href={route('reportes.financieros.index')}
                        colorClass="bg-emerald-600"
                    />
                    <MasterViewCard
                        title="Contabilidad"
                        description="Balance General, Impuestos ITBMS, Libro Diario y Comprobación."
                        icon={Landmark}
                        href={route('reportes.contabilidad.index')}
                        colorClass="bg-indigo-600"
                    />
                    <MasterViewCard
                        title="Exportar Datos"
                        description="Envío masivo de datos para auditoría externa y contadores."
                        icon={Download}
                        href={route('reportes.exportar.index')}
                        colorClass="bg-orange-600"
                    />
                </div>

                <div className="mt-20 p-10 bg-slate-900 rounded-[40px] text-white flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="max-w-xl">
                        <h2 className="text-3xl font-black mb-4">¿Necesitas un reporte personalizado?</h2>
                        <p className="text-slate-400 font-medium">Nuestro equipo de datos puede estructurar consultas específicas para tus necesidades operativas.</p>
                    </div>
                    <button className="px-8 py-4 bg-white text-slate-900 rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-blue-400 hover:text-white transition-all">
                        Solicitar Soporte
                    </button>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
