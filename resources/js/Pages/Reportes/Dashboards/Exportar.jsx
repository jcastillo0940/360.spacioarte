import React from 'react';
import { Head } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { FileSpreadsheet, Briefcase } from 'lucide-react';
import { DashboardLayout, ReportCard } from './Shared';

export default function ExportarDashboard() {
    return (
        <AuthenticatedLayout>
            <Head title="Exportaciones masivas" />
            <DashboardLayout
                title="Para Trabajar (Exportaciones)"
                description="Listados funcionales para análisis externo y contadores."
            >
                <ReportCard
                    title="Exportar facturas"
                    description="Listado plano para procesamiento externo en Excel/CSV."
                    icon={FileSpreadsheet}
                    href={route('reportes.exportar.facturas')}
                />
                <ReportCard
                    title="Informe contador"
                    description="Paquete consolidado de ventas y gastos para cierre de mes."
                    icon={Briefcase}
                    href={route('reportes.exportar.contador')}
                />
            </DashboardLayout>
        </AuthenticatedLayout>
    );
}
