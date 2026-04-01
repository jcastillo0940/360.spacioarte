<?php

namespace App\Services\ElectronicInvoicing;

use App\Models\AlanubeEnvironmentConfig;
use App\Models\FacturaVenta;
use App\Models\NotaCredito;
use App\Models\NotaDebito;
use App\Models\TenantConfig;
use Carbon\Carbon;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Http;
use RuntimeException;

class AlanubePanamaService
{
    private const PANAMA_TIMEZONE = 'America/Panama';

    private function tenantConfig(): TenantConfig
    {
        return TenantConfig::getSettings();
    }

    public function config(): AlanubeEnvironmentConfig
    {
        $tenantConfig = $this->tenantConfig();
        $environment = in_array($tenantConfig->fe_environment, ['sandbox', 'production'], true)
            ? $tenantConfig->fe_environment
            : 'sandbox';

        $profile = AlanubeEnvironmentConfig::forEnvironment($environment);

        if ($profile) {
            $profile->setAttribute('fe_enabled', (bool) $tenantConfig->fe_enabled);
            $profile->setAttribute('fe_auto_emit', (bool) $tenantConfig->fe_auto_emit);

            return $profile;
        }

        $profile = new AlanubeEnvironmentConfig([
            'environment' => $environment,
            'fe_provider' => $tenantConfig->fe_provider,
            'fe_api_base_url' => $tenantConfig->fe_api_base_url,
            'fe_jwt_token' => $tenantConfig->fe_jwt_token,
            'fe_company_id' => $tenantConfig->fe_company_id,
            'fe_office_id' => $tenantConfig->fe_office_id,
            'fe_security_code' => $tenantConfig->fe_security_code,
            'fe_portal_email' => $tenantConfig->fe_portal_email,
            'fe_portal_password' => $tenantConfig->fe_portal_password,
            'fe_invoice_range_start' => $tenantConfig->fe_invoice_range_start,
            'fe_invoice_range_end' => $tenantConfig->fe_invoice_range_end,
            'fe_test_ruc' => $tenantConfig->fe_test_ruc,
        ]);

        $profile->setAttribute('fe_enabled', (bool) $tenantConfig->fe_enabled);
        $profile->setAttribute('fe_auto_emit', (bool) $tenantConfig->fe_auto_emit);

        return $profile;
    }

    private function mirrorEnvironmentConfig(AlanubeEnvironmentConfig $config, array $values): void
    {
        if (!empty($values) && $config->exists) {
            $config->update($values);
        }

        $tenantConfig = $this->tenantConfig();

        if ($tenantConfig->exists && $tenantConfig->fe_environment === $config->environment) {
            $tenantConfig->update(array_intersect_key($values, array_flip([
                'fe_company_id',
                'fe_office_id',
                'fe_security_code',
            ])));
        }
    }

    public function isConfigured(): bool
    {
        $config = $this->config();

        return (bool) (
            $config->fe_enabled &&
            filled($config->fe_api_base_url) &&
            filled($config->fe_jwt_token)
        );
    }

    public function hasApiCredentials(): bool
    {
        $config = $this->config();

        return filled($config->fe_api_base_url) && filled($config->fe_jwt_token);
    }

    public function currentEnvironmentSummary(): array
    {
        $config = $this->config();

        return [
            'environment' => $config->environment,
            'fe_provider' => $config->fe_provider,
            'fe_api_base_url' => $config->fe_api_base_url,
            'fe_company_id' => $config->fe_company_id,
            'fe_office_id' => $config->fe_office_id,
            'fe_security_code' => $config->fe_security_code,
            'fe_company_qr' => $config->fe_company_qr,
            'fe_company_type' => $config->fe_company_type,
            'fe_type_ruc' => $config->fe_type_ruc,
            'fe_trade_name' => $config->fe_trade_name,
            'fe_affiliated_status' => $config->fe_affiliated_status,
            'fe_company_is_active' => $config->fe_company_is_active,
            'fe_next_id_request' => $config->fe_next_id_request,
            'fe_next_id_batch_request' => $config->fe_next_id_batch_request,
            'fe_logo_url' => $config->fe_logo_url,
            'has_signature_certificate' => filled($config->fe_signature_p12_base64),
            'has_authentication_certificate' => filled($config->fe_authentication_p12_base64),
        ];
    }

    public function saveCertificates(
        ?UploadedFile $signatureCertificate,
        ?string $signaturePassword,
        ?UploadedFile $authenticationCertificate,
        ?string $authenticationPassword
    ): array {
        $config = $this->config();
        $updates = [];

        if ($signatureCertificate) {
            $updates['fe_signature_p12_base64'] = base64_encode($signatureCertificate->get());
        }

        if ($signaturePassword !== null && trim($signaturePassword) !== '') {
            $updates['fe_signature_p12_password'] = trim($signaturePassword);
        }

        if ($authenticationCertificate) {
            $updates['fe_authentication_p12_base64'] = base64_encode($authenticationCertificate->get());
        }

        if ($authenticationPassword !== null && trim($authenticationPassword) !== '') {
            $updates['fe_authentication_p12_password'] = trim($authenticationPassword);
        }

        if (empty($updates)) {
            throw new RuntimeException('Debes enviar al menos un certificado o su contrasena.');
        }

        $this->mirrorEnvironmentConfig($config, $updates);

        return $this->currentEnvironmentSummary();
    }

    public function listCompanies(?bool $active = null, ?string $type = null): array
    {
        $config = $this->requireApiCredentials();
        $query = [];

        if ($active !== null) {
            $query['active'] = $active ? 'true' : 'false';
        }

        if (in_array($type, ['main', 'associated'], true)) {
            $query['type'] = $type;
        }

        $response = Http::withToken($config->fe_jwt_token)
            ->acceptJson()
            ->get(rtrim($config->fe_api_base_url, '/') . '/companies', $query);

        if ($response->failed()) {
            throw new RuntimeException($this->extractErrorMessage($response->json() ?: [], $response->body()));
        }

        return $response->json() ?: [];
    }

    public function listOffices(?string $companyId = null): array
    {
        $config = $this->requireApiCredentials();
        $companyId = $companyId ?: $config->fe_company_id;

        if (blank($companyId)) {
            return [];
        }

        $response = Http::withToken($config->fe_jwt_token)
            ->acceptJson()
            ->get(rtrim($config->fe_api_base_url, '/') . '/companies/' . $companyId . '/offices');

        if ($response->failed()) {
            throw new RuntimeException($this->extractErrorMessage($response->json() ?: [], $response->body()));
        }

        return $response->json() ?: [];
    }

    public function listLocations(): array
    {
        $config = $this->requireApiCredentials();

        $response = Http::withToken($config->fe_jwt_token)
            ->acceptJson()
            ->get(rtrim($config->fe_api_base_url, '/') . '/dgi/locations');

        if ($response->failed()) {
            throw new RuntimeException($this->extractErrorMessage($response->json() ?: [], $response->body()));
        }

        return $response->json() ?: [];
    }

    public function selectCompany(string $companyId): array
    {
        $config = $this->config();

        $this->mirrorEnvironmentConfig($config, [
            'fe_company_id' => trim($companyId),
            'fe_office_id' => null,
        ]);

        return $this->syncCompanyStatus();
    }

    public function selectOffice(string $officeId): array
    {
        $config = $this->config();
        $this->mirrorEnvironmentConfig($config, [
            'fe_office_id' => trim($officeId),
        ]);

        return $this->syncCompanyStatus();
    }

    public function createCompany(array $payload): array
    {
        $config = $this->requireApiCredentials();
        $tenantConfig = $this->tenantConfig();

        $companyPayload = [
            'name' => trim((string) ($payload['name'] ?? $tenantConfig->razon_social)),
            'tradeName' => trim((string) ($payload['tradeName'] ?? $config->fe_trade_name ?? $tenantConfig->razon_social)),
            'ruc' => trim((string) ($payload['ruc'] ?? $tenantConfig->ruc)),
            'checkDigit' => trim((string) ($payload['checkDigit'] ?? $tenantConfig->dv)),
            'type' => $payload['type'] ?? ($config->fe_company_type ?: 'associated'),
            'typeRuc' => [
                'code' => (int) ($payload['typeRuc'] ?? $config->fe_type_ruc ?? 2),
            ],
            'emails' => [
                'active' => true,
                'replyTo' => trim((string) ($payload['replyTo'] ?? $tenantConfig->email ?? '')),
                'message' => trim((string) ($payload['emailMessage'] ?? '')),
            ],
            'certificates' => [
                'signature' => [
                    'extension' => 'p12',
                    'password' => trim((string) ($payload['signaturePassword'] ?? $config->fe_signature_p12_password)),
                    'content' => trim((string) ($payload['signatureContent'] ?? $config->fe_signature_p12_base64)),
                ],
                'authentication' => [
                    'extension' => 'p12',
                    'password' => trim((string) ($payload['authenticationPassword'] ?? $config->fe_authentication_p12_password)),
                    'content' => trim((string) ($payload['authenticationContent'] ?? $config->fe_authentication_p12_base64)),
                ],
            ],
        ];

        foreach ([
            'qr' => $payload['qr'] ?? $config->fe_company_qr,
            'logo' => $payload['logo'] ?? $config->fe_logo_url,
        ] as $key => $value) {
            if (filled($value)) {
                $companyPayload[$key] = trim((string) $value);
            }
        }

        if (blank(data_get($companyPayload, 'certificates.signature.password')) || blank(data_get($companyPayload, 'certificates.signature.content'))) {
            throw new RuntimeException('Falta cargar el certificado de firma (.p12) o su contrasena para el ambiente actual.');
        }

        if (blank(data_get($companyPayload, 'certificates.authentication.password')) || blank(data_get($companyPayload, 'certificates.authentication.content'))) {
            throw new RuntimeException('Falta cargar el certificado de autenticacion (.p12) o su contrasena para el ambiente actual.');
        }

        $response = Http::withToken($config->fe_jwt_token)
            ->acceptJson()
            ->post(rtrim($config->fe_api_base_url, '/') . '/companies', $companyPayload);

        $body = $response->json() ?: ['raw' => $response->body()];

        if ($response->failed()) {
            throw new RuntimeException($this->extractErrorMessage($body, $response->body()));
        }

        $this->mirrorEnvironmentConfig($config, [
            'fe_company_id' => data_get($body, 'id', $config->fe_company_id),
            'fe_company_qr' => data_get($body, 'qr', $config->fe_company_qr),
            'fe_company_type' => data_get($body, 'type', $companyPayload['type']),
            'fe_type_ruc' => (int) (data_get($body, 'typeRuc.code') ?: data_get($companyPayload, 'typeRuc.code')),
            'fe_trade_name' => data_get($body, 'tradeName', $companyPayload['tradeName']),
            'fe_affiliated_status' => strtoupper((string) data_get($body, 'affiliated', '')),
            'fe_company_is_active' => data_get($body, 'isActive'),
            'fe_next_id_request' => data_get($body, 'nextIdRequest', $config->fe_next_id_request),
            'fe_next_id_batch_request' => data_get($body, 'nextIdBatchRequest', $config->fe_next_id_batch_request),
            'fe_logo_url' => $companyPayload['logo'] ?? $config->fe_logo_url,
            'fe_company_payload' => $body,
        ]);

        return [
            'company' => $body,
            'status' => $this->syncCompanyStatus(),
        ];
    }

    public function saveOffice(array $payload): array
    {
        $config = $this->requireApiCredentials();
        $companyId = trim((string) ($payload['companyId'] ?? $config->fe_company_id));

        if ($companyId === '') {
            throw new RuntimeException('Debes seleccionar o crear una compania antes de configurar oficinas.');
        }

        $officePayload = [
            'code' => str_pad(preg_replace('/\D+/', '', (string) ($payload['code'] ?? '')), 4, '0', STR_PAD_LEFT),
            'type' => $payload['type'] ?? 'associated',
            'coordinates' => trim((string) ($payload['coordinates'] ?? '')),
            'address' => trim((string) ($payload['address'] ?? '')),
            'telephone' => trim((string) ($payload['telephone'] ?? '')),
            'location' => trim((string) ($payload['location'] ?? '')),
        ];

        if (filled($payload['email'] ?? null)) {
            $officePayload['email'] = trim((string) $payload['email']);
        }

        $isMainOffice = ($officePayload['type'] ?? '') === 'main' || $officePayload['code'] === '0000';

        $response = $isMainOffice
            ? Http::withToken($config->fe_jwt_token)
                ->acceptJson()
                ->patch(rtrim($config->fe_api_base_url, '/') . '/companies/' . $companyId . '/office', $officePayload)
            : Http::withToken($config->fe_jwt_token)
                ->acceptJson()
                ->post(rtrim($config->fe_api_base_url, '/') . '/companies/' . $companyId . '/offices', $officePayload);

        $body = $response->json() ?: ['raw' => $response->body()];

        if ($response->failed()) {
            throw new RuntimeException($this->extractErrorMessage($body, $response->body()));
        }

        $setAsDefault = array_key_exists('setAsDefault', $payload) ? (bool) $payload['setAsDefault'] : true;

        $updates = [
            'fe_company_id' => $companyId,
            'fe_office_payload' => $body,
        ];

        if ($setAsDefault) {
            $updates['fe_office_id'] = data_get($body, 'id', $config->fe_office_id);
        }

        $this->mirrorEnvironmentConfig($config, $updates);

        return [
            'office' => $body,
            'status' => $this->syncCompanyStatus(),
        ];
    }

    public function syncCompanyStatus(): array
    {
        if (!$this->isConfigured()) {
            throw new RuntimeException('La configuracion de facturacion electronica Alanube esta incompleta.');
        }

        $company = $this->fetchCompany();
        $office = $this->fetchOffice(data_get($company, 'id'));
        $config = $this->config();

        $this->mirrorEnvironmentConfig($config, [
            'fe_company_id' => data_get($company, 'id', $config->fe_company_id),
            'fe_office_id' => data_get($office, 'id', $config->fe_office_id),
            'fe_company_qr' => data_get($company, 'qr', $config->fe_company_qr),
            'fe_affiliated_status' => strtoupper((string) data_get($company, 'affiliated')),
            'fe_company_is_active' => data_get($company, 'isActive'),
            'fe_next_id_request' => data_get($company, 'nextIdRequest', $config->fe_next_id_request),
            'fe_next_id_batch_request' => data_get($company, 'nextIdBatchRequest', $config->fe_next_id_batch_request),
            'fe_company_payload' => $company,
            'fe_office_payload' => $office,
        ]);

        return [
            'company' => $company,
            'office' => $office,
            'affiliated' => strtoupper((string) data_get($company, 'affiliated')),
            'can_emit' => strtoupper((string) data_get($company, 'affiliated')) === 'SUBSCRIBED',
            'sandbox_qr_note' => $config->environment === 'sandbox'
                ? 'En sandbox Alanube usa un QR mock. La API si permite actualizar el valor de la compania, pero conviene hacerlo solo con un QR confirmado por soporte.'
                : null,
        ];
    }

    public function solicitarAfiliacion(): array
    {
        return $this->requestCompanyAffiliate('3', 'Debes aceptar la solicitud PAC en Etax/DGI y luego volver a consultar el estado desde el ERP.');
    }

    public function solicitarQr(): array
    {
        return $this->requestCompanyAffiliate('1', 'QR solicitado correctamente. En sandbox Alanube devuelve un QR mock y el estado de afiliacion puede seguir en REQUESTED hasta completar el flujo del PAC.');
    }

    private function requestCompanyAffiliate(string $affiliationType, string $nextStep): array
    {
        if (!$this->isConfigured()) {
            throw new RuntimeException('La configuracion de facturacion electronica Alanube esta incompleta.');
        }

        $status = $this->syncCompanyStatus();
        $companyId = data_get($status, 'company.id');

        if (blank($companyId)) {
            throw new RuntimeException('No se pudo identificar la compania en Alanube para solicitar la afiliacion.');
        }

        $config = $this->config();
        $response = Http::withToken($config->fe_jwt_token)
            ->acceptJson()
            ->get(rtrim($config->fe_api_base_url, '/') . '/company-affiliate', [
                'idCompany' => $companyId,
                'affiliationType' => $affiliationType,
            ]);

        $body = $response->json() ?: ['raw' => $response->body()];

        if ($response->failed()) {
            throw new RuntimeException($this->extractErrorMessage($body, $response->body()));
        }

        return [
            'request' => $body,
            'status' => $this->syncCompanyStatus(),
            'next_step' => $nextStep,
        ];
    }

    public function actualizarQrCompania(?string $qr = null, ?string $securityCode = null): array
    {
        if (!$this->isConfigured()) {
            throw new RuntimeException('La configuracion de facturacion electronica Alanube esta incompleta.');
        }

        $config = $this->config();

        $status = $this->syncCompanyStatus();
        $companyId = data_get($status, 'company.id');

        if (blank($companyId)) {
            throw new RuntimeException('No se pudo identificar la compania en Alanube para actualizar el QR.');
        }

        $response = Http::withToken($config->fe_jwt_token)
            ->acceptJson()
            ->patch(rtrim($config->fe_api_base_url, '/') . '/companies/' . $companyId, [
                ...($qr !== null && trim($qr) !== '' ? ['qr' => trim($qr)] : []),
                ...($securityCode !== null && trim($securityCode) !== '' ? ['securityCode' => trim($securityCode)] : []),
            ]);

        $body = $response->json() ?: ['raw' => $response->body()];

        if ($response->failed()) {
            throw new RuntimeException($this->extractErrorMessage($body, $response->body()));
        }

        $result = [
            'update' => $body,
            'status' => $this->syncCompanyStatus(),
        ];

        $values = [];

        if ($qr !== null && trim($qr) !== '') {
            $values['fe_company_qr'] = trim($qr);
        }

        if ($securityCode !== null && trim($securityCode) !== '') {
            $values['fe_security_code'] = trim($securityCode);
        }

        $this->mirrorEnvironmentConfig($config, $values);

        return $result;
    }

    public function emitirFactura(FacturaVenta $factura): array
    {
        $factura->loadMissing(['cliente', 'detalles.item.tax']);

        if (!$this->isConfigured()) {
            throw new RuntimeException('La configuracion de facturacion electronica Alanube esta incompleta.');
        }

        try {
            $this->validateInvoiceData($factura);
            [$payload, $response, $body, $document] = $this->sendInvoicePayload($factura);

            if ($response->failed() && $this->shouldRetryWithFreshQr($body)) {
                $this->solicitarQr();
                [$payload, $response, $body, $document] = $this->sendInvoicePayload($factura);
            }

            $factura->update([
                'fe_provider' => 'alanube_pan',
                'fe_request_payload' => $payload,
                'fe_response_payload' => $body,
                'fe_status' => data_get($document, 'status', $response->successful() ? 'SENT' : 'ERROR'),
                'fe_legal_status' => data_get($document, 'legalStatus'),
                'fe_document_id' => data_get($document, 'id'),
                'fe_cufe' => data_get($document, 'cufe'),
                'fe_issue_date' => data_get($document, 'documentIssueDate') ? Carbon::parse(data_get($document, 'documentIssueDate')) : null,
                'fe_last_sync_at' => now(),
                'fe_public_url' => data_get($document, 'publicUrl') ?: data_get($document, 'qr'),
                'fe_container_xml_url' => data_get($document, 'containerXml') ?: data_get($document, 'xml'),
                'fe_error_message' => $response->successful() ? null : $this->extractErrorMessage($body, $response->body()),
            ]);

            if ($response->failed()) {
                throw new RuntimeException($factura->fresh()->fe_error_message ?: 'Alanube devolvio un error al emitir la factura.');
            }

            return $body;
        } catch (RuntimeException $e) {
            $factura->update([
                'fe_provider' => 'alanube_pan',
                'fe_status' => 'ERROR',
                'fe_last_sync_at' => now(),
                'fe_error_message' => $e->getMessage(),
            ]);

            throw $e;
        }
    }

    public function emitirNotaCredito(NotaCredito $nota): array
    {
        $nota->loadMissing(['cliente', 'factura.cliente', 'detalles.item.tax']);

        if (!$this->isConfigured()) {
            throw new RuntimeException('La configuracion de facturacion electronica Alanube esta incompleta.');
        }

        try {
            $this->validateCreditNoteData($nota);
            [$payload, $response, $body, $document] = $this->sendCreditNotePayload($nota);

            if ($response->failed() && $this->shouldRetryWithFreshQr($body)) {
                $this->solicitarQr();
                [$payload, $response, $body, $document] = $this->sendCreditNotePayload($nota);
            }

            $nota->update([
                'fe_provider' => 'alanube_pan',
                'fe_request_payload' => $payload,
                'fe_response_payload' => $body,
                'fe_status' => data_get($document, 'status', $response->successful() ? 'SENT' : 'ERROR'),
                'fe_legal_status' => data_get($document, 'legalStatus'),
                'fe_document_id' => data_get($document, 'id'),
                'fe_cufe' => data_get($document, 'cufe'),
                'fe_issue_date' => data_get($document, 'documentIssueDate') ? Carbon::parse(data_get($document, 'documentIssueDate')) : null,
                'fe_last_sync_at' => now(),
                'fe_public_url' => data_get($document, 'publicUrl') ?: data_get($document, 'qr'),
                'fe_container_xml_url' => data_get($document, 'containerXml') ?: data_get($document, 'xml'),
                'fe_error_message' => $response->successful() ? null : $this->extractErrorMessage($body, $response->body()),
            ]);

            if ($response->failed()) {
                throw new RuntimeException($nota->fresh()->fe_error_message ?: 'Alanube devolvio un error al emitir la nota de credito.');
            }

            return $body;
        } catch (RuntimeException $e) {
            $nota->update([
                'fe_provider' => 'alanube_pan',
                'fe_status' => 'ERROR',
                'fe_last_sync_at' => now(),
                'fe_error_message' => $e->getMessage(),
            ]);

            throw $e;
        }
    }

    public function sincronizarFactura(FacturaVenta $factura): array
    {
        $config = $this->config();

        if (!$this->isConfigured()) {
            throw new RuntimeException('La configuracion de facturacion electronica Alanube esta incompleta.');
        }

        if (blank($factura->fe_document_id)) {
            throw new RuntimeException('La factura aun no tiene un id de documento electronico en Alanube.');
        }

        $url = rtrim($config->fe_api_base_url, '/') . '/invoices/' . $factura->fe_document_id;

        $response = Http::withToken($config->fe_jwt_token)
            ->acceptJson()
            ->get($url);

        $body = $response->json() ?: ['raw' => $response->body()];
        $document = $this->unwrapDocumentPayload($body);
        $governmentError = $this->extractGovernmentRejectionMessage($document);

        $factura->update([
            'fe_response_payload' => $body,
            'fe_status' => data_get($document, 'status', $factura->fe_status),
            'fe_legal_status' => data_get($document, 'legalStatus', $factura->fe_legal_status),
            'fe_cufe' => data_get($document, 'cufe', $factura->fe_cufe),
            'fe_issue_date' => data_get($document, 'documentIssueDate') ? Carbon::parse(data_get($document, 'documentIssueDate')) : $factura->fe_issue_date,
            'fe_last_sync_at' => now(),
            'fe_public_url' => data_get($document, 'publicUrl') ?: data_get($document, 'qr', $factura->fe_public_url),
            'fe_container_xml_url' => data_get($document, 'containerXml') ?: data_get($document, 'xml', $factura->fe_container_xml_url),
            'fe_error_message' => $response->successful()
                ? $governmentError
                : $this->extractErrorMessage($body, $response->body()),
        ]);

        if ($response->failed()) {
            throw new RuntimeException($factura->fresh()->fe_error_message ?: 'Alanube devolvio un error al consultar la factura.');
        }

        return $body;
    }

    public function sincronizarNotaCredito(NotaCredito $nota): array
    {
        $config = $this->config();

        if (!$this->isConfigured()) {
            throw new RuntimeException('La configuracion de facturacion electronica Alanube esta incompleta.');
        }

        if (blank($nota->fe_document_id)) {
            throw new RuntimeException('La nota de credito aun no tiene un id de documento electronico en Alanube.');
        }

        $url = rtrim($config->fe_api_base_url, '/') . '/credit-notes/' . $nota->fe_document_id;

        $response = Http::withToken($config->fe_jwt_token)
            ->acceptJson()
            ->get($url);

        $body = $response->json() ?: ['raw' => $response->body()];
        $document = $this->unwrapDocumentPayload($body);
        $governmentError = $this->extractGovernmentRejectionMessage($document);

        $nota->update([
            'fe_response_payload' => $body,
            'fe_status' => data_get($document, 'status', $nota->fe_status),
            'fe_legal_status' => data_get($document, 'legalStatus', $nota->fe_legal_status),
            'fe_cufe' => data_get($document, 'cufe', $nota->fe_cufe),
            'fe_issue_date' => data_get($document, 'documentIssueDate') ? Carbon::parse(data_get($document, 'documentIssueDate')) : $nota->fe_issue_date,
            'fe_last_sync_at' => now(),
            'fe_public_url' => data_get($document, 'publicUrl') ?: data_get($document, 'qr', $nota->fe_public_url),
            'fe_container_xml_url' => data_get($document, 'containerXml') ?: data_get($document, 'xml', $nota->fe_container_xml_url),
            'fe_error_message' => $response->successful()
                ? $governmentError
                : $this->extractErrorMessage($body, $response->body()),
        ]);

        if ($response->failed()) {
            throw new RuntimeException($nota->fresh()->fe_error_message ?: 'Alanube devolvio un error al consultar la nota de credito.');
        }

        return $body;
    }

    public function emitirNotaDebito(NotaDebito $nota): array
    {
        $nota->loadMissing(['cliente', 'factura.cliente', 'detalles.item.tax']);

        if (!$this->isConfigured()) {
            throw new RuntimeException('La configuracion de facturacion electronica Alanube esta incompleta.');
        }

        try {
            $this->validateDebitNoteData($nota);
            [$payload, $response, $body, $document] = $this->sendDebitNotePayload($nota);

            if ($response->failed() && $this->shouldRetryWithFreshQr($body)) {
                $this->solicitarQr();
                [$payload, $response, $body, $document] = $this->sendDebitNotePayload($nota);
            }

            $nota->update([
                'fe_provider' => 'alanube_pan',
                'fe_request_payload' => $payload,
                'fe_response_payload' => $body,
                'fe_status' => data_get($document, 'status', $response->successful() ? 'SENT' : 'ERROR'),
                'fe_legal_status' => data_get($document, 'legalStatus'),
                'fe_document_id' => data_get($document, 'id'),
                'fe_cufe' => data_get($document, 'cufe'),
                'fe_issue_date' => data_get($document, 'documentIssueDate') ? Carbon::parse(data_get($document, 'documentIssueDate')) : null,
                'fe_last_sync_at' => now(),
                'fe_public_url' => data_get($document, 'publicUrl') ?: data_get($document, 'qr'),
                'fe_container_xml_url' => data_get($document, 'containerXml') ?: data_get($document, 'xml'),
                'fe_error_message' => $response->successful() ? null : $this->extractErrorMessage($body, $response->body()),
            ]);

            if ($response->failed()) {
                throw new RuntimeException($nota->fresh()->fe_error_message ?: 'Alanube devolvio un error al emitir la nota de debito.');
            }

            return $body;
        } catch (RuntimeException $e) {
            $nota->update([
                'fe_provider' => 'alanube_pan',
                'fe_status' => 'ERROR',
                'fe_last_sync_at' => now(),
                'fe_error_message' => $e->getMessage(),
            ]);

            throw $e;
        }
    }

    public function sincronizarNotaDebito(NotaDebito $nota): array
    {
        $config = $this->config();

        if (!$this->isConfigured()) {
            throw new RuntimeException('La configuracion de facturacion electronica Alanube esta incompleta.');
        }

        if (blank($nota->fe_document_id)) {
            throw new RuntimeException('La nota de debito aun no tiene un id de documento electronico en Alanube.');
        }

        $url = rtrim($config->fe_api_base_url, '/') . '/debit-notes/' . $nota->fe_document_id;

        $response = Http::withToken($config->fe_jwt_token)
            ->acceptJson()
            ->get($url);

        $body = $response->json() ?: ['raw' => $response->body()];
        $document = $this->unwrapDocumentPayload($body);
        $governmentError = $this->extractGovernmentRejectionMessage($document);

        $nota->update([
            'fe_response_payload' => $body,
            'fe_status' => data_get($document, 'status', $nota->fe_status),
            'fe_legal_status' => data_get($document, 'legalStatus', $nota->fe_legal_status),
            'fe_cufe' => data_get($document, 'cufe', $nota->fe_cufe),
            'fe_issue_date' => data_get($document, 'documentIssueDate') ? Carbon::parse(data_get($document, 'documentIssueDate')) : $nota->fe_issue_date,
            'fe_last_sync_at' => now(),
            'fe_public_url' => data_get($document, 'publicUrl') ?: data_get($document, 'qr', $nota->fe_public_url),
            'fe_container_xml_url' => data_get($document, 'containerXml') ?: data_get($document, 'xml', $nota->fe_container_xml_url),
            'fe_error_message' => $response->successful()
                ? $governmentError
                : $this->extractErrorMessage($body, $response->body()),
        ]);

        if ($response->failed()) {
            throw new RuntimeException($nota->fresh()->fe_error_message ?: 'Alanube devolvio un error al consultar la nota de debito.');
        }

        return $body;
    }

    public function buildDraftPayload(FacturaVenta $factura): array
    {
        $config = $this->config();
        $company = $this->fetchCompany();
        $this->ensureCompanyAffiliated($company);
        $office = $this->fetchOffice(data_get($company, 'id'));
        $numeration = $this->resolveDocumentNumeration($factura);
        $billingPoint = $this->resolveBillingPoint($office);
        $securityCode = $this->resolveSecurityCode($config, $company);
        $receiver = $this->buildReceiver($factura);
        $effectiveDiscountTotal = $this->resolveEffectiveDiscountTotal($factura);
        $items = $this->buildItems($factura, $effectiveDiscountTotal);
        $paymentTime = $this->resolvePaymentTime($factura);

        $totals = [
            'paymentTime' => $paymentTime,
            'paymentMethods' => [
                [
                    'type' => $paymentTime === 2 ? '01' : '02',
                    'amount' => (float) $factura->total,
                ],
            ],
            'installmentPayment' => $this->buildInstallmentPayment($factura, $paymentTime),
        ];

        return [
            'idOffice' => data_get($office, 'id'),
            'information' => [
                'issueType' => '01',
                'documentType' => '01',
                'numeration' => $numeration,
                'billingPoint' => $billingPoint,
                'securityCode' => $securityCode,
                'cafe' => [
                    'format' => 3,
                    'delivery' => 3,
                ],
                'nature' => '01',
                'operationType' => 1,
                'destination' => 1,
                'receiverContainer' => 1,
                'saleType' => $this->resolveSaleType($factura),
                'issueDate' => $this->buildIssueDate($factura),
                'information' => 'Emitido desde ERP appSpacioarte',
            ],
            'receiver' => $receiver,
            'items' => $items,
            'totals' => $totals,
        ];
    }

    public function buildCreditNoteDraftPayload(NotaCredito $nota): array
    {
        $config = $this->config();
        $company = $this->fetchCompany();
        $this->ensureCompanyAffiliated($company);
        $office = $this->fetchOffice(data_get($company, 'id'));
        $billingPoint = $this->resolveBillingPoint($office);
        $securityCode = $this->resolveSecurityCode($config, $company);
        $receiver = $this->buildCreditNoteReceiver($nota);

        return [
            'idOffice' => data_get($office, 'id'),
            'information' => [
                'issueType' => '01',
                'documentType' => '04',
                'numeration' => $this->resolveCreditNoteNumeration($nota),
                'billingPoint' => $billingPoint,
                'securityCode' => $securityCode,
                'modificationCode' => $this->resolveCreditNoteModificationCode($nota),
                'cafe' => [
                    'format' => 3,
                    'delivery' => 3,
                ],
                'nature' => '01',
                'operationType' => 1,
                'destination' => 1,
                'receiverContainer' => 1,
                'issueDate' => $this->buildCreditNoteIssueDate($nota),
                'information' => 'Nota de credito emitida desde ERP appSpacioarte',
            ],
            'receiver' => $receiver,
            'items' => $this->buildCreditNoteItems($nota),
            'totals' => [
                'paymentTime' => 1,
                'paymentMethods' => [
                    [
                        'type' => '02',
                        'amount' => (float) $nota->total,
                    ],
                ],
            ],
            'referencedDocuments' => [
                [
                    'emissionType' => 'ID',
                    'apiIdentification' => $nota->factura->fe_document_id,
                ],
            ],
        ];
    }

    public function buildDebitNoteDraftPayload(NotaDebito $nota): array
    {
        $config = $this->config();
        $company = $this->fetchCompany();
        $this->ensureCompanyAffiliated($company);
        $office = $this->fetchOffice(data_get($company, 'id'));
        $billingPoint = $this->resolveBillingPoint($office);
        $securityCode = $this->resolveSecurityCode($config, $company);
        $receiver = $this->buildDebitNoteReceiver($nota);

        return [
            'idOffice' => data_get($office, 'id'),
            'information' => [
                'issueType' => '01',
                'documentType' => '05',
                'numeration' => $this->resolveDebitNoteNumeration($nota),
                'billingPoint' => $billingPoint,
                'securityCode' => $securityCode,
                'modificationCode' => $this->resolveDebitNoteModificationCode($nota),
                'cafe' => [
                    'format' => 3,
                    'delivery' => 3,
                ],
                'nature' => '01',
                'operationType' => 1,
                'destination' => 1,
                'receiverContainer' => 1,
                'issueDate' => $this->buildDebitNoteIssueDate($nota),
                'information' => 'Nota de debito emitida desde ERP appSpacioarte',
            ],
            'receiver' => $receiver,
            'items' => $this->buildDebitNoteItems($nota),
            'totals' => [
                'paymentTime' => 1,
                'paymentMethods' => [
                    [
                        'type' => '02',
                        'amount' => (float) $nota->total,
                    ],
                ],
            ],
            'referencedDocuments' => [
                [
                    'emissionType' => 'ID',
                    'apiIdentification' => $nota->factura->fe_document_id,
                ],
            ],
        ];
    }

    private function sendInvoicePayload(FacturaVenta $factura): array
    {
        $payload = $this->buildDraftPayload($factura);
        $config = $this->config();
        $url = rtrim($config->fe_api_base_url, '/') . '/invoices';

        $response = Http::withToken($config->fe_jwt_token)
            ->acceptJson()
            ->post($url, $payload);

        $body = $response->json() ?: ['raw' => $response->body()];
        $document = $this->unwrapDocumentPayload($body);

        return [$payload, $response, $body, $document];
    }

    private function sendCreditNotePayload(NotaCredito $nota): array
    {
        $payload = $this->buildCreditNoteDraftPayload($nota);
        $config = $this->config();
        $url = rtrim($config->fe_api_base_url, '/') . '/credit-notes';

        $response = Http::withToken($config->fe_jwt_token)
            ->acceptJson()
            ->post($url, $payload);

        $body = $response->json() ?: ['raw' => $response->body()];
        $document = $this->unwrapDocumentPayload($body);

        return [$payload, $response, $body, $document];
    }

    private function sendDebitNotePayload(NotaDebito $nota): array
    {
        $payload = $this->buildDebitNoteDraftPayload($nota);
        $config = $this->config();
        $url = rtrim($config->fe_api_base_url, '/') . '/debit-notes';

        $response = Http::withToken($config->fe_jwt_token)
            ->acceptJson()
            ->post($url, $payload);

        $body = $response->json() ?: ['raw' => $response->body()];
        $document = $this->unwrapDocumentPayload($body);

        return [$payload, $response, $body, $document];
    }

    private function buildReceiver(FacturaVenta $factura): array
    {
        $cliente = $factura->cliente;
        $fullRuc = $this->composePanamaRuc($cliente?->identificacion, $cliente?->dv ?: $cliente?->digito_verificador);
        $address = $this->normalizeFixedLengthText($cliente?->direccion ?: 'SIN DIRECCION REGISTRADA EN ERP', 100);
        $company = $this->fetchCompany();
        $office = $this->fetchOffice(data_get($company, 'id'));

        return [
            'type' => $cliente?->tipo_identificacion === 'RUC' ? '01' : '02',
            'ruc' => $cliente?->tipo_identificacion === 'RUC' ? [
                'type' => 2,
                'ruc' => $fullRuc,
            ] : null,
            'name' => $cliente?->razon_social,
            'address' => $address,
            'location' => [
                'code' => $this->resolveReceiverLocationCode($cliente, $office),
            ],
            'country' => 'PA',
            'telephones' => $this->formatPhoneList($cliente?->telefono),
            'emails' => $this->formatEmailList($cliente?->email),
        ];
    }

    private function buildCreditNoteReceiver(NotaCredito $nota): array
    {
        $cliente = $nota->cliente ?: $nota->factura?->cliente;
        $fullRuc = $this->composePanamaRuc($cliente?->identificacion, $cliente?->dv ?: $cliente?->digito_verificador);
        $address = $this->normalizeFixedLengthText($cliente?->direccion ?: 'SIN DIRECCION REGISTRADA EN ERP', 100);
        $company = $this->fetchCompany();
        $office = $this->fetchOffice(data_get($company, 'id'));

        return [
            'type' => $cliente?->tipo_identificacion === 'RUC' ? '01' : '02',
            'ruc' => $cliente?->tipo_identificacion === 'RUC' ? [
                'type' => 2,
                'ruc' => $fullRuc,
            ] : null,
            'name' => $cliente?->razon_social,
            'address' => $address,
            'location' => [
                'code' => $this->resolveReceiverLocationCode($cliente, $office),
            ],
            'country' => 'PA',
            'telephones' => $this->formatPhoneList($cliente?->telefono),
            'emails' => $this->formatEmailList($cliente?->email),
        ];
    }

    private function buildDebitNoteReceiver(NotaDebito $nota): array
    {
        $cliente = $nota->cliente ?: $nota->factura?->cliente;
        $fullRuc = $this->composePanamaRuc($cliente?->identificacion, $cliente?->dv ?: $cliente?->digito_verificador);
        $address = $this->normalizeFixedLengthText($cliente?->direccion ?: 'SIN DIRECCION REGISTRADA EN ERP', 100);
        $company = $this->fetchCompany();
        $office = $this->fetchOffice(data_get($company, 'id'));

        return [
            'type' => $cliente?->tipo_identificacion === 'RUC' ? '01' : '02',
            'ruc' => $cliente?->tipo_identificacion === 'RUC' ? [
                'type' => 2,
                'ruc' => $fullRuc,
            ] : null,
            'name' => $cliente?->razon_social,
            'address' => $address,
            'location' => [
                'code' => $this->resolveReceiverLocationCode($cliente, $office),
            ],
            'country' => 'PA',
            'telephones' => $this->formatPhoneList($cliente?->telefono),
            'emails' => $this->formatEmailList($cliente?->email),
        ];
    }

    private function buildItems(FacturaVenta $factura, float $effectiveDiscountTotal = 0): array
    {
        $subtotal = max((float) $factura->subtotal, 0.0);

        return $factura->detalles->values()->map(function ($detalle, $index) use ($effectiveDiscountTotal, $subtotal) {
            $item = $detalle->item;
            $lineBaseAmount = round((float) $detalle->cantidad * (float) $detalle->precio_unitario, 2);
            $lineDiscount = 0.0;

            if ($effectiveDiscountTotal > 0 && $subtotal > 0) {
                $lineDiscount = round(($effectiveDiscountTotal * ($lineBaseAmount / $subtotal)) / max((float) $detalle->cantidad, 1), 2);
            }

            return [
                'number' => str_pad((string) ($index + 1), 4, '0', STR_PAD_LEFT),
                'description' => $item?->nombre,
                'code' => $item?->codigo,
                'unit' => $this->resolveUnitCode($item),
                'quantity' => (float) $detalle->cantidad,
                'cpbs' => [
                    'code' => (string) $item->fe_codigo_producto,
                    'unit' => $this->resolveUnitCode($item),
                ],
                'prices' => [
                    'transfer' => (float) $detalle->precio_unitario,
                    'discount' => $lineDiscount,
                ],
                'itbms' => [
                    'rate' => $this->mapTaxRate($detalle->porcentaje_itbms),
                ],
            ];
        })->all();
    }

    private function buildCreditNoteItems(NotaCredito $nota): array
    {
        return $nota->detalles->values()->map(function ($detalle, $index) use ($nota) {
            $item = $detalle->item;
            $originalLine = $nota->factura?->detalles?->firstWhere('item_id', $detalle->item_id);
            $taxRate = $originalLine
                ? (float) ($originalLine->porcentaje_itbms ?? 0)
                : (float) ($item->tax->tasa ?? 0);

            return [
                'number' => str_pad((string) ($index + 1), 4, '0', STR_PAD_LEFT),
                'description' => $item?->nombre,
                'code' => $item?->codigo,
                'unit' => $this->resolveUnitCode($item),
                'quantity' => (float) $detalle->cantidad,
                'cpbs' => [
                    'code' => (string) $item->fe_codigo_producto,
                    'unit' => $this->resolveUnitCode($item),
                ],
                'prices' => [
                    'transfer' => (float) $detalle->precio_unitario,
                    'discount' => 0,
                ],
                'itbms' => [
                    'rate' => $this->mapTaxRate($taxRate),
                ],
            ];
        })->all();
    }

    private function buildDebitNoteItems(NotaDebito $nota): array
    {
        return $nota->detalles->values()->map(function ($detalle, $index) use ($nota) {
            $item = $detalle->item;
            $originalLine = $nota->factura?->detalles?->firstWhere('item_id', $detalle->item_id);
            $taxRate = $detalle->porcentaje_itbms !== null
                ? (float) $detalle->porcentaje_itbms
                : ($originalLine
                    ? (float) ($originalLine->porcentaje_itbms ?? 0)
                    : (float) ($item->tax->tasa ?? 0));

            return [
                'number' => str_pad((string) ($index + 1), 4, '0', STR_PAD_LEFT),
                'description' => $detalle->descripcion_item ?: $item?->nombre,
                'code' => $detalle->codigo_item ?: $item?->codigo,
                'unit' => $this->resolveUnitCode($item),
                'quantity' => (float) $detalle->cantidad,
                'cpbs' => [
                    'code' => (string) $item->fe_codigo_producto,
                    'unit' => $this->resolveUnitCode($item),
                ],
                'prices' => [
                    'transfer' => (float) $detalle->precio_unitario,
                    'discount' => 0,
                ],
                'itbms' => [
                    'rate' => $this->mapTaxRate($taxRate),
                ],
            ];
        })->all();
    }

    private function validateInvoiceData(FacturaVenta $factura): void
    {
        $config = $this->config();
        $securityCode = preg_replace('/\D+/', '', (string) ($config->fe_security_code ?? ''));

        if (strlen($securityCode) !== 9 || $securityCode === '000000000') {
            throw new RuntimeException(
                'El Security Code QR no esta configurado correctamente (debe ser un valor numerico de 9 digitos). '
                . 'Ve a Configuracion > Facturacion Electronica y actualiza el Security Code.'
            );
        }

        if (!$factura->cliente) {
            throw new RuntimeException('La factura no tiene cliente asociado.');
        }

        if (blank($factura->cliente->razon_social) || blank($factura->cliente->identificacion)) {
            throw new RuntimeException('El cliente debe tener razon social e identificacion para emitir factura electronica.');
        }

        if ($factura->cliente->tipo_identificacion === 'RUC' && blank($factura->cliente->dv ?: $factura->cliente->digito_verificador)) {
            throw new RuntimeException('El cliente con RUC debe tener DV configurado para FE Panama.');
        }

        if ($factura->detalles->isEmpty()) {
            throw new RuntimeException('La factura no tiene lineas para emitir electronicamente.');
        }

        foreach ($factura->detalles as $detalle) {
            if (!$detalle->item) {
                throw new RuntimeException('Hay una linea de factura sin articulo asociado.');
            }

            if (blank($detalle->item->fe_codigo_producto)) {
                throw new RuntimeException('El articulo ' . $detalle->item->nombre . ' no tiene codigo fiscal configurado para FE Panama.');
            }

            if (!is_numeric($detalle->item->fe_codigo_producto)) {
                throw new RuntimeException('El codigo fiscal del articulo ' . $detalle->item->nombre . ' debe ser numerico para CPBS.');
            }
        }
    }

    private function validateCreditNoteData(NotaCredito $nota): void
    {
        $config = $this->config();
        $securityCode = preg_replace('/\D+/', '', (string) ($config->fe_security_code ?? ''));

        if (strlen($securityCode) !== 9 || $securityCode === '000000000') {
            throw new RuntimeException(
                'El Security Code QR no esta configurado correctamente (debe ser un valor numerico de 9 digitos). '
                . 'Ve a Configuracion > Facturacion Electronica y actualiza el Security Code.'
            );
        }

        if ($nota->estado !== 'Activa') {
            throw new RuntimeException('Solo se pueden emitir electronicamente notas de credito activas.');
        }

        if (!$nota->factura) {
            throw new RuntimeException('Solo se soportan notas de credito electronicas asociadas a una factura del sistema.');
        }

        if (blank($nota->factura->fe_document_id)) {
            throw new RuntimeException('La factura referenciada aun no tiene un documento electronico en Alanube.');
        }

        if (strtoupper((string) $nota->factura->fe_legal_status) !== 'DGI_AUTHORIZED') {
            throw new RuntimeException('La factura referenciada debe estar autorizada por la DGI antes de emitir una nota de credito.');
        }

        $cliente = $nota->cliente ?: $nota->factura->cliente;

        if (!$cliente) {
            throw new RuntimeException('La nota de credito no tiene cliente asociado.');
        }

        if (blank($cliente->razon_social) || blank($cliente->identificacion)) {
            throw new RuntimeException('El cliente debe tener razon social e identificacion para emitir la nota de credito electronica.');
        }

        if ($cliente->tipo_identificacion === 'RUC' && blank($cliente->dv ?: $cliente->digito_verificador)) {
            throw new RuntimeException('El cliente con RUC debe tener DV configurado para FE Panama.');
        }

        if ($nota->detalles->isEmpty()) {
            throw new RuntimeException('La nota de credito no tiene lineas para emitir electronicamente.');
        }

        foreach ($nota->detalles as $detalle) {
            if (!$detalle->item) {
                throw new RuntimeException('Hay una linea de nota de credito sin articulo asociado.');
            }

            if (blank($detalle->item->fe_codigo_producto)) {
                throw new RuntimeException('El articulo ' . $detalle->item->nombre . ' no tiene codigo fiscal configurado para FE Panama.');
            }

            if (!is_numeric($detalle->item->fe_codigo_producto)) {
                throw new RuntimeException('El codigo fiscal del articulo ' . $detalle->item->nombre . ' debe ser numerico para CPBS.');
            }
        }
    }

    private function validateDebitNoteData(NotaDebito $nota): void
    {
        $config = $this->config();
        $securityCode = preg_replace('/\D+/', '', (string) ($config->fe_security_code ?? ''));

        if (strlen($securityCode) !== 9 || $securityCode === '000000000') {
            throw new RuntimeException(
                'El Security Code QR no esta configurado correctamente (debe ser un valor numerico de 9 digitos). '
                . 'Ve a Configuracion > Facturacion Electronica y actualiza el Security Code.'
            );
        }

        if ($nota->estado !== 'Activa') {
            throw new RuntimeException('Solo se pueden emitir electronicamente notas de debito activas.');
        }

        if (!$nota->factura) {
            throw new RuntimeException('Solo se soportan notas de debito electronicas asociadas a una factura del sistema.');
        }

        if (blank($nota->factura->fe_document_id)) {
            throw new RuntimeException('La factura referenciada aun no tiene un documento electronico en Alanube.');
        }

        if (strtoupper((string) $nota->factura->fe_legal_status) !== 'DGI_AUTHORIZED') {
            throw new RuntimeException('La factura referenciada debe estar autorizada por la DGI antes de emitir una nota de debito.');
        }

        $cliente = $nota->cliente ?: $nota->factura->cliente;

        if (!$cliente) {
            throw new RuntimeException('La nota de debito no tiene cliente asociado.');
        }

        if (blank($cliente->razon_social) || blank($cliente->identificacion)) {
            throw new RuntimeException('El cliente debe tener razon social e identificacion para emitir la nota de debito electronica.');
        }

        if ($cliente->tipo_identificacion === 'RUC' && blank($cliente->dv ?: $cliente->digito_verificador)) {
            throw new RuntimeException('El cliente con RUC debe tener DV configurado para FE Panama.');
        }

        if ($nota->detalles->isEmpty()) {
            throw new RuntimeException('La nota de debito no tiene lineas para emitir electronicamente.');
        }

        foreach ($nota->detalles as $detalle) {
            if (!$detalle->item) {
                throw new RuntimeException('Hay una linea de nota de debito sin articulo asociado.');
            }

            if (blank($detalle->item->fe_codigo_producto)) {
                throw new RuntimeException('El articulo ' . $detalle->item->nombre . ' no tiene codigo fiscal configurado para FE Panama.');
            }

            if (!is_numeric($detalle->item->fe_codigo_producto)) {
                throw new RuntimeException('El codigo fiscal del articulo ' . $detalle->item->nombre . ' debe ser numerico para CPBS.');
            }
        }
    }

    private function extractErrorMessage(array $body, string $fallback): string
    {
        $topErrors = collect(data_get($body, 'errors', []))
            ->pluck('message')
            ->filter()
            ->implode(' | ');

        $governmentMessages = collect(data_get($body, 'governmentResponse', []))
            ->pluck('message')
            ->filter()
            ->implode(' | ');

        return $topErrors
            ?: data_get($body, 'message')
            ?: data_get($body, 'error')
            ?: data_get($body, 'response.0.message')
            ?: data_get($body, 'governmentResponse.0.message')
            ?: $governmentMessages
            ?: $fallback;
    }

    private function shouldRetryWithFreshQr(array $body): bool
    {
        $code = (string) data_get($body, 'code', '');
        $message = mb_strtolower((string) (data_get($body, 'message') ?: ''));

        return $code === 'AP1010'
            || str_contains($message, 'company qr not requested or wrong')
            || str_contains($message, 'qr');
    }

    private function fetchCompany(): array
    {
        $config = $this->config();
        $companyId = $config->fe_company_id;

        if (filled($companyId)) {
            $response = Http::withToken($config->fe_jwt_token)
                ->acceptJson()
                ->get(rtrim($config->fe_api_base_url, '/') . '/companies/' . $companyId);

            if ($response->successful()) {
                return $response->json() ?: [];
            }
        }

        $response = Http::withToken($config->fe_jwt_token)
            ->acceptJson()
            ->get(rtrim($config->fe_api_base_url, '/') . '/company');

        if ($response->failed()) {
            throw new RuntimeException('No se pudo consultar la compania principal en Alanube.');
        }

        return $response->json() ?: [];
    }

    private function fetchOffice(?string $companyId): array
    {
        $config = $this->config();
        $officeId = $config->fe_office_id;

        if (filled($officeId) && filled($companyId)) {
            $response = Http::withToken($config->fe_jwt_token)
                ->acceptJson()
                ->get(rtrim($config->fe_api_base_url, '/') . '/companies/' . $companyId . '/offices/' . $officeId);

            if ($response->successful()) {
                return $response->json() ?: [];
            }
        }

        if (blank($companyId)) {
            return [];
        }

        $response = Http::withToken($config->fe_jwt_token)
            ->acceptJson()
            ->get(rtrim($config->fe_api_base_url, '/') . '/companies/' . $companyId . '/office');

        if ($response->failed()) {
            return [];
        }

        return $response->json() ?: [];
    }

    private function ensureCompanyAffiliated(array $company): void
    {
        $affiliated = strtoupper((string) data_get($company, 'affiliated'));

        if ($affiliated !== 'SUBSCRIBED') {
            throw new RuntimeException(
                'La empresa emisora en Alanube aun no esta afiliada para emitir en DGI. Estado actual: '
                . ($affiliated ?: 'DESCONOCIDO')
                . '. Debes completar la afiliacion en el portal reseller antes de emitir.'
            );
        }
    }

    private function resolveBillingPoint(array $office): string
    {
        $code = preg_replace('/\D+/', '', (string) data_get($office, 'code', ''));
        $code = str_pad(substr($code, -3), 3, '0', STR_PAD_LEFT);

        return $code === '000' ? '001' : $code;
    }

    private function resolveSecurityCode(AlanubeEnvironmentConfig $config, array $company = []): string
    {
        $configuredSecurityCode = preg_replace('/\D+/', '', (string) ($config->fe_security_code ?? ''));

        if ($configuredSecurityCode !== '' && strlen($configuredSecurityCode) === 9 && $configuredSecurityCode !== '000000000') {
            return $configuredSecurityCode;
        }

        $companyQr = preg_replace('/\D+/', '', (string) data_get($company, 'qr', ''));

        if ($companyQr !== '' && strlen($companyQr) === 9 && $companyQr !== '000000000') {
            if ($config->exists) {
                $config->update(['fe_security_code' => $companyQr]);
            }

            return $companyQr;
        }

        throw new RuntimeException(
            'No hay un Security Code QR valido configurado (9 digitos numericos). '
            . 'Ve a Configuracion > Facturacion Electronica > Security Code y guarda el codigo correcto de Alanube.'
        );
    }

    private function resolveUnitCode($item): string
    {
        if ($item && filled($item->fe_codigo_unidad)) {
            return $this->normalizeAlanubeUnitCode($item->fe_codigo_unidad);
        }

        return match (strtoupper((string) ($item?->unidad_medida ?? 'UND'))) {
            'MT', 'M', 'METRO', 'METROS' => 'm',
            'MT2', 'M2', 'MTS2' => 'm2',
            'CM' => 'cm',
            'CM2' => 'cm2',
            'KG' => 'kg',
            'LT', 'L' => 'l',
            'OZ' => 'oz',
            'UND', 'UN', 'U', 'UNIDAD', 'UNIDADES' => 'und',
            default => 'und',
        };
    }

    private function normalizeAlanubeUnitCode(?string $unit): string
    {
        $normalized = trim((string) $unit);

        return match (strtolower($normalized)) {
            'mtr', 'mt', 'm', 'metro', 'metros' => 'm',
            'mtk', 'm2', 'metro2', 'metros2' => 'm2',
            'cmt', 'cm', 'centimetro', 'centimetros' => 'cm',
            'cmk', 'cm2' => 'cm2',
            'kgm', 'kg' => 'kg',
            'ltr', 'lt', 'l' => 'l',
            'onz', 'oz' => 'oz',
            'und', 'un', 'u', 'unidad', 'unidades' => 'und',
            default => $normalized !== '' ? $normalized : 'und',
        };
    }

    private function resolvePaymentTime(FacturaVenta $factura): int
    {
        if ($factura->fecha_vencimiento && $factura->fecha_emision && $factura->fecha_vencimiento->gt($factura->fecha_emision)) {
            return 2;
        }

        return 1;
    }

    private function resolveSaleType(FacturaVenta $factura): int
    {
        $allServices = $factura->detalles->every(fn ($detalle) => $detalle->item?->tipo === 'Servicio');

        return $allServices ? 4 : 1;
    }

    private function resolveEffectiveDiscountTotal(FacturaVenta $factura): float
    {
        $storedDiscount = round((float) ($factura->descuento_total ?? 0), 2);

        if ($storedDiscount > 0) {
            return $storedDiscount;
        }

        $inferredDiscount = round(((float) $factura->subtotal + (float) $factura->itbms_total) - (float) $factura->total, 2);

        return $inferredDiscount > 0 ? $inferredDiscount : 0.0;
    }

    private function buildInstallmentPayment(FacturaVenta $factura, int $paymentTime): array
    {
        if ($paymentTime !== 2) {
            return [];
        }

        $dueDate = $this->buildDueDate($factura);

        return [
            [
                'sequence' => 1,
                'dueDate' => $dueDate,
                'amount' => (float) $factura->total,
                'information' => 'Cuota unica generada desde ERP',
            ],
        ];
    }

    private function extractSequentialNumber(string $invoiceNumber): int
    {
        preg_match('/(\d+)/', $invoiceNumber, $matches);

        return isset($matches[1]) ? (int) $matches[1] : 1;
    }

    private function unwrapDocumentPayload(array $body): array
    {
        return is_array(data_get($body, 'document')) ? data_get($body, 'document') : $body;
    }

    private function extractGovernmentRejectionMessage(array $document): ?string
    {
        $legalStatus = strtoupper((string) data_get($document, 'legalStatus'));

        if (!str_contains($legalStatus, 'REJECTED')) {
            return null;
        }

        $messages = collect(data_get($document, 'governmentResponse', []))
            ->pluck('message')
            ->filter()
            ->implode(' | ');

        return $messages !== '' ? $messages : 'La DGI rechazo el documento electronico.';
    }

    private function resolveDocumentNumeration(FacturaVenta $factura): string
    {
        $config = $this->config();
        $rangeStart = (int) ($config->fe_invoice_range_start ?? 0);
        $rangeEnd = (int) ($config->fe_invoice_range_end ?? 0);
        $localSequential = max($this->extractSequentialNumber((string) $factura->numero_factura), 1);

        if ($rangeStart > 0) {
            $feSequential = $rangeStart + ($localSequential - 1);

            if ($rangeEnd > 0 && $feSequential > $rangeEnd) {
                throw new RuntimeException(
                    'La numeracion FE calculada (' . $feSequential . ') excede el rango configurado '
                    . $rangeStart . '-' . $rangeEnd . '.'
                );
            }

            return str_pad((string) $feSequential, 10, '0', STR_PAD_LEFT);
        }

        return str_pad((string) $localSequential, 10, '0', STR_PAD_LEFT);
    }

    private function resolveCreditNoteNumeration(NotaCredito $nota): string
    {
        $localSequential = max($this->extractSequentialNumber((string) $nota->numero_nota), 1);

        return str_pad((string) $localSequential, 10, '0', STR_PAD_LEFT);
    }

    private function resolveDebitNoteNumeration(NotaDebito $nota): string
    {
        $localSequential = max($this->extractSequentialNumber((string) $nota->numero_nota), 1);

        return str_pad((string) $localSequential, 10, '0', STR_PAD_LEFT);
    }

    private function resolveCreditNoteModificationCode(NotaCredito $nota): int
    {
        if ($nota->factura && abs((float) $nota->total - (float) $nota->factura->total) < 0.01) {
            return 1;
        }

        return 3;
    }

    private function resolveDebitNoteModificationCode(NotaDebito $nota): int
    {
        return match ($nota->tipo_nota) {
            'interes' => 2,
            'recargo', 'ajuste' => 3,
            default => 3,
        };
    }

    private function composePanamaRuc(?string $identification, ?string $dv): string
    {
        $identification = trim((string) $identification);
        $dv = trim((string) $dv);

        if ($identification === '' || $dv === '') {
            return $identification;
        }

        if (substr_count($identification, '-') >= 2) {
            return $identification;
        }

        if (substr_count($identification, '-') === 1) {
            [$left, $right] = explode('-', $identification, 2);
            return $left . '-' . $dv . '-' . $right;
        }

        return $identification . '-' . $dv;
    }

    private function normalizeFixedLengthText(string $value, int $length): string
    {
        $normalized = trim(preg_replace('/\s+/', ' ', $value));

        return mb_strlen($normalized) > $length
            ? mb_substr($normalized, 0, $length)
            : $normalized;
    }

    private function formatPhoneList(?string $phone): array
    {
        $digits = preg_replace('/\D+/', '', (string) $phone);

        if (strlen($digits) === 7) {
            return [substr($digits, 0, 3) . '-' . substr($digits, 3)];
        }

        if (strlen($digits) === 8) {
            return [substr($digits, 0, 4) . '-' . substr($digits, 4)];
        }

        return [];
    }

    private function formatEmailList(?string $email): array
    {
        $email = trim((string) $email);

        if (!filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($email) > 50) {
            return [];
        }

        return [$email];
    }

    private function resolveReceiverLocationCode($cliente, array $office): string
    {
        $candidates = [
            data_get($cliente, 'codigo_ubicacion_dgi'),
            data_get($cliente, 'ubicacion_dgi'),
            data_get($cliente, 'location'),
            data_get($cliente, 'location_code'),
            data_get($office, 'location'),
        ];

        foreach ($candidates as $candidate) {
            $value = trim((string) $candidate);
            if (preg_match('/^\d-\d-\d$/', $value)) {
                return $value;
            }
            if (preg_match('/^\d{8}$/', $value)) {
                return $value;
            }
        }

        return '8-8-7';
    }

    private function mapTaxRate($percent): string
    {
        $value = (float) $percent;

        return match (true) {
            abs($value - 7) < 0.0001 => '01',
            abs($value - 10) < 0.0001 => '02',
            abs($value - 15) < 0.0001 => '03',
            default => '00',
        };
    }

    private function buildIssueDate(FacturaVenta $factura): string
    {
        $date = $this->resolveIssueDateString($factura);
        $time = now(self::PANAMA_TIMEZONE)->format('H:i:s');

        return Carbon::createFromFormat('Y-m-d H:i:s', $date . ' ' . $time, self::PANAMA_TIMEZONE)
            ->format('Y-m-d\\TH:i:sP');
    }

    private function buildCreditNoteIssueDate(NotaCredito $nota): string
    {
        $date = $this->extractRawDate($nota->getRawOriginal('fecha'))
            ?: $nota->created_at?->copy()?->setTimezone(self::PANAMA_TIMEZONE)->format('Y-m-d')
            ?: now(self::PANAMA_TIMEZONE)->format('Y-m-d');

        $time = now(self::PANAMA_TIMEZONE)->format('H:i:s');

        return Carbon::createFromFormat('Y-m-d H:i:s', $date . ' ' . $time, self::PANAMA_TIMEZONE)
            ->format('Y-m-d\\TH:i:sP');
    }

    private function buildDebitNoteIssueDate(NotaDebito $nota): string
    {
        $date = $this->extractRawDate($nota->getRawOriginal('fecha'))
            ?: $nota->created_at?->copy()?->setTimezone(self::PANAMA_TIMEZONE)->format('Y-m-d')
            ?: now(self::PANAMA_TIMEZONE)->format('Y-m-d');

        $time = now(self::PANAMA_TIMEZONE)->format('H:i:s');

        return Carbon::createFromFormat('Y-m-d H:i:s', $date . ' ' . $time, self::PANAMA_TIMEZONE)
            ->format('Y-m-d\\TH:i:sP');
    }

    private function buildDueDate(FacturaVenta $factura): string
    {
        $date = $this->resolveDueDateString($factura);

        return Carbon::createFromFormat('Y-m-d H:i:s', $date . ' 12:00:00', self::PANAMA_TIMEZONE)
            ->format('Y-m-d\\TH:i:sP');
    }

    private function resolveIssueDateString(FacturaVenta $factura): string
    {
        $rawIssueDate = $this->extractRawDate($factura->getRawOriginal('fecha_emision'));
        $panamaCreatedDate = $factura->created_at?->copy()?->setTimezone(self::PANAMA_TIMEZONE)->format('Y-m-d');
        $utcCreatedDate = $factura->created_at?->copy()?->setTimezone('UTC')->format('Y-m-d');

        if ($rawIssueDate && $panamaCreatedDate && $utcCreatedDate && $rawIssueDate === $utcCreatedDate && $utcCreatedDate !== $panamaCreatedDate) {
            return $panamaCreatedDate;
        }

        if ($rawIssueDate) {
            return $rawIssueDate;
        }

        if ($panamaCreatedDate) {
            return $panamaCreatedDate;
        }

        return now(self::PANAMA_TIMEZONE)->format('Y-m-d');
    }

    private function resolveDueDateString(FacturaVenta $factura): string
    {
        $rawIssueDate = $this->extractRawDate($factura->getRawOriginal('fecha_emision'));
        $rawDueDate = $this->extractRawDate($factura->getRawOriginal('fecha_vencimiento'));
        $resolvedIssueDate = $this->resolveIssueDateString($factura);

        if ($rawIssueDate && $rawDueDate) {
            $daysDelta = Carbon::parse($rawIssueDate)->diffInDays(Carbon::parse($rawDueDate), false);

            return Carbon::createFromFormat('Y-m-d', $resolvedIssueDate, self::PANAMA_TIMEZONE)
                ->addDays($daysDelta)
                ->format('Y-m-d');
        }

        if ($rawDueDate) {
            return $rawDueDate;
        }

        return $resolvedIssueDate;
    }

    private function extractRawDate(mixed $rawValue): ?string
    {
        if (is_string($rawValue) && preg_match('/^\d{4}-\d{2}-\d{2}/', $rawValue, $matches)) {
            return $matches[0];
        }

        return null;
    }

    private function requireApiCredentials(): AlanubeEnvironmentConfig
    {
        $config = $this->config();

        if (blank($config->fe_api_base_url) || blank($config->fe_jwt_token)) {
            throw new RuntimeException('La configuracion del ambiente Alanube esta incompleta. Debes guardar Base URL y JWT antes de continuar.');
        }

        return $config;
    }
}
