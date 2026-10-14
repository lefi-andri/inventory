<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('promotions', function (Blueprint $table) {
            $table->id();
            $table->string('kind', 20);
            $table->string('code')->unique();
            $table->string('description')->nullable();
            $table->string('discount_type', 20);
            $table->decimal('value', 15, 2);
            $table->decimal('min_order', 15, 2)->default(0);
            $table->decimal('max_discount', 15, 2)->nullable();
            $table->unsignedInteger('usage_limit')->nullable();
            $table->unsignedInteger('used_count')->default(0);
            $table->timestamp('starts_at')->nullable();
            $table->timestamp('ends_at')->nullable();
            $table->boolean('is_active')->default(true)->index();
            $table->timestamps();
        });

        Schema::create('commerce_settings', function (Blueprint $table) {
            $table->id();
            $table->decimal('shipping_cost', 15, 2)->default(25000);
            $table->decimal('free_shipping_threshold', 15, 2)->nullable()->default(500000);
            $table->timestamps();
        });

        Schema::table('orders', function (Blueprint $table) {
            $table->foreignId('promotion_id')->nullable()->after('payment_status')->constrained()->nullOnDelete();
            $table->string('promotion_code')->nullable()->after('promotion_id');
            $table->string('promotion_kind', 20)->nullable()->after('promotion_code');
            $table->decimal('discount_amount', 15, 2)->default(0)->after('subtotal');
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropConstrainedForeignId('promotion_id');
            $table->dropColumn(['promotion_code', 'promotion_kind', 'discount_amount']);
        });
        Schema::dropIfExists('commerce_settings');
        Schema::dropIfExists('promotions');
    }
};
