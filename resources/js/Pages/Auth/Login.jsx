import React from 'react';
import { Head, useForm } from '@inertiajs/react';

export default function Login() {
    const { data, setData, post, processing, errors } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    const submit = (e) => {
        e.preventDefault();
        post('/login');
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-900 px-4">
            <Head title="Iniciar Sesión - ERP" />

            <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl overflow-hidden">
                <div className="p-8">
                    <div className="text-center mb-10">
                        <div className="inline-block p-4 bg-blue-600 rounded-2xl mb-4 shadow-lg shadow-blue-200">
                            <span className="text-3xl">🚀</span>
                        </div>
                        <h1 className="text-3xl font-black text-slate-800">ERP Pro</h1>
                        <p className="text-slate-500 font-medium">Gestión Empresarial Panamá</p>
                    </div>

                    <form onSubmit={submit} className="space-y-6">
                        <div>
                            <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Correo Electrónico</label>
                            <input
                                type="email"
                                className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 transition"
                                value={data.email}
                                onChange={(e) => setData('email', e.target.value)}
                                placeholder="usuario@empresa.com"
                                required
                            />
                            {errors.email && <p className="text-red-500 text-xs mt-1 font-bold">{errors.email}</p>}
                        </div>

                        <div>
                            <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Contraseña</label>
                            <input
                                type="password"
                                className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 transition"
                                value={data.password}
                                onChange={(e) => setData('password', e.target.value)}
                                required
                            />
                            {errors.password && <p className="text-red-500 text-xs mt-1 font-bold">{errors.password}</p>}
                        </div>

                        <div className="flex items-center">
                            <input
                                type="checkbox"
                                className="rounded text-blue-600 border-slate-300 shadow-sm focus:ring-blue-500"
                                checked={data.remember}
                                onChange={(e) => setData('remember', e.target.checked)}
                            />
                            <span className="ml-2 text-sm text-slate-600">Recordarme en este equipo</span>
                        </div>

                        <button
                            type="submit"
                            disabled={processing}
                            className="w-full bg-slate-900 text-white py-4 rounded-xl font-black uppercase tracking-widest hover:bg-blue-600 transition-all duration-300 shadow-lg disabled:opacity-50"
                        >
                            {processing ? 'Verificando...' : 'Entrar al Sistema'}
                        </button>
                    </form>
                </div>

                <div className="bg-slate-50 p-6 text-center border-t border-slate-100">
                    <p className="text-xs text-slate-400 font-medium">
                        &copy; 2026 ERP Solutions Panamá - Todos los derechos reservados.
                    </p>
                </div>
            </div>
        </div>
    );
}