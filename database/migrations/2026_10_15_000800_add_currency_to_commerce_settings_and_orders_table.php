<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('commerce_settings', function (Blueprint $table) {
            $table->string('currency', 10)->default('IDR')->after('shipping_label');
        });

        Schema::table('orders', function (Blueprint $table) {
            $table->string('currency', 10)->default('IDR')->after('payment_details');
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn('currency');
        });

        Schema::table('commerce_settings', function (Blueprint $table) {
            $table->dropColumn('currency');
        });
    }
};
