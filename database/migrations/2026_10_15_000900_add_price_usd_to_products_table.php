<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->decimal('price_usd', 15, 2)->nullable()->after('price');
        });

        // Initialize existing products with estimated USD price (rounded to 2 decimals)
        DB::table('products')->whereNull('price_usd')->update([
            'price_usd' => DB::raw('ROUND(price / 15000, 2)'),
        ]);
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn('price_usd');
        });
    }
};
