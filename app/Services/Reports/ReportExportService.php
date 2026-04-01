<?php

namespace App\Services\Reports;

use App\Models\TenantConfig;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Collection;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ReportExportService
{
    public function toPdf(
        string $title,
        string $startDate,
        string $endDate,
        array $columns,
        array $fields,
        iterable $data,
        bool $landscape = false
    ) {
        $config = TenantConfig::first();
        $rows = $data instanceof Collection ? $data : collect($data);

        $pdf = Pdf::loadView('pdf.reporte_generico', [
            'titulo' => $title,
            'inicio' => $startDate,
            'fin' => $endDate,
            'columnas' => $columns,
            'fields' => $fields,
            'data' => $rows,
            'config' => $config,
        ]);

        if ($landscape) {
            $pdf->setPaper('a4', 'landscape');
        }

        return $pdf->download($this->fileName($title, $startDate, $endDate, 'pdf'));
    }

    public function toCsv(
        string $title,
        string $startDate,
        string $endDate,
        array $columns,
        array $fields,
        iterable $data
    ): StreamedResponse {
        $rows = $data instanceof Collection ? $data : collect($data);
        $fileName = $this->fileName($title, $startDate, $endDate, 'csv');

        return response()->streamDownload(function () use ($columns, $fields, $rows) {
            $handle = fopen('php://output', 'w');
            fputcsv($handle, $columns);

            foreach ($rows as $row) {
                $line = [];

                foreach ($fields as $field) {
                    $value = data_get($row, $field);
                    if (is_bool($value)) {
                        $value = $value ? 'Si' : 'No';
                    }

                    $line[] = is_scalar($value) || $value === null ? $value : json_encode($value, JSON_UNESCAPED_UNICODE);
                }

                fputcsv($handle, $line);
            }

            fclose($handle);
        }, $fileName, [
            'Content-Type' => 'text/csv; charset=UTF-8',
        ]);
    }

    private function fileName(string $title, string $startDate, string $endDate, string $extension): string
    {
        $safeTitle = str($title)->lower()->replace([' ', '/'], ['_', '-'])->value();

        return "{$safeTitle}_{$startDate}_{$endDate}.{$extension}";
    }
}
