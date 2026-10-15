<?php

use App\Models\Category;
use App\Models\Order;
use App\Models\Product;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

function createTestProduct(array $attributes = []): Product
{
    $category = Category::create(['name' => 'Elektronik ' . uniqid(), 'slug' => 'elektronik-' . uniqid()]);

    return Product::create([
        'category_id' => $category->id,
        'name' => 'Laptop Gaming Pro',
        'slug' => 'laptop-gaming-pro-' . uniqid(),
        'sku' => 'LAPTOP-PRO-01',
        'description' => 'Laptop gaming bertenaga tinggi.',
        'translations' => [
            'id' => ['name' => 'Laptop Gaming Pro', 'description' => 'Laptop gaming bertenaga tinggi.'],
            'en' => ['name' => 'Gaming Pro Laptop', 'description' => 'High performance gaming laptop.'],
        ],
        'price' => 15000000,
        'cost' => 12000000,
        'stock' => 10,
        'low_stock_threshold' => 2,
        'is_active' => true,
        'is_discontinued' => false,
        ...$attributes,
    ]);
}

test('customer purchase history remains unchanged even when product details are changed later in inventory', function () {
    $product = createTestProduct();
    $customer = User::factory()->create();

    // Customer ordered the product at original price (15.000.000) and original name/SKU
    $order = Order::create([
        'user_id' => $customer->id,
        'order_number' => 'ORD-HIST-001',
        'customer_name' => $customer->name,
        'customer_email' => $customer->email,
        'shipping_address' => 'Jl. Mawar No. 10, Jakarta',
        'status' => 'processing',
        'payment_status' => 'paid',
        'subtotal' => 30000000,
        'shipping_cost' => 50000,
        'total' => 30050000,
    ]);

    $order->items()->create([
        'product_id' => $product->id,
        'product_name' => 'Laptop Gaming Pro',
        'sku' => 'LAPTOP-PRO-01',
        'price' => 15000000,
        'quantity' => 2,
        'subtotal' => 30000000,
    ]);

    // Admin updates the product in inventory with new price, new name, new SKU, new translations
    $product->update([
        'name' => 'Laptop Ultra Max 2026',
        'sku' => 'LAPTOP-ULTRA-99',
        'price' => 25000000,
        'translations' => [
            'id' => ['name' => 'Laptop Ultra Max 2026', 'description' => 'Laptop ultra generasi terbaru.'],
            'en' => ['name' => 'Ultra Max Laptop 2026', 'description' => 'Next gen ultra laptop.'],
        ],
        'is_discontinued' => true,
    ]);

    // Check that customer purchase history still reflects the historical values
    $this->actingAs($customer)
        ->get(route('customer.orders.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Customer/Orders')
            ->has('orders', 1)
            ->where('orders.0.order_number', 'ORD-HIST-001')
            ->where('orders.0.items.0.product_name', 'Laptop Gaming Pro')
            ->where('orders.0.items.0.sku', 'LAPTOP-PRO-01')
            ->where('orders.0.items.0.price', 15000000)
            ->where('orders.0.items.0.quantity', 2)
            ->where('orders.0.items.0.subtotal', 30000000)
            // The item's product payload for dialog must also retain historical snapshot
            ->where('orders.0.items.0.product.name', 'Laptop Gaming Pro')
            ->where('orders.0.items.0.product.sku', 'LAPTOP-PRO-01')
            ->where('orders.0.items.0.product.price', 15000000)
            ->where('orders.0.items.0.product.quantity', 2)
            ->where('orders.0.items.0.product.subtotal', 30000000)
            ->where('orders.0.items.0.product.is_historical', true)
        );
});

test('customer can still view purchase history even if product was permanently deleted', function () {
    $product = createTestProduct();
    $customer = User::factory()->create();

    $order = Order::create([
        'user_id' => $customer->id,
        'order_number' => 'ORD-HIST-002',
        'customer_name' => $customer->name,
        'customer_email' => $customer->email,
        'shipping_address' => 'Jl. Melati No. 5, Surabaya',
        'status' => 'completed',
        'payment_status' => 'paid',
        'subtotal' => 15000000,
        'shipping_cost' => 0,
        'total' => 15000000,
    ]);

    $order->items()->create([
        'product_id' => $product->id,
        'product_name' => 'Laptop Gaming Pro',
        'sku' => 'LAPTOP-PRO-01',
        'price' => 15000000,
        'quantity' => 1,
        'subtotal' => 15000000,
    ]);

    // Product is force deleted from database
    $product->delete();

    // Verify customer's order history can still load without throwing exceptions
    $this->actingAs($customer)
        ->get(route('customer.orders.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Customer/Orders')
            ->has('orders', 1)
            ->where('orders.0.items.0.product_name', 'Laptop Gaming Pro')
            ->where('orders.0.items.0.sku', 'LAPTOP-PRO-01')
            ->where('orders.0.items.0.price', 15000000)
            ->where('orders.0.items.0.product.name', 'Laptop Gaming Pro')
            ->where('orders.0.items.0.product.price', 15000000)
            ->where('orders.0.items.0.product.is_historical', true)
        );
});
