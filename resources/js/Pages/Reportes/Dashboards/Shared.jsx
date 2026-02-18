import React from 'react';
import { Link } from '@inertiajs/react';

export const ReportCard = ({ title, description, icon: Icon, href, isNew }) => (
    <Link
        href={href}
        className="group bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:border-blue-500 hover:shadow-md transition-all relative overflow-hidden"
    >
        <div className="flex items-start gap-4">
            <div className={`p-3 rounded-xl bg-slate-50 group-hover:bg-blue-50 text-slate-600 group-hover:text-blue-600 transition-colors`}>
                <Icon size={24} />
            </div>
            <div className="flex-1">
                <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{title}</h3>
                    {isNew && (
                        <span className="px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-black uppercase rounded-full">
                            ¡NUEVO!
                        </span>
                    )}
                </div>
                <p className="text-slate-500 text-sm mt-1 leading-relaxed">
                    {description}
                </p>
            </div>
        </div>
        <div className="absolute top-0 right-0 w-32 h-32 bg-slate-100 rounded-full -mr-16 -mt-16 opacity-0 group-hover:opacity-20 transition-opacity" />
    </Link>
);

export const DashboardLayout = ({ title, description, children }) => (
    <div className="max-w-7xl mx-auto py-8">
        <div className="mb-10">
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">{title}</h1>
            <p className="text-slate-500 text-lg mt-2 font-medium">{description}</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {children}
        </div>
    </div>
);
