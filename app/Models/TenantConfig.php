<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class TenantConfig extends Model
{
    use HasFactory;

    protected $fillable = [
        'razon_social',
        'ruc',
        'dv',
        'direccion',
        'telefono',
        'email',
        'logo_path',
        'moneda_principal',
        'itbms_porcentaje',
        'multimoneda_activa',
        'factura_serie',
        'factura_inicio',
        'fe_enabled',
        'fe_auto_emit',
        'fe_provider',
        'fe_environment',
        'fe_api_base_url',
        'fe_jwt_token',
        'fe_company_id',
        'fe_office_id',
        'fe_security_code',
        'fe_portal_email',
        'fe_portal_password',
        'fe_invoice_range_start',
        'fe_invoice_range_end',
        'fe_test_ruc',
        'factura_terminos_condiciones',
        'factura_plantilla',
        'factura_formato_impresion',
        'factura_termica_ancho_mm',
        'mostrar_valores_letras',
        'smtp_host',
        'smtp_port',
        'smtp_user',
        'smtp_pass',
        'smtp_encryption',
        'cta_ingresos_financieros_id',
        'cta_gastos_financieros_id',
        'cta_cxc_id',
        'cta_cxp_id',
        'cta_inventario_id',
        'cta_ventas_id',
        'cta_itbms_id',
        'cta_itbms_compras_id',
        'cta_devoluciones_id',
        'cta_gasto_merma_id',
        'cta_gasto_salario_id',
        'cta_retenciones_id',
        'cta_caja_banco_id',
        'cta_recepcion_transitoria_id',
        'cta_costo_produccion_id',
        'max_intentos_diseno',
        'diseno_precio_primera_hora',
        'diseno_precio_hora_adicional',
        'diseno_revisiones_gratuitas',
        'diseno_cobro_automatico',
        'anticipo_minimo_porcentaje'
    ];

    protected $casts = [
        'fe_enabled' => 'boolean',
        'fe_auto_emit' => 'boolean',
        'factura_termica_ancho_mm' => 'integer',
    ];

    /**
     * Obtiene la configuración única del sistema
     */
    public static function getSettings()
    {
        return self::first() ?: new self();
    }
}
