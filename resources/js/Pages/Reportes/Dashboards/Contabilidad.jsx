import React from 'react';
import { Head } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Landmark, Percent, BookOpen, CreditCard } from 'lucide-react';
import { DashboardLayout, ReportCard } from './Shared';

export default function ContabilidadDashboard() {
    return (
        <AuthenticatedLayout>
            <Head title="Reportes Contables" />
            <DashboardLayout
                title="Contables (Estados Financieros)"
                description="Información estructurada para contabilidad y fiscalidad."
            >
                <ReportCard
                    title="Situación Financiera"
                    description="Balance General: Activos, Pasivos y Patrimonio."
                    icon={Landmark}
                    href={route('reportes.contabilidad.balance-general')}
                />
                <ReportCard
                    title="Impuestos y retenciones"
                    description="Reporte ITBMS (Panamá) y retenciones fiscales."
                    icon={Percent}
                    href={route('reportes.contabilidad.impuestos')}
                />
                <ReportCard
                    title="Libro Diario / Comprobación"
                    description="Auxiliares por tercero y saldos acumulados."
                    icon={BookOpen}
                    href={route('reportes.contabilidad.libro-diario')}
                />
                <ReportCard
                    title="Detalle de formas de pago"
                    description="Desglose de recaudación por tipo (Banco/Caja)."
                    icon={CreditCard}
                    href={route('reportes.contabilidad.formas-pago')}
                />
            </DashboardLayout>
        </AuthenticatedLayout>
    );
}
