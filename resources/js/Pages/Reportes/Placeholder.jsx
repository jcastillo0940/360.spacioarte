import React from 'react';
import { Head, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Construction } from 'lucide-react';

export default function Placeholder({ report }) {
    return (
        <AuthenticatedLayout>
            <Head title="En Desarrollo" />

            <div className="max-w-4xl mx-auto py-24 text-center">
                <div className="inline-flex p-6 bg-orange-100 text-orange-600 rounded-full mb-6">
                    <Construction size={48} />
                </div>
                <h1 className="text-4xl font-black text-slate-900 mb-4">Reporte en Desarrollo</h1>
                <p className="text-slate-600 text-lg mb-8">
                    El reporte <span className="font-bold text-slate-900">"{report}"</span> está siendo procesado por nuestro equipo de datos.
                    Estará disponible en la próxima actualización del sistema.
                </p>
                <Link
                    href={route('reportes.index')}
                    className="px-8 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition"
                >
                    Volver al Centro de Reportes
                </Link>
            </div>
        </AuthenticatedLayout>
    );
}
