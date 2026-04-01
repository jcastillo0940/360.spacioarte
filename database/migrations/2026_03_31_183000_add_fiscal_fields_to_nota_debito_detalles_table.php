<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('nota_debito_detalles', function (Blueprint $table) {
            $table->string('codigo_item')->nullable()->after('item_id');
            $table->string('descripcion_item')->nullable()->after('codigo_item');
            $table->decimal('subtotal_item', 15, 2)->default(0)->after('precio_unitario');
            $table->decimal('porcentaje_itbms', 8, 2)->default(0)->after('subtotal_item');
            $table->decimal('itbms_item', 15, 2)->default(0)->after('porcentaje_itbms');
        });

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
        Schema::table('nota_debito_detalles', function (Blueprint $table) {
            $table->dropColumn([
                'codigo_item',
                'descripcion_item',
                'subtotal_item',
                'porcentaje_itbms',
                'itbms_item',
            ]);
        });
    }
};
