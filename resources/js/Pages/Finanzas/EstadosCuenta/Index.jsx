import React, { useState, useEffect } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { Search, User, ArrowRight, FileText, Loader2 } from 'lucide-react';

export default function Index({ auth, contactos = [], filters }) {
    // Inicializamos el estado con el filtro que venga de la URL (si existe)
    const [search, setSearch] = useState(filters?.search || '');
    const [loading, setLoading] = useState(false);

    // Efecto de búsqueda automática (Debounce)
    // Evita saturar el servidor con peticiones por cada tecla presionada
    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            // Solo disparamos la petición si el valor ha cambiado realmente
            if (search !== (filters?.search || '')) {
                setLoading(true);
                router.get(
                    route('finanzas.estados-cuenta.index'),
                    { search: search },
                    {
                        preserveState: true,
                        replace: true,
                        only: ['contactos'],
                        onFinish: () => setLoading(false),
                    }
                );
            }
        }, 400); // Espera 400ms después de que el usuario deja de escribir

        return () => clearTimeout(delayDebounceFn);
    }, [search]);

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        setLoading(true);
        router.get(
            route('finanzas.estados-cuenta.index'),
            { search: search },
            { 
                preserveState: true,
                onFinish: () => setLoading(false) 
            }
        );
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<h2 className="font-semibold text-xl text-gray-800 leading-tight">Estados de Cuenta</h2>}
        >
            <Head title="Estados de Cuenta" />

            <div className="py-12 bg-gray-50 min-h-screen">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-xl p-8 border border-gray-100">
                        
                        {/* Encabezado de la sección */}
                        <div className="mb-8">
                            <h3 className="text-2xl font-bold text-gray-900">Seleccionar Contacto</h3>
                            <p className="text-gray-500 mt-1">
                                Busque y seleccione un cliente o proveedor para visualizar su estado de cuenta detallado.
                            </p>
                        </div>

                        {/* Buscador */}
                        <form onSubmit={handleSearchSubmit} className="mb-8">
                            <div className="relative group">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center">
                                    {loading ? (
                                        <Loader2 className="w-5 h-5 text-indigo-600 animate-spin" />
                                    ) : (
                                        <Search className="w-5 h-5 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                                    )}
                                </div>
                                <input
                                    type="text"
                                    placeholder="Ingrese razón social, nombre o identificación (RUC)..."
                                    className="w-full pl-12 pr-4 py-4 bg-gray-50 border-gray-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:bg-white border-none shadow-sm text-lg transition-all"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    autoComplete="off"
                                />
                                <button 
                                    type="submit"
                                    className="absolute right-3 top-1/2 -translate-y-1/2 bg-gray-900 text-white px-6 py-2 rounded-xl text-sm font-medium hover:bg-indigo-600 transition-colors shadow-md"
                                >
                                    Buscar
                                </button>
                            </div>
                        </form>

                        {/* Listado de Contactos */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {contactos && contactos.length > 0 ? (
                                contactos.map((contacto) => (
                                    <Link
                                        key={contacto.id}
                                        href={route('finanzas.estado-cuenta', contacto.id)}
                                        className="group p-5 bg-white border border-gray-100 rounded-2xl hover:border-indigo-300 hover:shadow-xl hover:shadow-indigo-500/5 transition-all flex items-center justify-between"
                                    >
                                        <div className="flex items-center space-x-4 overflow-hidden">
                                            <div className="bg-indigo-50 p-3 rounded-2xl group-hover:bg-indigo-600 transition-colors duration-300">
                                                <User className="text-indigo-600 group-hover:text-white w-6 h-6 transition-colors" />
                                            </div>
                                            <div className="overflow-hidden">
                                                <h4 className="font-bold text-gray-800 group-hover:text-indigo-600 truncate transition-colors">
                                                    {contacto.razon_social}
                                                </h4>
                                                <p className="text-xs text-gray-400 font-mono mt-0.5 tracking-wider">
                                                    ID: {contacto.identificacion}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="ml-4 flex-shrink-0">
                                            <ArrowRight className="text-gray-300 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all w-5 h-5" />
                                        </div>
                                    </Link>
                                ))
                            ) : (
                                <div className="col-span-full py-20 text-center bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                                    <div className="bg-white w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                                        <FileText className="h-10 w-10 text-gray-300" />
                                    </div>
                                    <h4 className="text-gray-900 font-semibold text-lg">No hay resultados</h4>
                                    <p className="text-gray-500 max-w-xs mx-auto mt-2">
                                        No pudimos encontrar contactos que coincidan con su búsqueda. Intente con otros términos.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}