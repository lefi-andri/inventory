<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('commerce_settings', function (Blueprint $table) {
            $table->string('shipping_label')->default('Pengiriman reguler')->after('id');
            $table->boolean('bank_transfer_enabled')->default(true)->after('free_shipping_threshold');
            $table->string('bank_name')->nullable()->after('bank_transfer_enabled');
            $table->string('bank_account_number')->nullable()->after('bank_name');
            $table->string('bank_account_name')->nullable()->after('bank_account_number');
            $table->boolean('cod_enabled')->default(false)->after('bank_account_name');
            $table->text('payment_instructions')->nullable()->after('cod_enabled');
        });

        Schema::table('orders', function (Blueprint $table) {
            $table->string('shipping_method')->default('Pengiriman reguler')->after('shipping_address');
            $table->string('payment_method', 30)->nullable()->after('payment_status');
            $table->json('payment_details')->nullable()->after('payment_method');
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn(['shipping_method', 'payment_method', 'payment_details']);
        });

        Schema::table('commerce_settings', function (Blueprint $table) {
            $table->dropColumn([
                'shipping_label',
                'bank_transfer_enabled',
                'bank_name',
                'bank_account_number',
                'bank_account_name',
                'cod_enabled',
                'payment_instructions',
            ]);
        });
    }
};
