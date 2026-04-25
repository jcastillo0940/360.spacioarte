<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $columnsToAdd = [];

        if (!Schema::hasColumn('nota_debito_detalles', 'codigo_item')) {
            $columnsToAdd[] = static function (Blueprint $table): void {
                $table->string('codigo_item')->nullable()->after('item_id');
            };
        }

        if (!Schema::hasColumn('nota_debito_detalles', 'descripcion_item')) {
            $columnsToAdd[] = static function (Blueprint $table): void {
                $table->string('descripcion_item')->nullable()->after('codigo_item');
            };
        }

        if (!Schema::hasColumn('nota_debito_detalles', 'subtotal_item')) {
            $columnsToAdd[] = static function (Blueprint $table): void {
                $table->decimal('subtotal_item', 15, 2)->default(0)->after('precio_unitario');
            };
        }

        if (!Schema::hasColumn('nota_debito_detalles', 'porcentaje_itbms')) {
            $columnsToAdd[] = static function (Blueprint $table): void {
                $table->decimal('porcentaje_itbms', 8, 2)->default(0)->after('subtotal_item');
            };
        }

        if (!Schema::hasColumn('nota_debito_detalles', 'itbms_item')) {
            $columnsToAdd[] = static function (Blueprint $table): void {
                $table->decimal('itbms_item', 15, 2)->default(0)->after('porcentaje_itbms');
            };
        }

        foreach ($columnsToAdd as $definition) {
            Schema::table('nota_debito_detalles', $definition);
        }

        DB::statement("
            UPDATE nota_debito_detalles nd
            INNER JOIN items i ON i.id = nd.item_id
            LEFT JOIN notas_debito n ON n.id = nd.nota_debito_id
            LEFT JOIN factura_venta_detalles fvd ON fvd.factura_venta_id = n.factura_venta_id AND fvd.item_id = nd.item_id
            SET
                nd.codigo_item = COALESCE(i.codigo, nd.codigo_item),
                nd.descripcion_item = COALESCE(i.nombre, nd.descripcion_item),
                nd.subtotal_item = ROUND(nd.cantidad * nd.precio_unitario, 2),
                nd.porcentaje_itbms = COALESCE(fvd.porcentaje_itbms, nd.porcentaje_itbms, 0),
                nd.itbms_item = ROUND((nd.cantidad * nd.precio_unitario) * (COALESCE(fvd.porcentaje_itbms, nd.porcentaje_itbms, 0) / 100), 2)
        ");

        DB::statement("
            UPDATE nota_debito_detalles
            SET total_item = ROUND(subtotal_item + itbms_item, 2)
        ");
    }

    public function down(): void
    {
        $columnsToDrop = array_values(array_filter([
            Schema::hasColumn('nota_debito_detalles', 'codigo_item') ? 'codigo_item' : null,
            Schema::hasColumn('nota_debito_detalles', 'descripcion_item') ? 'descripcion_item' : null,
            Schema::hasColumn('nota_debito_detalles', 'subtotal_item') ? 'subtotal_item' : null,
            Schema::hasColumn('nota_debito_detalles', 'porcentaje_itbms') ? 'porcentaje_itbms' : null,
            Schema::hasColumn('nota_debito_detalles', 'itbms_item') ? 'itbms_item' : null,
        ]));

        if ($columnsToDrop !== []) {
            Schema::table('nota_debito_detalles', function (Blueprint $table) use ($columnsToDrop) {
                $table->dropColumn($columnsToDrop);
            });
        }
    }
};
