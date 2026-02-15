import { useEffect } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { usePage } from '@inertiajs/react';

export default function Notifications() {
    const { flash, errors } = usePage().props;

    useEffect(() => {
        // Flash messages de éxito
        if (flash?.success) {
            toast.success(flash.success, {
                duration: 4000,
                position: 'top-right',
                style: {
                    background: '#10b981',
                    color: '#fff',
                    fontWeight: 'bold',
                    padding: '16px',
                    borderRadius: '8px',
                },
                iconTheme: {
                    primary: '#fff',
                    secondary: '#10b981',
                },
            });
        }

        // Flash messages de error
        if (flash?.error) {
            toast.error(flash.error, {
                duration: 5000,
                position: 'top-right',
                style: {
                    background: '#ef4444',
                    color: '#fff',
                    fontWeight: 'bold',
                    padding: '16px',
                    borderRadius: '8px',
                },
                iconTheme: {
                    primary: '#fff',
                    secondary: '#ef4444',
                },
            });
        }

        // Errores de validación
        if (errors && Object.keys(errors).length > 0) {
            const errorMessages = Object.values(errors);
            errorMessages.forEach(error => {
                toast.error(error, {
                    duration: 5000,
                    position: 'top-right',
                    style: {
                        background: '#f59e0b',
                        color: '#fff',
                        fontWeight: 'bold',
                        padding: '16px',
                        borderRadius: '8px',
                    },
                    iconTheme: {
                        primary: '#fff',
                        secondary: '#f59e0b',
                    },
                });
            });
        }
    }, [flash, errors]);

    return (
        <Toaster 
            position="top-right"
            reverseOrder={false}
            gutter={8}
            toastOptions={{
                duration: 4000,
                style: {
                    fontSize: '14px',
                },
            }}
        />
    );
}