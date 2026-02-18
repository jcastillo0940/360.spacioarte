import React from 'react';
import { Head } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { TrendingUp, Package, Users, BarChart3, UserCheck, History } from 'lucide-react';
import { DashboardLayout, ReportCard } from './Shared';

export default function VentasDashboard() {
    return (
        <AuthenticatedLayout>
            <Head title="Reportes de Ventas" />
            <DashboardLayout
                title="Ventas (Comercial)"
                description="Monitorea el desempeño comercial y estrategias de ventas."
            >
                <ReportCard
                    title="Ventas generales"
                    description="Revisa el desempeño de tus ventas para crear estrategias comerciales."
                    icon={TrendingUp}
                    href={route('reportes.ventas.generales')}
                />
                <ReportCard
                    title="Ventas por ítem"
                    description="Consulta tus ventas detalladas por cada ítem o servicio."
                    icon={Package}
                    href={route('reportes.ventas.items')}
                />
                <ReportCard
                    title="Ventas por clientes"
                    description="Conoce las ventas asociadas a cada uno de tus clientes."
                    icon={Users}
                    href={route('reportes.ventas.clientes')}
                />
                <ReportCard
                    title="Rentabilidad por ítem"
                    description="Conoce la utilidad que generan tus ítems (Venta vs Costo Promedio)."
                    icon={BarChart3}
                    href={route('reportes.ventas.rentabilidad')}
                />
                <ReportCard
                    title="Ventas por vendedor"
                    description="Revisa el resumen de las ventas por agente."
                    icon={UserCheck}
                    href={route('reportes.ventas.vendedores')}
                />
                <ReportCard
                    title="Estado de cuenta cliente"
                    description="Detalle transaccional detallado por cada cliente."
                    icon={History}
                    href={route('reportes.ventas.estado-cuenta-cliente')}
                />
            </DashboardLayout>
        </AuthenticatedLayout>
    );
}
