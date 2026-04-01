<?php

namespace App\Http\Controllers\Config;

use App\Http\Controllers\Controller;
use App\Models\AlanubeEnvironmentConfig;
use App\Models\TenantConfig;
use App\Services\ElectronicInvoicing\AlanubePanamaService;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Mail;
use Symfony\Component\HttpKernel\Exception\HttpException;

class SettingsController extends Controller
{
    private function canManageAlanube(): bool
    {
        $user = Auth::user();

        return (bool) $user?->hasAnyRole(['Developer', 'Superadmin']);
    }

    private function authorizeAlanubeAccess(): void
    {
        if (!$this->canManageAlanube()) {
            throw new HttpException(403, 'No autorizado para ver o modificar la configuracion de Alanube.');
        }
    }

    private function currentAlanubeConfig(TenantConfig $config): AlanubeEnvironmentConfig
    {
        $environment = in_array($config->fe_environment, ['sandbox', 'production'], true)
            ? $config->fe_environment
            : 'sandbox';

        return AlanubeEnvironmentConfig::firstOrCreate(
            ['environment' => $environment],
            [
                'fe_provider' => $config->fe_provider ?: 'alanube_pan',
                'fe_api_base_url' => AlanubeEnvironmentConfig::defaultBaseUrl($environment),
            ]
        );
    }

    private function currentEnvironmentConfig(): AlanubeEnvironmentConfig
    {
        $tenantConfig = TenantConfig::first() ?? TenantConfig::getSettings();

        return $this->currentAlanubeConfig($tenantConfig);
    }

    public function index()
    {
        $config = TenantConfig::first();
        $payload = $config?->toArray() ?? [
            'razon_social' => '',
            'ruc' => '',
            'dv' => '',
            'direccion' => '',
            'telefono' => '',
            'email' => '',
            'smtp_host' => '',
            'smtp_port' => 587,
            'smtp_user' => '',
            'smtp_pass' => '',
            'smtp_encryption' => 'tls',
            'itbms_porcentaje' => 7,
            'factura_serie' => 'FAC',
            'factura_inicio' => 1,
            'max_intentos_diseno' => 3,
            'fe_enabled' => false,
            'fe_auto_emit' => false,
            'fe_provider' => 'alanube_pan',
            'fe_environment' => 'sandbox',
            'fe_api_base_url' => 'https://sandbox-api.alanube.co/pan/v1',
            'fe_security_code' => '',
            'fe_invoice_range_start' => 9630001,
            'fe_invoice_range_end' => 9631000,
            'fe_test_ruc' => '155709116-2-2021',
        ];

        $payload['fe_has_access'] = $this->canManageAlanube();

        if ($config && $this->canManageAlanube()) {
            $alanubeConfig = $this->currentAlanubeConfig($config);
            $payload = array_merge($payload, Arr::only($alanubeConfig->toArray(), [
                'fe_provider',
                'fe_api_base_url',
                'fe_jwt_token',
                'fe_company_id',
                'fe_office_id',
                'fe_security_code',
                'fe_company_qr',
                'fe_portal_email',
                'fe_portal_password',
                'fe_invoice_range_start',
                'fe_invoice_range_end',
                'fe_test_ruc',
                'fe_company_type',
                'fe_type_ruc',
                'fe_trade_name',
                'fe_logo_url',
            ]));
        }

        if (!$this->canManageAlanube()) {
            foreach (array_keys($payload) as $key) {
                if (str_starts_with($key, 'fe_') && $key !== 'fe_has_access') {
                    unset($payload[$key]);
                }
            }
        }

        return response()->json($payload);
    }

    public function update(Request $request)
    {
        $validated = $request->validate([
            'razon_social' => 'required|string|max:255',
            'ruc' => 'required|string|max:50',
            'dv' => 'nullable|string|max:2',
            'direccion' => 'nullable|string',
            'telefono' => 'nullable|string|max:50',
            'email' => 'nullable|email',
            'smtp_host' => 'nullable|string|max:255',
            'smtp_port' => 'nullable|integer|min:1|max:65535',
            'smtp_user' => 'nullable|string|max:255',
            'smtp_pass' => 'nullable|string|max:255',
            'smtp_encryption' => 'nullable|in:none,ssl,tls,starttls',
            'itbms_porcentaje' => 'required|numeric|min:0|max:100',
            'factura_serie' => 'required|string|max:10',
            'factura_inicio' => 'required|integer|min:1',
            'fe_enabled' => 'boolean',
            'fe_auto_emit' => 'boolean',
            'fe_provider' => 'nullable|string|max:50',
            'fe_environment' => 'nullable|string|max:20',
            'fe_api_base_url' => 'nullable|url',
            'fe_jwt_token' => 'nullable|string',
            'fe_company_id' => 'nullable|string|max:100',
            'fe_office_id' => 'nullable|string|max:100',
            'fe_security_code' => 'nullable|string|max:20',
            'fe_company_qr' => 'nullable|string|max:255',
            'fe_portal_email' => 'nullable|email',
            'fe_portal_password' => 'nullable|string|max:255',
            'fe_invoice_range_start' => 'nullable|integer|min:1',
            'fe_invoice_range_end' => 'nullable|integer|min:1',
            'fe_test_ruc' => 'nullable|string|max:100',
            'fe_company_type' => 'nullable|in:main,associated',
            'fe_type_ruc' => 'nullable|integer|in:1,2',
            'fe_trade_name' => 'nullable|string|max:200',
            'fe_logo_url' => 'nullable|url',
            'cta_inventario_id' => 'nullable|exists:accounts,id',
            'cta_recepcion_transitoria_id' => 'nullable|exists:accounts,id',
            'cta_itbms_id' => 'nullable|exists:accounts,id',
            'cta_itbms_compras_id' => 'nullable|exists:accounts,id',
            'cta_cxp_id' => 'nullable|exists:accounts,id',
            'cta_gasto_salario_id' => 'nullable|exists:accounts,id',
            'cta_retenciones_id' => 'nullable|exists:accounts,id',
            'cta_caja_banco_id' => 'nullable|exists:accounts,id',
            'max_intentos_diseno' => 'required|integer|min:1|max:10',
        ]);

        $validated['fe_enabled'] = $request->boolean('fe_enabled');
        $validated['fe_auto_emit'] = $request->boolean('fe_auto_emit');

        $alanubeFields = [
            'fe_provider',
            'fe_environment',
            'fe_api_base_url',
            'fe_jwt_token',
            'fe_company_id',
            'fe_office_id',
            'fe_security_code',
            'fe_company_qr',
            'fe_portal_email',
            'fe_portal_password',
            'fe_invoice_range_start',
            'fe_invoice_range_end',
            'fe_test_ruc',
            'fe_company_type',
            'fe_type_ruc',
            'fe_trade_name',
            'fe_logo_url',
        ];

        $configPayload = Arr::except($validated, $alanubeFields);
        $alanubePayload = Arr::only($validated, $alanubeFields);

        if (!$this->canManageAlanube()) {
            $configPayload = Arr::except($configPayload, [
                'fe_enabled',
                'fe_auto_emit',
                'fe_provider',
                'fe_environment',
            ]);
            $alanubePayload = [];
        }

        $config = TenantConfig::first();

        if ($config) {
            $config->update($configPayload);
        } else {
            $config = TenantConfig::create($configPayload);
        }

        if ($this->canManageAlanube()) {
            $config->update([
                'fe_enabled' => $validated['fe_enabled'],
                'fe_auto_emit' => $validated['fe_auto_emit'],
                'fe_provider' => $validated['fe_provider'],
                'fe_environment' => $validated['fe_environment'],
            ]);

            $this->currentAlanubeConfig($config)->update($alanubePayload);
        }

        return redirect()->back()->with('success', 'Configuracion actualizada correctamente');
    }

    public function testSmtp(Request $request)
    {
        $validated = $request->validate([
            'test_email' => 'required|email|max:255',
        ]);

        $config = TenantConfig::first();

        if (!$config) {
            return response()->json([
                'message' => 'No existe configuracion general guardada todavia.',
            ], 422);
        }

        if (blank($config->smtp_host) || blank($config->smtp_port) || blank($config->smtp_user)) {
            return response()->json([
                'message' => 'Completa host, puerto y usuario SMTP antes de hacer la prueba.',
            ], 422);
        }

        $this->applySmtpRuntimeConfig($config);

        try {
            Mail::mailer('smtp')->raw(
                "Prueba SMTP desde {$config->razon_social}.\n\nSi recibiste este correo, la configuracion SMTP del ERP esta funcionando correctamente.",
                function ($message) use ($validated, $config) {
                    $message
                        ->to($validated['test_email'])
                        ->subject('Prueba SMTP ERP')
                        ->from($config->email ?: 'no-reply@appspacioarte.local', $config->razon_social ?: 'ERP');
                }
            );

            return response()->json([
                'success' => true,
                'message' => 'Correo de prueba enviado correctamente.',
                'test_email' => $validated['test_email'],
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'message' => 'La prueba SMTP fallo: ' . $e->getMessage(),
            ], 422);
        }
    }

    private function applySmtpRuntimeConfig(TenantConfig $config): void
    {
        $encryption = $config->smtp_encryption;
        if ($encryption === 'none') {
            $encryption = null;
        }

        config([
            'mail.default' => 'smtp',
            'mail.mailers.smtp.transport' => 'smtp',
            'mail.mailers.smtp.host' => $config->smtp_host,
            'mail.mailers.smtp.port' => (int) $config->smtp_port,
            'mail.mailers.smtp.username' => $config->smtp_user,
            'mail.mailers.smtp.password' => $config->smtp_pass,
            'mail.mailers.smtp.encryption' => $encryption,
            'mail.from.address' => $config->email ?: 'no-reply@appspacioarte.local',
            'mail.from.name' => $config->razon_social ?: 'ERP',
        ]);
    }
    public function feStatus(AlanubePanamaService $alanube)
    {
        $this->authorizeAlanubeAccess();

        try {
            return response()->json($alanube->syncCompanyStatus());
        } catch (\Throwable $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    public function feAffiliate(AlanubePanamaService $alanube)
    {
        $this->authorizeAlanubeAccess();

        try {
            return response()->json($alanube->solicitarAfiliacion());
        } catch (\Throwable $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    public function feRequestQr(AlanubePanamaService $alanube)
    {
        $this->authorizeAlanubeAccess();

        try {
            return response()->json($alanube->solicitarQr());
        } catch (\Throwable $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    public function feUpdateQr(Request $request, AlanubePanamaService $alanube)
    {
        $this->authorizeAlanubeAccess();

        $validated = $request->validate([
            'qr' => 'nullable|string|max:255',
            'securityCode' => 'nullable|string|max:20',
        ]);

        if (blank($validated['qr'] ?? null) && blank($validated['securityCode'] ?? null)) {
            return response()->json([
                'message' => 'Debes enviar un QR o un securityCode.',
            ], 422);
        }

        try {
            return response()->json(
                $alanube->actualizarQrCompania(
                    $validated['qr'] ?? null,
                    $validated['securityCode'] ?? null
                )
            );
        } catch (\Throwable $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    public function feResources(Request $request, AlanubePanamaService $alanube)
    {
        $this->authorizeAlanubeAccess();

        try {
            $config = $this->currentEnvironmentConfig();
            $companyId = $request->string('companyId')->toString() ?: $config->fe_company_id;
            $locations = [];

            if ($alanube->hasApiCredentials()) {
                try {
                    $locations = $alanube->listLocations();
                } catch (\Throwable) {
                    $locations = [];
                }
            }

            return response()->json([
                'environment' => $alanube->currentEnvironmentSummary(),
                'companies' => $alanube->hasApiCredentials() ? $alanube->listCompanies(true) : [],
                'offices' => ($alanube->hasApiCredentials() && filled($companyId)) ? $alanube->listOffices($companyId) : [],
                'locations' => $locations,
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    public function feSaveCertificates(Request $request, AlanubePanamaService $alanube)
    {
        $this->authorizeAlanubeAccess();

        $validated = $request->validate([
            'signature_certificate' => 'nullable|file|max:5120',
            'signature_password' => 'nullable|string|max:255',
            'authentication_certificate' => 'nullable|file|max:5120',
            'authentication_password' => 'nullable|string|max:255',
        ]);

        try {
            return response()->json([
                'environment' => $alanube->saveCertificates(
                    $request->file('signature_certificate'),
                    $validated['signature_password'] ?? null,
                    $request->file('authentication_certificate'),
                    $validated['authentication_password'] ?? null
                ),
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    public function feCreateCompany(Request $request, AlanubePanamaService $alanube)
    {
        $this->authorizeAlanubeAccess();

        $validated = $request->validate([
            'name' => 'required|string|max:200',
            'tradeName' => 'nullable|string|max:200',
            'ruc' => 'required|string|max:50',
            'checkDigit' => 'required|string|max:10',
            'type' => 'required|in:main,associated',
            'typeRuc' => 'required|integer|in:1,2',
            'replyTo' => 'nullable|email',
            'emailMessage' => 'nullable|string|max:500',
            'qr' => 'nullable|string|max:255',
            'logo' => 'nullable|url',
        ]);

        try {
            return response()->json($alanube->createCompany($validated));
        } catch (\Throwable $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    public function feCreateOffice(Request $request, AlanubePanamaService $alanube)
    {
        $this->authorizeAlanubeAccess();

        $validated = $request->validate([
            'companyId' => 'nullable|string|max:100',
            'code' => 'required|string|max:4',
            'type' => 'required|in:main,associated',
            'coordinates' => 'required|string|max:22',
            'address' => 'required|string|max:100',
            'telephone' => 'required|string|max:12',
            'location' => 'required|string|max:20',
            'email' => 'nullable|email|max:50',
            'setAsDefault' => 'nullable|boolean',
        ]);

        try {
            return response()->json($alanube->saveOffice($validated));
        } catch (\Throwable $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    public function feSelectCompany(Request $request, AlanubePanamaService $alanube)
    {
        $this->authorizeAlanubeAccess();

        $validated = $request->validate([
            'companyId' => 'required|string|max:100',
        ]);

        try {
            return response()->json($alanube->selectCompany($validated['companyId']));
        } catch (\Throwable $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    public function feSelectOffice(Request $request, AlanubePanamaService $alanube)
    {
        $this->authorizeAlanubeAccess();

        $validated = $request->validate([
            'officeId' => 'required|string|max:100',
        ]);

        try {
            return response()->json($alanube->selectOffice($validated['officeId']));
        } catch (\Throwable $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 422);
        }
    }
}
