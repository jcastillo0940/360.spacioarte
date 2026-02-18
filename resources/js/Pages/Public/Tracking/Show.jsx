import React, { useState, useEffect, useRef } from 'react';
import { Head, router } from '@inertiajs/react';
import Pusher from 'pusher-js';
import axios from 'axios';
import {
    MessageSquare,
    Send,
    CheckCircle,
    Package,
    AlertCircle,
    XCircle,
    ChevronRight,
    UploadCloud,
    CreditCard,
    FileText,
    Clock
} from 'lucide-react';

// =========================================================================
// COMPONENTE: FONDO ESPACIAL INMERSIVO 3D (Blanco y Negro)
// =========================================================================
function SpaceBackground() {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        let animFrameId;
        let W, H;

        const resize = () => {
            W = canvas.width = window.innerWidth;
            H = canvas.height = window.innerHeight;
        };
        resize();
        window.addEventListener('resize', resize);

        const MAX_DEPTH = 2000;
        const STAR_COUNT = 800;
        const GALAXY_COUNT = 6;

        // --- Generar Estrellas ---
        const stars = Array.from({ length: STAR_COUNT }, () => ({
            x: (Math.random() - 0.5) * 4000,
            y: (Math.random() - 0.5) * 4000,
            z: Math.random() * MAX_DEPTH,
            size: 0.5 + Math.random() * 1.5,
        }));

        // --- Generar Galaxias/Supernovas ---
        const galaxies = Array.from({ length: GALAXY_COUNT }, () => ({
            x: (Math.random() - 0.5) * 2000,
            y: (Math.random() - 0.5) * 2000,
            z: Math.random() * MAX_DEPTH,
            radius: 200 + Math.random() * 400,
            angle: Math.random() * Math.PI * 2,
            speed: 0.001 + Math.random() * 0.002,
        }));

        const drawBackground = () => {
            ctx.fillStyle = '#000000';
            ctx.fillRect(0, 0, W, H);
        };

        const animate = () => {
            ctx.clearRect(0, 0, W, H);
            drawBackground();

            const cx = W / 2;
            const cy = H / 2;
            const fov = 350; // Campo de visión (sensación de profundidad)
            const speed = 4; // Velocidad de avance

            // --- Dibujar Galaxias/Supernovas ---
            galaxies.forEach(g => {
                g.z -= speed * 0.5; // Las galaxias se mueven un poco más lento por paralaje
                if (g.z <= 0) {
                    g.z = MAX_DEPTH;
                    g.x = (Math.random() - 0.5) * 2000;
                    g.y = (Math.random() - 0.5) * 2000;
                }

                const scale = fov / g.z;
                const x2d = g.x * scale + cx;
                const y2d = g.y * scale + cy;
                const r2d = g.radius * scale;

                // Solo dibujar si está en pantalla y no es gigante (evitar sobrecarga)
                if (x2d > -r2d && x2d < W + r2d && y2d > -r2d && y2d < H + r2d && r2d < W * 2) {
                    ctx.save();
                    ctx.translate(x2d, y2d);

                    // Rotación lenta de la galaxia
                    g.angle += g.speed;
                    ctx.rotate(g.angle);

                    // Opacidad basada en la distancia (Aparece a lo lejos, se desvanece al acercarse mucho)
                    let opacity = (1 - (g.z / MAX_DEPTH)) * (g.z / 300);
                    if (opacity > 0.4) opacity = 0.4;
                    if (opacity < 0) opacity = 0;

                    const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, r2d);
                    grad.addColorStop(0, `rgba(255, 255, 255, ${opacity})`);
                    grad.addColorStop(0.2, `rgba(200, 200, 200, ${opacity * 0.5})`);
                    grad.addColorStop(1, 'transparent');

                    ctx.fillStyle = grad;
                    // Forma elíptica simulando perspectiva
                    ctx.scale(1, 0.6);
                    ctx.beginPath();
                    ctx.arc(0, 0, r2d, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.restore();
                }
            });

            // --- Dibujar Estrellas ---
            stars.forEach(s => {
                s.z -= speed;
                if (s.z <= 0) {
                    s.z = MAX_DEPTH;
                    s.x = (Math.random() - 0.5) * 4000;
                    s.y = (Math.random() - 0.5) * 4000;
                }

                const scale = fov / s.z;
                const x2d = s.x * scale + cx;
                const y2d = s.y * scale + cy;
                const size2d = s.size * scale;

                if (x2d >= 0 && x2d <= W && y2d >= 0 && y2d <= H) {
                    // El brillo aumenta conforme se acercan
                    const brightness = Math.min(1, 1 - (s.z / MAX_DEPTH) + 0.2);

                    ctx.fillStyle = `rgba(255, 255, 255, ${brightness})`;
                    ctx.beginPath();
                    ctx.arc(x2d, y2d, Math.max(0.5, size2d), 0, Math.PI * 2);
                    ctx.fill();

                    // Rastro sutil para velocidad
                    ctx.strokeStyle = `rgba(255, 255, 255, ${brightness * 0.3})`;
                    ctx.lineWidth = size2d * 0.5;
                    ctx.beginPath();
                    ctx.moveTo(x2d, y2d);
                    ctx.lineTo(x2d - (s.x * scale * 0.05), y2d - (s.y * scale * 0.05));
                    ctx.stroke();
                }
            });

            animFrameId = requestAnimationFrame(animate);
        };

        animate();

        return () => {
            window.removeEventListener('resize', resize);
            cancelAnimationFrame(animFrameId);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            style={{
                position: 'fixed', inset: 0,
                width: '100%', height: '100%',
                pointerEvents: 'none', zIndex: 0,
            }}
        />
    );
}

export default function Show({ orden, max_intentos }) {
    // =========================================================================
    // LÓGICA Y ESTADOS (INTACTOS)
    // =========================================================================
    const [mensajes, setMensajes] = useState([]);
    const [mensajeTexto, setMensajeTexto] = useState('');
    const [enviando, setEnviando] = useState(false);
    const [comentariosRechazo, setComentariosRechazo] = useState('');
    const [mostrarRechazo, setMostrarRechazo] = useState(false);
    const [mostrarPropioDiseno, setMostrarPropioDiseno] = useState(false);
    const [propioDisenoFile, setPropioDisenoFile] = useState(null);
    const [aceptaResponsabilidad, setAceptaResponsabilidad] = useState(false);
    const [subiendoPropio, setSubiendoPropio] = useState(false);
    const scrollRef = useRef(null);

    const scrollToBottom = () => scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
    useEffect(() => { scrollToBottom(); }, [mensajes]);

    useEffect(() => {
        if (!orden?.tracking_token) return;
        if ('Notification' in window && Notification.permission === 'default') Notification.requestPermission();

        const pusher = new Pusher(import.meta.env.VITE_PUSHER_APP_KEY, {
            cluster: import.meta.env.VITE_PUSHER_APP_CLUSTER,
            forceTLS: true, enabledTransports: ['ws', 'wss'],
        });

        const chatChannel = pusher.subscribe(`chat.${orden.tracking_token}`);
        const ordersChannel = pusher.subscribe('orders');

        chatChannel.bind('nuevo-mensaje', (data) => {
            const m = data.mensaje || data;
            if (m.emisor === 'staff' && 'Notification' in window && Notification.permission === 'granted') {
                new Notification('Nuevo mensaje de SpacioArte', { body: m.texto, icon: '/logo.png' });
            }
            setMensajes(prev => {
                const existe = prev.some(p =>
                    (p.id && p.id === m.id) ||
                    (p.texto === m.texto && p.created_at === m.created_at && p.emisor === m.emisor)
                );
                return existe ? prev : [...prev, m];
            });
        });

        ordersChannel.bind('OrderStateChanged', (data) => {
            if (data.id === orden.id) router.reload({ only: ['orden'] });
        });

        return () => {
            pusher.unsubscribe(`chat.${orden.tracking_token}`);
            pusher.unsubscribe('orders');
            pusher.disconnect();
        };
    }, [orden?.tracking_token, orden?.id]);

    const submitMensaje = async (e) => {
        e.preventDefault();
        if (!mensajeTexto) return;
        setEnviando(true);
        const msgObj = { id: Date.now(), texto: mensajeTexto, emisor: 'cliente', created_at: new Date().toISOString(), requiere_aprobacion: false };
        setMensajes(prev => [...prev, msgObj]);
        try {
            await axios.post('/api/ventas/enviar-chat', { mensaje: msgObj, token: orden.tracking_token });
            setMensajeTexto('');
        } catch (err) {
            console.error('Falla al enviar mensaje:', err);
        } finally {
            setEnviando(false);
        }
    };

    const handleApprove = () => {
        if (confirm('¿Estás seguro de que deseas APROBAR este diseño? Una vez aprobado, tu orden pasará a producción y no se podrán hacer cambios.'))
            router.post(`/tracking/${orden.tracking_token}/approve`, {}, { preserveScroll: true });
    };

    const handleReject = (e) => {
        e.preventDefault();
        if (!comentariosRechazo) return;
        router.post(`/tracking/${orden.tracking_token}/reject`, { comentarios: comentariosRechazo }, {
            preserveScroll: true,
            onSuccess: () => { setMostrarRechazo(false); setComentariosRechazo(''); },
        });
    };

    const handleApproveBilling = () => {
        if (confirm('Hemos alcanzado el límite de 3 revisiones gratuitas. Para continuar con nuevas versiones, se aplicarán las tarifas de diseño por hora. ¿Deseas aprobar el cobro para solicitar la Rev #4?'))
            router.post(`/tracking/${orden.tracking_token}/approve-billing`, {}, {
                preserveScroll: true,
                onSuccess: () => setMostrarRechazo(true),
            });
    };

    const handleOwnDesignSubmit = (e) => {
        e.preventDefault();
        if (!propioDisenoFile || !aceptaResponsabilidad) { alert('Por favor adjunta el diseño y acepta los términos.'); return; }
        const formData = new FormData();
        formData.append('archivo', propioDisenoFile);
        setSubiendoPropio(true);
        router.post(`/tracking/${orden.tracking_token}/own-design`, formData, {
            onSuccess: () => setSubiendoPropio(false),
            onError: () => setSubiendoPropio(false),
            forceFormData: true,
        });
    };

    const formatCurrency = (v) => {
        if (v === undefined || v === null) return '$0.00';
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(v);
    };

    const [mostrarChat, setMostrarChat] = useState(false);
    const [briefData, setBriefData] = useState({ brief_cliente: '', archivo: null });
    const [enviandoBrief, setEnviandoBrief] = useState(false);

    // =========================================================================
    // DISEÑO APPLE (Blanco y Negro / Glassmorphism)
    // =========================================================================
    const glass = {
        background: 'rgba(15, 15, 15, 0.45)',
        backdropFilter: 'saturate(180%) blur(24px)',
        WebkitBackdropFilter: 'saturate(180%) blur(24px)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '1.5rem',
        boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
    };

    const btnPrimary = {
        background: '#ffffff',
        color: '#000000',
        border: 'none',
        borderRadius: '999px', // Estilo píldora muy Apple
        fontFamily: 'inherit',
        fontWeight: 600,
        cursor: 'pointer',
        transition: 'all 0.2s cubic-bezier(0.25, 0.8, 0.25, 1)',
        boxShadow: '0 4px 12px rgba(255,255,255,0.1)',
    };

    const fontFamily = '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, Helvetica, Arial, sans-serif';

    // =========================================================================
    // VISTA 1: OBLIGATORIA — CARGA DE BRIEF
    // =========================================================================
    if (orden && orden.cliente_envia_archivo && !orden.brief_cliente) {

        const handleBriefSubmit = (e) => {
            e.preventDefault();
            if (!briefData.brief_cliente || !briefData.archivo) { alert('Por favor complete la descripción y adjunte un archivo para continuar.'); return; }
            const formData = new FormData();
            formData.append('brief_cliente', briefData.brief_cliente);
            formData.append('archivo', briefData.archivo);
            setEnviandoBrief(true);
            router.post(`/tracking/${orden.tracking_token}/brief`, formData, {
                onSuccess: () => setEnviandoBrief(false),
                onError: () => setEnviandoBrief(false),
                forceFormData: true,
            });
        };

        return (
            <div style={{ minHeight: '100vh', position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '1.5rem', overflow: 'hidden', fontFamily }}>
                <Head title={`Acción Requerida - Orden #${orden.numero_orden}`} />
                <SpaceBackground />

                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 0, pointerEvents: 'none' }} />

                <div style={{ ...glass, position: 'relative', zIndex: 10, width: '100%', maxWidth: '480px' }}>
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '2.5rem 2rem 0' }}>
                        <img
                            src="/logo.png"
                            alt="SpacioArte"
                            style={{
                                height: '48px',
                                width: 'auto',
                                maxWidth: '220px',
                                objectFit: 'contain',
                                filter: 'brightness(0) invert(1)',
                                opacity: 0.9,
                            }}
                        />
                    </div>

                    <div style={{ height: '1px', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)', margin: '1.75rem 2rem 0' }} />

                    <div style={{ padding: '1.75rem 2rem 2.5rem', display: 'flex', flexDirection: 'column', gap: '0' }}>
                        <div style={{ width: 56, height: 56, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem' }}>
                            <UploadCloud size={28} color="#ffffff" strokeWidth={1.5} />
                        </div>

                        <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: '#ffffff', letterSpacing: '-0.03em', marginBottom: '0.4rem' }}>
                            Comencemos tu proyecto
                        </h2>
                        <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)', lineHeight: 1.5, marginBottom: '2rem' }}>
                            Necesitamos tus ideas y archivos de referencia para que nuestro equipo de diseño empiece a crear la magia.
                        </p>

                        <form onSubmit={handleBriefSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
                                    1. Instrucciones de diseño
                                </label>
                                <textarea
                                    style={{ width: '100%', boxSizing: 'border-box', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '1rem', padding: '1rem', fontSize: '14px', color: '#ffffff', resize: 'none', height: '110px', outline: 'none', transition: 'border-color 0.2s', fontFamily: 'inherit' }}
                                    placeholder="Colores, textos, ideas específicas..."
                                    value={briefData.brief_cliente}
                                    onChange={e => setBriefData({ ...briefData, brief_cliente: e.target.value })}
                                    onFocus={e => e.target.style.borderColor = 'rgba(255,255,255,0.4)'}
                                    onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                                    required
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
                                    2. Archivos de referencia
                                </label>
                                <div style={{ position: 'relative' }}>
                                    <input
                                        type="file"
                                        onChange={e => setBriefData({ ...briefData, archivo: e.target.files[0] })}
                                        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer', zIndex: 10 }}
                                        required
                                    />
                                    <div style={{ background: 'rgba(0,0,0,0.2)', border: '1px dashed rgba(255,255,255,0.2)', borderRadius: '1rem', padding: '1.5rem 1rem', textAlign: 'center', transition: 'all 0.2s' }}>
                                        <div style={{ fontSize: '14px', fontWeight: 500, color: briefData.archivo ? '#ffffff' : 'rgba(255,255,255,0.5)', fontFamily: 'inherit' }}>
                                            {briefData.archivo ? briefData.archivo.name : 'Haz clic o arrastra tu archivo aquí'}
                                        </div>
                                        <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)', marginTop: '4px' }}>Max 10MB (PDF, JPG, PNG)</p>
                                    </div>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={enviandoBrief}
                                style={{ ...btnPrimary, padding: '1rem', fontSize: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', opacity: enviandoBrief ? 0.6 : 1 }}
                                onMouseEnter={e => { if (!enviandoBrief) { e.currentTarget.style.transform = 'scale(1.02)'; e.currentTarget.style.background = '#e6e6e6'; } }}
                                onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.background = '#ffffff'; }}
                            >
                                {enviandoBrief ? 'Enviando...' : 'Iniciar Proyecto'}
                                {!enviandoBrief && <ChevronRight size={16} />}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        );
    }

    if (!orden) return null;

    // =========================================================================
    // VISTA PRINCIPAL
    // =========================================================================
    const steps = [
        { label: 'Diseño', desc: 'Creación y propuesta', active: true, done: ['Diseño', 'Pre-Prensa', 'Producción', 'Terminado', 'Entregado'].includes(orden.estado) || orden.estado_diseno === 'Enviado' },
        { label: 'Aprobación', desc: 'Revisión del cliente', active: ['Diseño', 'Pre-Prensa', 'Producción', 'Terminado', 'Entregado'].includes(orden.estado), done: ['Pre-Prensa', 'Producción', 'Terminado', 'Entregado'].includes(orden.estado) },
        { label: 'Producción', desc: 'Impresión y ensamblaje', active: ['Pre-Prensa', 'Producción'].includes(orden.estado), done: ['Terminado', 'Entregado'].includes(orden.estado) },
        { label: 'Entrega', desc: 'Listo para ti', active: orden.estado === 'Terminado', done: orden.estado === 'Entregado' },
    ];

    return (
        <div style={{ minHeight: '100vh', fontFamily, position: 'relative', paddingBottom: '6rem' }}>
            <Head title={`Orden #${orden.numero_orden}`} />

            <SpaceBackground />
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.2)', zIndex: 0, pointerEvents: 'none' }} />

            {/* ── HEADER ─────────────────────────────────────────────────── */}
            <header style={{
                position: 'sticky', top: 0, zIndex: 40,
                background: 'rgba(10, 10, 10, 0.65)',
                backdropFilter: 'saturate(180%) blur(24px)',
                WebkitBackdropFilter: 'saturate(180%) blur(24px)',
                borderBottom: '1px solid rgba(255,255,255,0.08)',
            }}>
                <div style={{
                    maxWidth: '80rem', margin: '0 auto', padding: '0 1.5rem',
                    height: '64px', display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center',
                }}>
                    {/* Izq */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ width: 36, height: 36, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Package size={16} color="#ffffff" />
                        </div>
                        <span style={{ fontWeight: 500, fontSize: '14px', color: 'rgba(255,255,255,0.8)' }} className="sa-sm-only">
                            Portal Cliente
                        </span>
                    </div>

                    {/* Centro */}
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                        <img
                            src="/logo.png"
                            alt="SpacioArte"
                            style={{
                                height: '28px',
                                width: 'auto',
                                maxWidth: '160px',
                                objectFit: 'contain',
                                filter: 'brightness(0) invert(1)',
                                opacity: 1,
                            }}
                        />
                    </div>

                    {/* Der */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                        <span style={{ fontSize: '10px', fontWeight: 600, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Orden</span>
                        <span style={{ fontSize: '15px', fontWeight: 600, color: '#ffffff', letterSpacing: '-0.01em' }}>#{orden.numero_orden}</span>
                    </div>
                </div>
            </header>

            {/* ── MAIN ───────────────────────────────────────────────────── */}
            <main style={{ maxWidth: '80rem', margin: '0 auto', padding: '2.5rem 1.5rem', position: 'relative', zIndex: 1 }}>

                {/* Alerta éxito (Adaptado B/W) */}
                {orden.estado_diseno === 'Aprobado' && (
                    <div style={{ marginBottom: '2rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '1.25rem', padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', backdropFilter: 'blur(10px)' }}>
                        <div style={{ width: 40, height: 40, background: '#ffffff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <CheckCircle size={20} color="#000000" />
                        </div>
                        <div>
                            <h4 style={{ fontWeight: 600, color: '#ffffff', fontSize: '15px', marginBottom: '2px' }}>Diseño Aprobado</h4>
                            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)' }}>Tu pedido ha sido liberado a producción de forma exitosa.</p>
                        </div>
                    </div>
                )}

                <div className="sa-grid">
                    {/* ── COL IZQUIERDA ─────────────────────────────────── */}
                    <div className="sa-col-main">
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

                            {/* TARJETA DISEÑO */}
                            <div style={{ ...glass, overflow: 'hidden' }}>
                                <div style={{ padding: '1.75rem', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
                                    <div>
                                        {orden.estado_diseno === 'Aprobado' ? (
                                            <>
                                                <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: '#ffffff', letterSpacing: '-0.02em' }}>Diseño Final</h2>
                                                <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)', marginTop: '4px' }}>Este archivo ya está en proceso de fabricación.</p>
                                            </>
                                        ) : (
                                            <>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                                    <span style={{ background: 'rgba(255,255,255,0.1)', color: '#ffffff', padding: '4px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Requiere Revisión</span>
                                                    <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', fontWeight: 500 }}>Intento {orden.diseno_intentos} de {max_intentos || 3}</span>
                                                </div>
                                                <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: '#ffffff', letterSpacing: '-0.02em' }}>Propuesta de Diseño</h2>
                                            </>
                                        )}
                                    </div>

                                    {orden.estado_diseno === 'Enviado' && !mostrarRechazo && !mostrarPropioDiseno && (
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
                                            {orden.diseno_intentos >= (max_intentos || 3) && !orden.diseno_cobro_aprobado ? (
                                                <button onClick={handleApproveBilling} style={{ padding: '0.6rem 1.25rem', borderRadius: '999px', fontSize: '13px', fontWeight: 500, background: 'transparent', color: '#ffffff', border: '1px solid rgba(255,255,255,0.3)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', transition: 'all 0.2s' }}>
                                                    <AlertCircle size={14} /> Solicitar Cambios Extras
                                                </button>
                                            ) : (
                                                <button onClick={() => setMostrarRechazo(true)} style={{ padding: '0.6rem 1.25rem', borderRadius: '999px', fontSize: '13px', fontWeight: 500, background: 'rgba(255,255,255,0.05)', color: '#ffffff', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', transition: 'all 0.2s' }}
                                                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                                                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                                                >
                                                    Solicitar Cambios
                                                </button>
                                            )}
                                            <button onClick={handleApprove} style={{ ...btnPrimary, padding: '0.6rem 1.5rem', fontSize: '13px' }}
                                                onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.03)'; e.currentTarget.style.background = '#e6e6e6'; }}
                                                onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.background = '#ffffff'; }}
                                            >
                                                Aprobar Diseño
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <div style={{ padding: '2.5rem', background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
                                    {['jpg', 'jpeg', 'png', 'gif', 'webp'].some(ext => orden.imagen_diseno?.toLowerCase().endsWith(ext)) ? (
                                        <img src={`/storage/${orden.imagen_diseno}`} alt="Diseño" style={{ maxWidth: '100%', height: 'auto', borderRadius: '1rem', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 20px 40px rgba(0,0,0,0.8)' }} />
                                    ) : (
                                        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                                            <div style={{ width: 64, height: 64, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <FileText size={24} color="rgba(255,255,255,0.5)" />
                                            </div>
                                            <p style={{ fontSize: '14px', fontWeight: 500, color: 'rgba(255,255,255,0.6)' }}>Archivo de alta resolución</p>
                                            <a href={`/storage/${orden.imagen_diseno}`} target="_blank" style={{ background: '#ffffff', color: '#000000', padding: '0.6rem 1.5rem', borderRadius: '999px', fontWeight: 600, fontSize: '13px', textDecoration: 'none', transition: 'all 0.2s' }}>
                                                Descargar / Ver Archivo
                                            </a>
                                        </div>
                                    )}
                                </div>

                                {orden.estado_diseno === 'Enviado' && !mostrarPropioDiseno && !mostrarRechazo && (
                                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', padding: '1.25rem', textAlign: 'center' }}>
                                        <button onClick={() => setMostrarPropioDiseno(true)} style={{ fontSize: '13px', fontWeight: 500, color: 'rgba(255,255,255,0.5)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', textDecorationColor: 'rgba(255,255,255,0.2)', textUnderlineOffset: '4px', fontFamily: 'inherit', transition: 'color 0.2s' }}
                                            onMouseEnter={e => e.currentTarget.style.color = '#ffffff'}
                                            onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.5)'}
                                        >
                                            ¿Prefieres enviar tu propio archivo final?
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* FORMULARIO: CAMBIOS */}
                            {mostrarRechazo && (
                                <div style={{ ...glass, padding: '2rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                        <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#ffffff' }}>Solicitar Cambios</h3>
                                        <button onClick={() => setMostrarRechazo(false)} style={{ width: 32, height: 32, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#ffffff' }}>
                                            <XCircle size={18} />
                                        </button>
                                    </div>
                                    <form onSubmit={handleReject} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                        <textarea
                                            value={comentariosRechazo}
                                            onChange={e => setComentariosRechazo(e.target.value)}
                                            placeholder="Describe los ajustes que necesitas de forma clara..."
                                            style={{ width: '100%', boxSizing: 'border-box', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '1rem', padding: '1rem', fontSize: '14px', color: '#ffffff', resize: 'none', height: '120px', outline: 'none', fontFamily: 'inherit' }}
                                            onFocus={e => e.target.style.borderColor = 'rgba(255,255,255,0.4)'}
                                            onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                                            required
                                        />
                                        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                            <button type="submit" style={{ ...btnPrimary, padding: '0.75rem 1.5rem', fontSize: '14px' }}>Enviar Comentarios</button>
                                        </div>
                                    </form>
                                </div>
                            )}

                            {/* FORMULARIO: DISEÑO PROPIO */}
                            {mostrarPropioDiseno && (
                                <div style={{ ...glass, padding: '2rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                                        <div>
                                            <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#ffffff' }}>Enviar mi propio diseño</h3>
                                            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', marginTop: '4px' }}>Salta el proceso editorial subiendo tu archivo final.</p>
                                        </div>
                                        <button onClick={() => setMostrarPropioDiseno(false)} style={{ width: 32, height: 32, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#ffffff', flexShrink: 0 }}>
                                            <XCircle size={18} />
                                        </button>
                                    </div>
                                    <form onSubmit={handleOwnDesignSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                        <div style={{ border: '1px dashed rgba(255,255,255,0.2)', borderRadius: '1rem', padding: '1.5rem', position: 'relative', background: 'rgba(0,0,0,0.2)' }}>
                                            <input type="file" onChange={e => setPropioDisenoFile(e.target.files[0])} style={{ width: '100%', fontSize: '14px', color: 'rgba(255,255,255,0.8)', cursor: 'pointer', fontFamily: 'inherit' }} required />
                                        </div>
                                        <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '1rem', padding: '1.25rem', display: 'flex', gap: '1rem' }}>
                                            <AlertCircle size={20} color="#ffffff" style={{ flexShrink: 0, marginTop: '2px' }} />
                                            <div>
                                                <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', lineHeight: 1.5, marginBottom: '1rem' }}>
                                                    Al enviar su propio diseño, asume la responsabilidad total sobre resolución, ortografía y perfiles de color. SpacioArte no se hace responsable por errores en el archivo original.
                                                </p>
                                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                                    <input type="checkbox" checked={aceptaResponsabilidad} onChange={e => setAceptaResponsabilidad(e.target.checked)} style={{ width: 16, height: 16, accentColor: '#000' }} required />
                                                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#ffffff' }}>Acepto la responsabilidad técnica</span>
                                                </label>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                                            <button type="button" onClick={() => setMostrarPropioDiseno(false)} style={{ padding: '0.75rem 1.5rem', borderRadius: '999px', fontSize: '14px', fontWeight: 500, background: 'transparent', color: '#ffffff', border: '1px solid rgba(255,255,255,0.2)', cursor: 'pointer', fontFamily: 'inherit' }}>Cancelar</button>
                                            <button type="submit" disabled={subiendoPropio || !aceptaResponsabilidad} style={{ ...btnPrimary, padding: '0.75rem 1.5rem', fontSize: '14px', opacity: subiendoPropio || !aceptaResponsabilidad ? 0.4 : 1, cursor: subiendoPropio || !aceptaResponsabilidad ? 'not-allowed' : 'pointer' }}>
                                                {subiendoPropio ? 'Subiendo...' : 'Enviar Diseño'}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ── COL DERECHA ────────────────────────────────────── */}
                    <div className="sa-col-side">
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

                            {/* Wallet pago (Estilo Apple Card B/W) */}
                            <div style={{ background: 'linear-gradient(145deg, #222222 0%, #111111 100%)', borderRadius: '1.5rem', padding: '1.75rem', position: 'relative', overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.15)' }}>
                                <div style={{ position: 'absolute', top: '-50%', left: '-50%', width: '200%', height: '200%', background: 'radial-gradient(circle at top right, rgba(255,255,255,0.1) 0%, transparent 60%)', pointerEvents: 'none' }} />

                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', position: 'relative', zIndex: 1 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'rgba(255,255,255,0.5)' }}>
                                        <CreditCard size={16} />
                                        <span style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Pago</span>
                                    </div>
                                    <span style={{ fontSize: '10px', padding: '4px 10px', borderRadius: '6px', fontWeight: 700, background: orden.total - (orden.monto_abonado || 0) <= 0 ? '#ffffff' : 'transparent', color: orden.total - (orden.monto_abonado || 0) <= 0 ? '#000000' : '#ffffff', border: '1px solid #ffffff' }}>
                                        {orden.total - (orden.monto_abonado || 0) <= 0 ? 'PAGADO' : 'PENDIENTE'}
                                    </span>
                                </div>

                                <div style={{ position: 'relative', zIndex: 1 }}>
                                    <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', marginBottom: '4px' }}>Total a pagar</p>
                                    <div style={{ fontSize: '2.5rem', fontWeight: 600, color: '#ffffff', letterSpacing: '-0.03em', marginBottom: '1.5rem' }}>{formatCurrency(orden.total)}</div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', paddingTop: '1.25rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                                        {[['Abonado', formatCurrency(orden.monto_abonado || 0)], ['Restante', formatCurrency(orden.total - (orden.monto_abonado || 0))]].map(([label, val]) => (
                                            <div key={label}>
                                                <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>{label}</p>
                                                <p style={{ fontWeight: 600, fontSize: '15px', color: '#ffffff' }}>{val}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Tracker */}
                            <div style={{ ...glass, padding: '1.75rem' }}>
                                <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#ffffff', marginBottom: '1.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <Clock size={16} color="rgba(255,255,255,0.6)" /> Estado del Proyecto
                                </h3>
                                <div style={{ position: 'relative' }}>
                                    <div style={{ position: 'absolute', left: '19px', top: '20px', bottom: '20px', width: '2px', background: 'rgba(255,255,255,0.1)' }} />
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                        {steps.map((step, i) => (
                                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                                                <div style={{ width: 40, height: 40, borderRadius: '50%', border: `2px solid ${step.done ? '#ffffff' : step.active ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.1)'}`, background: step.done ? '#ffffff' : step.active ? 'rgba(255,255,255,0.1)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, zIndex: 1 }}>
                                                    {step.done ? <CheckCircle size={18} color="#000000" /> : <span style={{ fontSize: '13px', fontWeight: 600, color: step.active ? '#ffffff' : 'rgba(255,255,255,0.3)' }}>{i + 1}</span>}
                                                </div>
                                                <div>
                                                    <h4 style={{ fontSize: '14px', fontWeight: 600, color: step.active || step.done ? '#ffffff' : 'rgba(255,255,255,0.4)', marginBottom: '2px' }}>{step.label}</h4>
                                                    <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>{step.desc}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Detalles pedido */}
                            <div style={{ ...glass, overflow: 'hidden' }}>
                                <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                                    <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#ffffff' }}>Detalles del Pedido</h3>
                                </div>
                                <div style={{ padding: '0.75rem' }}>
                                    {orden.detalles?.map(item => (
                                        <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', borderRadius: '1rem', cursor: 'default' }}
                                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                <div style={{ width: 36, height: 36, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 600, color: '#ffffff' }}>{item.cantidad}x</div>
                                                <div>
                                                    <div style={{ fontSize: '14px', fontWeight: 500, color: '#ffffff', maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.item?.nombre}</div>
                                                    <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>{formatCurrency(item.precio_unitario)} c/u</div>
                                                </div>
                                            </div>
                                            <div style={{ fontWeight: 600, fontSize: '14px', color: '#ffffff' }}>{formatCurrency(item.total)}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* ── CHAT FLOTANTE (Blanco y Negro) ─────────────────────────── */}
            <div style={{ position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 50, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '1rem' }}>
                {mostrarChat && (
                    <div style={{ background: 'rgba(15, 15, 15, 0.75)', backdropFilter: 'saturate(180%) blur(30px)', WebkitBackdropFilter: 'saturate(180%) blur(30px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '1.5rem', boxShadow: '0 24px 60px rgba(0,0,0,0.8)', width: '90vw', maxWidth: '380px', height: '500px', display: 'flex', flexDirection: 'column', overflow: 'hidden', marginBottom: '0.5rem' }}>
                        <div style={{ padding: '1.25rem', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <div style={{ width: 36, height: 36, background: '#ffffff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <MessageSquare size={16} color="#000000" />
                                </div>
                                <div>
                                    <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#ffffff', letterSpacing: '-0.01em', marginBottom: '2px' }}>Soporte</h3>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                        <span style={{ width: 6, height: 6, background: '#ffffff', borderRadius: '50%' }} />
                                        <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}>En línea</span>
                                    </div>
                                </div>
                            </div>
                            <button onClick={() => setMostrarChat(false)} style={{ width: 32, height: 32, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#ffffff' }}>
                                <XCircle size={18} />
                            </button>
                        </div>

                        <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {mensajes.length === 0 && (
                                <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
                                    <div style={{ width: 48, height: 48, background: 'rgba(255,255,255,0.05)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <MessageSquare size={20} color="rgba(255,255,255,0.4)" />
                                    </div>
                                    <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', textAlign: 'center', fontWeight: 500 }}>Inicia la conversación.<br />¡Estamos para ayudarte!</p>
                                </div>
                            )}
                            {mensajes.map((m, idx) => (
                                <div key={idx} style={{ display: 'flex', justifyContent: m.emisor === 'cliente' ? 'flex-end' : 'flex-start' }}>
                                    <div style={{ maxWidth: '80%', padding: '0.75rem 1.25rem', borderRadius: m.emisor === 'sistema' ? '1rem' : m.emisor === 'cliente' ? '1.25rem 1.25rem 0.25rem 1.25rem' : '1.25rem 1.25rem 1.25rem 0.25rem', fontSize: '14px', background: m.emisor === 'sistema' ? 'rgba(255,255,255,0.05)' : m.emisor === 'cliente' ? '#ffffff' : 'rgba(255,255,255,0.1)', color: m.emisor === 'sistema' ? 'rgba(255,255,255,0.6)' : m.emisor === 'cliente' ? '#000000' : '#ffffff', border: m.emisor === 'staff' ? '1px solid rgba(255,255,255,0.1)' : 'none', width: m.emisor === 'sistema' ? '100%' : 'auto', textAlign: m.emisor === 'sistema' ? 'center' : 'left' }}>
                                        <p style={{ lineHeight: 1.5 }}>{m.texto}</p>
                                        <div style={{ fontSize: '11px', marginTop: '6px', textAlign: 'right', color: m.emisor === 'cliente' ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.4)' }}>
                                            {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            <div ref={scrollRef} />
                        </div>

                        <form onSubmit={submitMensaje} style={{ padding: '1rem', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                                <input
                                    value={mensajeTexto}
                                    onChange={e => setMensajeTexto(e.target.value)}
                                    placeholder="Escribe un mensaje..."
                                    style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '999px', paddingLeft: '1.25rem', paddingRight: '3.5rem', paddingTop: '0.75rem', paddingBottom: '0.75rem', fontSize: '14px', color: '#ffffff', outline: 'none', fontFamily: 'inherit' }}
                                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitMensaje(e); } }}
                                />
                                <button type="submit" disabled={!mensajeTexto || enviando} style={{ position: 'absolute', right: '6px', width: 36, height: 36, background: mensajeTexto && !enviando ? '#ffffff' : 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: mensajeTexto && !enviando ? 'pointer' : 'not-allowed', transition: 'all 0.2s' }}>
                                    <Send size={16} color={mensajeTexto && !enviando ? '#000000' : 'rgba(255,255,255,0.3)'} style={{ marginLeft: '-2px' }} />
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                <button
                    onClick={() => setMostrarChat(!mostrarChat)}
                    style={{ width: 60, height: 60, borderRadius: '50%', background: mostrarChat ? 'rgba(255,255,255,0.1)' : '#ffffff', border: mostrarChat ? '1px solid rgba(255,255,255,0.2)' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: mostrarChat ? 'none' : '0 10px 30px rgba(0,0,0,0.5)', transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)', transform: mostrarChat ? 'rotate(90deg)' : 'rotate(0)', position: 'relative' }}
                    onMouseEnter={e => e.currentTarget.style.transform = mostrarChat ? 'rotate(90deg) scale(1.05)' : 'scale(1.05)'}
                    onMouseLeave={e => e.currentTarget.style.transform = mostrarChat ? 'rotate(90deg)' : 'rotate(0)'}
                >
                    {mostrarChat ? <XCircle size={28} color="#ffffff" /> : <MessageSquare size={28} color="#000000" fill="#000000" />}
                    {!mostrarChat && mensajes.length > 0 && (
                        <span style={{ position: 'absolute', top: '0', right: '0', width: 22, height: 22, background: '#ffffff', color: '#000000', fontSize: '11px', fontWeight: 600, borderRadius: '50%', border: '2px solid #000000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{mensajes.length}</span>
                    )}
                </button>
            </div>

            {/* ── CSS responsivo ─────────────────────────────────────────── */}
            <style>{`
                .sa-grid {
                    display: grid;
                    grid-template-columns: 1fr;
                    gap: 2rem;
                }
                .sa-col-main { grid-column: span 1; }
                .sa-col-side { grid-column: span 1; }

                @media (min-width: 1280px) {
                    .sa-grid {
                        grid-template-columns: repeat(12, 1fr);
                    }
                    .sa-col-main { grid-column: span 8; }
                    .sa-col-side { grid-column: span 4; }
                }
                @media (min-width: 640px) {
                    .sa-sm-only { display: inline !important; }
                }
                ::-webkit-scrollbar { width: 6px; }
                ::-webkit-scrollbar-track { background: transparent; }
                ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); border-radius: 999px; }
            `}</style>
        </div>
    );
}