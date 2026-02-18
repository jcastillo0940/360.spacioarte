import React from 'react';
import { Head } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Wallet, Calculator, Store, PieChart } from 'lucide-react';
import { DashboardLayout, ReportCard } from './Shared';

export default function FinancierosDashboard() {
    return (
        <AuthenticatedLayout>
            <Head title="Reportes Financieros" />
            <DashboardLayout
                title="Financieros (Liquidez)"
                description="Análisis de flujo de caja, tesorería y resultados financieros."
            >
                <ReportCard
                    title="Flujo de caja"
                    description="Evolución de movimientos de efectivo y liquidez."
                    icon={Wallet}
                    href={route('reportes.financieros.caja')}
                />
                <ReportCard
                    title="Cuadre de Caja"
                    description="Conciliación diaria de ingresos vs egresos por métodos de pago."
                    icon={Calculator}
                    href={route('reportes.financieros.cuadre-caja')}
                    isNew={true}
                />
                <ReportCard
                    title="Reporte de Cajas"
                    description="Historial de aperturas y cierres de puntos de venta."
                    icon={Store}
                    href={route('reportes.financieros.reporte-cajas')}
                    isNew={true}
                />
                <ReportCard
                    title="Estado de Resultados"
                    description="Análisis de utilidades y pérdidas (P&L)."
                    icon={PieChart}
                    href={route('reportes.financieros.resultados')}
                />
            </DashboardLayout>
        </AuthenticatedLayout>
    );
}
