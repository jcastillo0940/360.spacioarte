import React, { useState } from 'react';
import { Head, useForm, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import {
    Users,
    UserPlus,
    Shield,
    Mail,
    Search,
    Edit,
    Trash2,
    Key,
    UserCheck,
    AlertCircle,
    Check
} from 'lucide-react';

export default function Index({ users, roles }) {
    const { auth } = usePage().props;
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    const { data, setData, post, put, delete: destroy, processing, reset, errors } = useForm({
        name: '',
        email: '',
        password: '',
        roles: []
    });

    const handleOpenModal = (user = null) => {
        reset();
        if (user) {
            setEditingUser(user);
            setData({
                name: user.name,
                email: user.email,
                password: '',
                roles: user.roles.map(r => r.name)
            });
        } else {
            setEditingUser(null);
        }
        setIsModalOpen(true);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (editingUser) {
            put(route('usuarios.update', editingUser.id), {
                onSuccess: () => {
                    setIsModalOpen(false);
                    reset();
                }
            });
        } else {
            post(route('usuarios.store'), {
                onSuccess: () => {
                    setIsModalOpen(false);
                    reset();
                }
            });
        }
    };

    const handleDelete = (user) => {
        if (confirm(`¿Estás seguro de eliminar al usuario ${user.name}?`)) {
            destroy(route('usuarios.destroy', user.id));
        }
    };

    const toggleRole = (roleName) => {
        const currentRoles = [...data.roles];
        if (currentRoles.includes(roleName)) {
            setData('roles', currentRoles.filter(r => r !== roleName));
        } else {
            setData('roles', [...currentRoles, roleName]);
        }
    };

    const filteredUsers = users.filter(u =>
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <AuthenticatedLayout>
            <Head title="Gestión de Usuarios y Accesos" />

            <div className="max-w-[1400px] mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
                {/* Header Premium */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-xl overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-blue-50 rounded-full -mr-48 -mt-48 z-0 opacity-40"></div>
                    <div className="relative z-10 flex items-center gap-5">
                        <div className="p-4 bg-slate-900 rounded-3xl text-white shadow-2xl shadow-slate-300">
                            <Users size={32} />
                        </div>
                        <div>
                            <h1 className="text-4xl font-black text-slate-900 tracking-tighter">Control de Accesos</h1>
                            <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.2em] mt-1">Gestión de Usuarios y Roles del Sistema</p>
                        </div>
                    </div>
                    <button
                        onClick={() => handleOpenModal()}
                        className="relative z-10 bg-slate-900 text-white px-8 py-4 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-blue-600 hover:scale-105 active:scale-95 transition-all flex items-center gap-3 shadow-xl shadow-slate-200"
                    >
                        <UserPlus size={20} /> Nuevo Colaborador
                    </button>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
                    {/* Buscador & Stats Sidebar */}
                    <div className="space-y-6">
                        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input
                                    type="text"
                                    placeholder="Buscar por nombre o correo..."
                                    className="w-full bg-slate-50 border-transparent rounded-2xl pl-12 pr-4 py-3 font-bold text-slate-700 focus:ring-slate-900 transition-all border outline-none"
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                />
                            </div>

                            <div className="space-y-4">
                                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Estadísticas Rápidas</h3>
                                <div className="grid grid-cols-1 gap-2">
                                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex justify-between items-center">
                                        <div className="flex items-center gap-2">
                                            <UserCheck size={16} className="text-slate-400" />
                                            <span className="text-[10px] font-black text-slate-600 uppercase">Activos</span>
                                        </div>
                                        <span className="font-black text-slate-900">{users.length}</span>
                                    </div>
                                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex justify-between items-center">
                                        <div className="flex items-center gap-2">
                                            <Shield size={16} className="text-slate-400" />
                                            <span className="text-[10px] font-black text-slate-600 uppercase">Roles Definidos</span>
                                        </div>
                                        <span className="font-black text-slate-900">{roles.length}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Tip de Seguridad */}
                        <div className="bg-blue-600 p-8 rounded-[2rem] text-white shadow-xl shadow-blue-200 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700"></div>
                            <Shield className="mb-4 text-blue-200" size={32} />
                            <h3 className="text-lg font-black tracking-tight leading-tight">Principio de Menor Privilegio</h3>
                            <p className="text-blue-100 text-[10px] mt-2 font-bold uppercase tracking-widest leading-relaxed">Asigne solo los roles estrictamente necesarios para cada operación de planta.</p>
                        </div>
                    </div>

                    {/* Tabla de Usuarios */}
                    <div className="xl:col-span-3 space-y-6">
                        <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50/50 border-b border-slate-100">
                                    <tr>
                                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Colaborador</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Roles Asignados</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {filteredUsers.map(user => (
                                        <tr key={user.id} className="hover:bg-slate-50/50 transition-colors group">
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white font-black text-lg shadow-lg group-hover:scale-110 transition duration-300 capitalize">
                                                        {user.name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <div className="font-black text-slate-900 text-lg tracking-tighter capitalize">{user.name}</div>
                                                        <div className="text-xs font-bold text-slate-400 flex items-center gap-1.5 lowercase">
                                                            <Mail size={12} /> {user.email}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex flex-wrap gap-2 justify-center">
                                                    {user.roles.map(role => (
                                                        <span key={role.id} className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-[9px] font-black uppercase tracking-widest border border-blue-100">
                                                            {role.name}
                                                        </span>
                                                    ))}
                                                    {user.roles.length === 0 && (
                                                        <span className="text-slate-300 text-[9px] font-black uppercase tracking-widest italic tracking-tighter">Sin Roles</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        onClick={() => handleOpenModal(user)}
                                                        className="p-3 bg-white text-slate-400 rounded-xl border border-slate-200 hover:text-blue-600 hover:border-blue-600 transition shadow-sm hover:shadow-md"
                                                        title="Editar Usuario"
                                                    >
                                                        <Edit size={18} />
                                                    </button>
                                                    {user.id !== auth.user.id && (
                                                        <button
                                                            onClick={() => handleDelete(user)}
                                                            className="p-3 bg-white text-slate-400 rounded-xl border border-slate-200 hover:text-red-600 hover:border-red-600 transition shadow-sm hover:shadow-md"
                                                            title="Eliminar Usuario"
                                                        >
                                                            <Trash2 size={18} />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {filteredUsers.length === 0 && (
                                <div className="p-20 text-center space-y-4">
                                    <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto text-slate-300">
                                        <Search size={40} />
                                    </div>
                                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">No se encontraron usuarios con esos criterios</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal Formulario Premium */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-[3rem] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
                        {/* Modal Header */}
                        <div className="p-8 border-b border-slate-100 bg-slate-900 text-white flex justify-between items-center relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32"></div>
                            <div className="relative z-10 flex items-center gap-4">
                                <div className="p-3 bg-blue-500 rounded-2xl text-white">
                                    {editingUser ? <Edit size={22} /> : <UserPlus size={22} />}
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black uppercase tracking-tighter">
                                        {editingUser ? 'Editar Colaborador' : 'Registrar Colaborador'}
                                    </h2>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Control de Identidad y Roles</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="relative z-10 text-slate-400 hover:text-white transition p-2 hover:bg-white/10 rounded-xl"
                            >
                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto flex flex-col">
                            <div className="p-8 space-y-10">
                                {/* Datos Básicos */}
                                <div className="space-y-6">
                                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 ml-1">
                                        <Users size={14} className="text-blue-500" /> Información de Cuenta
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">Nombre Completo</label>
                                            <input
                                                type="text"
                                                required
                                                value={data.name}
                                                onChange={e => setData('name', e.target.value)}
                                                className={`w-full bg-slate-50 border-slate-100 rounded-2xl px-6 py-4 font-bold text-slate-800 focus:ring-slate-900 transition border ${errors.name ? 'border-red-500 bg-red-50' : ''}`}
                                                placeholder="Ej. Juan Pérez"
                                            />
                                            {errors.name && <p className="text-red-500 text-[9px] font-black uppercase mt-1 ml-1">{errors.name}</p>}
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">Correo Electrónico</label>
                                            <input
                                                type="email"
                                                required
                                                value={data.email}
                                                onChange={e => setData('email', e.target.value)}
                                                className={`w-full bg-slate-50 border-slate-100 rounded-2xl px-6 py-4 font-bold text-slate-800 focus:ring-slate-900 transition border ${errors.email ? 'border-red-500 bg-red-50' : ''}`}
                                                placeholder="usuario@tuempresa.com"
                                            />
                                            {errors.email && <p className="text-red-500 text-[9px] font-black uppercase mt-1 ml-1">{errors.email}</p>}
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1 flex items-center gap-2">
                                            <Key size={12} /> {editingUser ? 'Nueva Contraseña (Opcional)' : 'Contraseña de Acceso'}
                                        </label>
                                        <input
                                            type="password"
                                            required={!editingUser}
                                            value={data.password}
                                            onChange={e => setData('password', e.target.value)}
                                            className={`w-full bg-slate-50 border-slate-100 rounded-2xl px-6 py-4 font-bold text-slate-800 focus:ring-slate-900 transition border ${errors.password ? 'border-red-500 bg-red-50' : ''}`}
                                            placeholder="Mínimo 8 caracteres"
                                        />
                                        {errors.password && <p className="text-red-500 text-[9px] font-black uppercase mt-1 ml-1">{errors.password}</p>}
                                    </div>
                                </div>

                                {/* Selección de Roles */}
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between ml-1">
                                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                            <Shield size={14} className="text-blue-500" /> Asignación de Roles / Permisos
                                        </h3>
                                        <span className={`text-[9px] font-black uppercase px-3 py-1 rounded-full ${data.roles.length > 0 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                            {data.roles.length} Seleccionados
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                        {roles.map(role => (
                                            <div
                                                key={role.id}
                                                onClick={() => toggleRole(role.name)}
                                                className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between group ${data.roles.includes(role.name)
                                                        ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-100'
                                                        : 'bg-white border-slate-100 text-slate-600 hover:border-blue-200'
                                                    }`}
                                            >
                                                <div className="flex flex-col">
                                                    <span className="text-[11px] font-black uppercase tracking-widest leading-none">{role.name}</span>
                                                    <span className={`text-[9px] font-bold mt-1 ${data.roles.includes(role.name) ? 'text-blue-100' : 'text-slate-400'}`}>
                                                        {role.name === 'Administrador Total' ? 'Acceso Global' : 'Permisos Específicos'}
                                                    </span>
                                                </div>
                                                <div className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all ${data.roles.includes(role.name) ? 'bg-white text-blue-600 scale-110' : 'bg-slate-50 text-transparent'
                                                    }`}>
                                                    <Check size={16} strokeWidth={4} />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    {errors.roles && <p className="text-red-500 text-[9px] font-black uppercase mt-1 ml-1">Debes seleccionar al menos un rol.</p>}
                                </div>
                            </div>

                            {/* Footer Modal */}
                            <div className="p-8 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row gap-4 mt-auto">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 bg-white border-b-4 border-slate-200 active:border-b-0 active:translate-y-1 text-slate-500 py-4 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-slate-100 transition-all shadow-lg"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="flex-1 bg-slate-900 border-b-4 border-slate-700 active:border-b-0 active:translate-y-1 text-white py-4 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-blue-600 hover:border-blue-800 transition-all flex items-center justify-center gap-3 shadow-xl disabled:opacity-50"
                                >
                                    {processing ? 'Procesando...' : (editingUser ? 'Actualizar Colaborador' : 'Crear Colaborador')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
