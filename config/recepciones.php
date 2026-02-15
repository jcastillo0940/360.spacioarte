<?php

/**
 * Configuración del Módulo de Recepción de Órdenes de Compra
 * 
 * Este archivo debe copiarse a config/recepciones.php
 */

return [

    /*
    |--------------------------------------------------------------------------
    | Prefijo de Numeración de Recepciones
    |--------------------------------------------------------------------------
    |
    | Define el prefijo que se usará para generar los números de recepción.
    | Por defecto: REC-000001, REC-000002, etc.
    |
    */
    'prefijo_numero' => env('RECEPCION_PREFIJO', 'REC-'),

    /*
    |--------------------------------------------------------------------------
    | Longitud del Número de Recepción
    |--------------------------------------------------------------------------
    |
    | Define cuántos dígitos tendrá el número secuencial.
    | Por defecto: 6 (000001, 000002, etc.)
    |
    */
    'longitud_numero' => env('RECEPCION_LONGITUD_NUMERO', 6),

    /*
    |--------------------------------------------------------------------------
    | Habilitar Sonidos de Escaneo
    |--------------------------------------------------------------------------
    |
    | Define si se reproducirán sonidos cuando se escanea un producto.
    | true = Con sonidos, false = Sin sonidos
    |
    */
    'habilitar_sonidos' => env('RECEPCION_SONIDOS', true),

    /*
    |--------------------------------------------------------------------------
    | Timeout de Mensaje de Escaneo (milisegundos)
    |--------------------------------------------------------------------------
    |
    | Define cuánto tiempo se mostrará el mensaje después de escanear.
    | Por defecto: 2000 (2 segundos)
    |
    */
    'timeout_mensaje' => env('RECEPCION_TIMEOUT_MENSAJE', 2000),

    /*
    |--------------------------------------------------------------------------
    | Permitir Recepciones Mayores a lo Ordenado
    |--------------------------------------------------------------------------
    |
    | Define si se permite recibir más cantidad de la ordenada.
    | false = No permite exceder (recomendado)
    | true = Permite recibir más de lo ordenado
    |
    */
    'permitir_exceso' => env('RECEPCION_PERMITIR_EXCESO', false),

    /*
    |--------------------------------------------------------------------------
    | Actualizar Stock Automáticamente
    |--------------------------------------------------------------------------
    |
    | Define si el inventario se actualiza automáticamente al recibir.
    | true = Actualiza stock automáticamente
    | false = No actualiza stock (debe hacerse manualmente)
    |
    */
    'actualizar_stock_auto' => env('RECEPCION_ACTUALIZAR_STOCK', true),

    /*
    |--------------------------------------------------------------------------
    | Método de Cálculo de Costo
    |--------------------------------------------------------------------------
    |
    | Define cómo se calcula el costo de inventario:
    | 'promedio_ponderado' - Promedio ponderado (recomendado)
    | 'ultimo_costo' - Último costo de compra
    | 'costo_fijo' - Mantener costo actual del producto
    |
    */
    'metodo_calculo_costo' => env('RECEPCION_METODO_COSTO', 'promedio_ponderado'),

    /*
    |--------------------------------------------------------------------------
    | Estados de Orden Válidos para Recepción
    |--------------------------------------------------------------------------
    |
    | Define qué estados de orden permiten crear recepciones.
    |
    */
    'estados_validos' => [
        'Enviada',
        'Confirmada',
        'Recibida Parcial'
    ],

    /*
    |--------------------------------------------------------------------------
    | Campos Obligatorios en Recepción
    |--------------------------------------------------------------------------
    |
    | Define qué campos son obligatorios al crear una recepción.
    |
    */
    'campos_obligatorios' => [
        'orden_compra_id' => true,
        'tipo_recepcion' => true,
        'observaciones' => false, // Opcional
        'items' => true,
    ],

    /*
    |--------------------------------------------------------------------------
    | Validación de Items
    |--------------------------------------------------------------------------
    |
    | Configuración de validación para los items.
    |
    */
    'validacion_items' => [
        'cantidad_minima' => 0.01,
        'cantidad_maxima' => 999999.99,
        'decimales_permitidos' => 2,
    ],

    /*
    |--------------------------------------------------------------------------
    | Notificaciones
    |--------------------------------------------------------------------------
    |
    | Define qué notificaciones se enviarán.
    |
    */
    'notificaciones' => [
        'email_al_recibir' => env('RECEPCION_EMAIL_NOTIFICACION', false),
        'email_destinatarios' => explode(',', env('RECEPCION_EMAIL_DESTINATARIOS', '')),
        'notificar_admin' => env('RECEPCION_NOTIFICAR_ADMIN', true),
        'notificar_comprador' => env('RECEPCION_NOTIFICAR_COMPRADOR', false),
    ],

    /*
    |--------------------------------------------------------------------------
    | Permisos y Roles
    |--------------------------------------------------------------------------
    |
    | Define qué roles pueden realizar recepciones.
    | Dejar vacío para permitir a todos los usuarios autenticados.
    |
    */
    'roles_permitidos' => [
        // 'vendedor',
        // 'administrador',
        // 'almacen',
    ],

    /*
    |--------------------------------------------------------------------------
    | Paginación
    |--------------------------------------------------------------------------
    |
    | Configuración de paginación para el historial.
    |
    */
    'paginacion' => [
        'items_por_pagina' => env('RECEPCION_ITEMS_PAGINA', 20),
    ],

    /*
    |--------------------------------------------------------------------------
    | Formato de Fechas
    |--------------------------------------------------------------------------
    |
    | Define el formato de las fechas en el sistema.
    |
    */
    'formato_fecha' => 'Y-m-d H:i:s',
    'formato_fecha_corto' => 'd/m/Y',
    'formato_fecha_largo' => 'd/m/Y H:i',

    /*
    |--------------------------------------------------------------------------
    | Logs y Auditoría
    |--------------------------------------------------------------------------
    |
    | Configuración de logs y auditoría.
    |
    */
    'auditoria' => [
        'habilitar' => env('RECEPCION_AUDITORIA', true),
        'log_cambios_stock' => true,
        'log_validaciones' => true,
    ],

    /*
    |--------------------------------------------------------------------------
    | Características Avanzadas
    |--------------------------------------------------------------------------
    |
    | Funcionalidades opcionales del módulo.
    |
    */
    'caracteristicas' => [
        'permitir_editar_recepciones' => false, // No recomendado
        'permitir_eliminar_recepciones' => false, // No recomendado
        'permitir_cancelar_recepciones' => true,
        'requiere_firma_digital' => false,
        'requiere_foto_mercancia' => false,
        'habilitar_ubicaciones_almacen' => false,
    ],

    /*
    |--------------------------------------------------------------------------
    | Integración con Otros Módulos
    |--------------------------------------------------------------------------
    |
    | Define cómo se integra con otros módulos del sistema.
    |
    */
    'integracion' => [
        'crear_factura_automatica' => false,
        'notificar_cuentas_por_pagar' => false,
        'sincronizar_con_contabilidad' => true,
    ],

];
