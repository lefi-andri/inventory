<?php

use App\Models\Category;
use App\Models\CommerceSetting;
use App\Models\Order;
use App\Models\Product;
use App\Models\Promotion;
use App\Models\User;
use Spatie\Permission\Models\Role;

function promotionProduct(): Product
{
    $category = Category::create(['name' => 'Promo Test', 'slug' => 'promo-test']);
    return Product::create(['category_id' => $category->id, 'name' => 'Produk Promo', 'slug' => 'produk-promo', 'sku' => 'PROMO-001', 'price' => 200000, 'cost' => 100000, 'stock' => 10, 'low_stock_threshold' => 2, 'is_active' => true]);
}

test('checkout applies voucher and manually configured shipping cost', function () {
    $product = promotionProduct();
    $customer = User::factory()->create(['phone' => '08123', 'shipping_address' => 'Alamat test']);
    CommerceSetting::create(['shipping_cost' => 18000, 'free_shipping_threshold' => null]);
    $promotion = Promotion::create(['kind' => 'voucher', 'code' => 'HEMAT10', 'discount_type' => 'percentage', 'value' => 10, 'min_order' => 100000, 'is_active' => true]);

    $this->actingAs($customer)->post(route('checkout.store'), [
        'promotion_code' => 'hemat10',
        'items' => [['product_id' => $product->id, 'quantity' => 2]],
    ])->assertSessionHasNoErrors();

    $order = Order::sole();
    expect((float) $order->subtotal)->toBe(400000.0)
        ->and((float) $order->discount_amount)->toBe(40000.0)
        ->and((float) $order->shipping_cost)->toBe(18000.0)
        ->and((float) $order->total)->toBe(378000.0)
        ->and($order->promotion_code)->toBe('HEMAT10')
        ->and($promotion->refresh()->used_count)->toBe(1);
});

test('free shipping threshold follows admin setting', function () {
    $product = promotionProduct();
    $customer = User::factory()->create(['phone' => '08123', 'shipping_address' => 'Alamat test']);
    CommerceSetting::create(['shipping_cost' => 30000, 'free_shipping_threshold' => 200000]);

    $this->actingAs($customer)->post(route('checkout.store'), [
        'items' => [['product_id' => $product->id, 'quantity' => 1]],
    ])->assertSessionHasNoErrors();

    expect((float) Order::sole()->shipping_cost)->toBe(0.0);
});

test('invalid or expired promotion is rejected without deducting stock', function () {
    $product = promotionProduct();
    $customer = User::factory()->create(['phone' => '08123', 'shipping_address' => 'Alamat test']);
    Promotion::create(['kind' => 'coupon', 'code' => 'EXPIRED', 'discount_type' => 'fixed', 'value' => 50000, 'min_order' => 0, 'ends_at' => now()->subDay(), 'is_active' => true]);

    $this->actingAs($customer)->post(route('checkout.store'), [
        'promotion_code' => 'EXPIRED',
        'items' => [['product_id' => $product->id, 'quantity' => 1]],
    ])->assertSessionHasErrors('promotion_code');

    expect(Order::count())->toBe(0)->and($product->refresh()->stock)->toBe(10);
});

test('customer can validate a promotion before checkout', function () {
    $product = promotionProduct();
    $customer = User::factory()->create();
    Promotion::create(['kind' => 'coupon', 'code' => 'POTONG25', 'discount_type' => 'fixed', 'value' => 25000, 'min_order' => 0, 'is_active' => true]);

    $this->actingAs($customer)->postJson(route('checkout.promotion.validate'), [
        'promotion_code' => 'POTONG25',
        'items' => [['product_id' => $product->id, 'quantity' => 1]],
    ])->assertOk()->assertJsonPath('discount_amount', 25000)->assertJsonPath('promotion.code', 'POTONG25');
});

test('admin can manage promotions and shipping settings', function () {
    $admin = User::factory()->create();
    $admin->assignRole(Role::create(['name' => 'admin', 'guard_name' => 'web']));

    $this->actingAs($admin)->post(route('admin.promotions.store'), [
        'kind' => 'coupon', 'code' => 'NEWCODE', 'description' => 'Promo baru', 'discount_type' => 'fixed',
        'value' => 10000, 'min_order' => 50000, 'max_discount' => null, 'usage_limit' => 20,
        'starts_at' => null, 'ends_at' => null, 'is_active' => true,
    ])->assertSessionHasNoErrors();

    $this->actingAs($admin)->patch(route('admin.shipping-settings.update'), [
        'shipping_cost' => 22000, 'free_shipping_threshold' => 450000,
    ])->assertSessionHasNoErrors();

    expect(Promotion::where('code', 'NEWCODE')->exists())->toBeTrue()
        ->and((float) CommerceSetting::current()->shipping_cost)->toBe(22000.0);
});
