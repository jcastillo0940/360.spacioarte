import React from 'react';
import { Head } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { CreditCard, Truck, ArrowUpDown, Boxes, Repeat, ShoppingCart, CalendarDays } from 'lucide-react';
import { DashboardLayout, ReportCard } from './Shared';

export default function AdministrativosDashboard() {
    return (
        <AuthenticatedLayout>
            <Head title="Reportes Administrativos" />
            <DashboardLayout
                title="Administrativos (Operativo)"
                description="Control operativo, inventarios y compromisos administrativos."
            >
                <ReportCard
                    title="Cuentas por cobrar"
                    description="Controla el vencimiento y cobro de facturas a crédito."
                    icon={CreditCard}
                    href={route('reportes.admin.cxc')}
                />
                <ReportCard
                    title="Cuentas por pagar"
                    description="Controla deudas y pagos pendientes a proveedores."
                    icon={Truck}
                    href={route('reportes.admin.cxp')}
                />
                <ReportCard
                    title="Ingresos y gastos"
                    description="Valores asociados a cuentas de ingresos y egresos."
                    icon={ArrowUpDown}
                    href={route('reportes.admin.ingresos-gastos')}
                />
                <ReportCard
                    title="Valor de inventario"
                    description="Stock actual, cantidad y costo promedio."
                    icon={Boxes}
                    href={route('reportes.admin.inventario-valor')}
                />
                <ReportCard
                    title="Transacciones"
                    description="Movimientos de dinero registrados en el sistema."
                    icon={Repeat}
                    href={route('reportes.admin.transacciones')}
                />
                <ReportCard
                    title="Compras"
                    description="Facturas de compra registradas de proveedores."
                    icon={ShoppingCart}
                    href={route('reportes.admin.compras')}
                />
                <ReportCard
                    title="Reporte anual"
                    description="Rendimiento consolidado del negocio por año."
                    icon={CalendarDays}
                    href={route('reportes.admin.anual')}
                />
            </DashboardLayout>
        </AuthenticatedLayout>
    );
}
