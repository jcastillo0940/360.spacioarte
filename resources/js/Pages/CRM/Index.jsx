import React from 'react';
import { Head } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

export default function Index() {
    return (
        <AuthenticatedLayout>
            <Head title="CRM" />

            <div className="max-w-6xl mx-auto px-4 py-8">
                <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8">
                    <h1 className="text-3xl font-black text-slate-900">CRM</h1>
                    <p className="text-slate-600 mt-3">
                        El backend de pipelines, etapas y leads ya está habilitado. Falta montar la UI Kanban sobre estos endpoints.
                    </p>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
