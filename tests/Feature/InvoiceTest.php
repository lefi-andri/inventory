<?php

use App\Models\Category;
use App\Models\Order;
use App\Models\Product;
use App\Models\SiteSetting;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

beforeEach(function () {
    Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'web']);
    Role::firstOrCreate(['name' => 'customer', 'guard_name' => 'web']);
    $ordersView = Permission::firstOrCreate(['name' => 'orders.view', 'guard_name' => 'web']);

    $adminRole = Role::findByName('admin', 'web');
    $adminRole->givePermissionTo($ordersView);
});

function createInvoiceProduct(array $attributes = []): Product
{
    $category = Category::create([
        'name' => 'Kategori ' . uniqid(),
        'slug' => 'kategori-' . uniqid(),
    ]);

    return Product::create([
        'category_id' => $category->id,
        'name' => 'Produk Tes Invoice',
        'slug' => 'produk-tes-invoice-' . uniqid(),
        'sku' => 'SKU-' . strtoupper(uniqid()),
        'description' => 'Deskripsi produk tes invoice.',
        'price' => 100000,
        'cost' => 80000,
        'stock' => 50,
        'low_stock_threshold' => 5,
        'is_active' => true,
        'is_discontinued' => false,
        ...$attributes,
    ]);
}

test('guest cannot view invoice and is redirected to login', function () {
    $customer = User::factory()->create();
    $order = Order::create([
        'user_id' => $customer->id,
        'order_number' => 'ORD-TEST-GUEST-01',
        'customer_name' => $customer->name,
        'customer_email' => $customer->email,
        'shipping_address' => 'Jl. Kebon Jeruk No. 5',
        'status' => 'processing',
        'payment_status' => 'paid',
        'subtotal' => 100000,
        'total' => 100000,
    ]);

    $response = $this->get(route('orders.invoice', $order));

    $response->assertRedirect(route('login'));
});

test('customer can view their own order invoice with complete order and store data', function () {
    $customer = User::factory()->create();
    $customer->assignRole('customer');

    $product = createInvoiceProduct([
        'price' => 150000,
    ]);

    $order = Order::create([
        'user_id' => $customer->id,
        'order_number' => 'ORD-CUST-OWN-01',
        'customer_name' => $customer->name,
        'customer_email' => $customer->email,
        'customer_phone' => '081234567890',
        'shipping_address' => 'Jl. Thamrin No. 45, Jakarta',
        'shipping_method' => 'JNE Reguler',
        'shipping_cost' => 15000,
        'status' => 'processing',
        'payment_status' => 'paid',
        'payment_method' => 'bank_transfer',
        'payment_details' => [
            'label' => 'Transfer Bank BCA',
            'bank_name' => 'BCA',
            'account_number' => '1234567890',
            'account_name' => 'PT TithoShop Indonesia',
        ],
        'currency' => 'IDR',
        'subtotal' => 300000,
        'discount_amount' => 20000,
        'total' => 295000,
        'promotion_code' => 'HEMAT20',
        'notes' => 'Tolong dibungkus bubble wrap tebal',
    ]);

    $order->items()->create([
        'product_id' => $product->id,
        'product_name' => 'Produk Tes Invoice',
        'sku' => $product->sku,
        'price' => 150000,
        'quantity' => 2,
        'subtotal' => 300000,
    ]);

    $response = $this->actingAs($customer)->get(route('orders.invoice', $order));

    $response->assertOk();
    $response->assertInertia(fn (Assert $page) => $page
        ->component('Orders/Invoice')
        ->has('order', fn (Assert $page) => $page
            ->where('id', $order->id)
            ->where('order_number', 'ORD-CUST-OWN-01')
            ->where('customer_name', $customer->name)
            ->where('customer_email', $customer->email)
            ->where('customer_phone', '081234567890')
            ->where('shipping_address', 'Jl. Thamrin No. 45, Jakarta')
            ->where('shipping_method', 'JNE Reguler')
            ->where('status', 'processing')
            ->where('payment_status', 'paid')
            ->where('currency', 'IDR')
            ->where('subtotal', 300000)
            ->where('discount_amount', 20000)
            ->where('shipping_cost', 15000)
            ->where('total', 295000)
            ->where('promotion_code', 'HEMAT20')
            ->where('notes', 'Tolong dibungkus bubble wrap tebal')
            ->has('items', 1)
            ->where('items.0.product_name', 'Produk Tes Invoice')
            ->where('items.0.quantity', 2)
            ->where('items.0.price', 150000)
            ->where('items.0.subtotal', 300000)
            ->etc()
        )
        ->has('store', fn (Assert $page) => $page
            ->has('name')
            ->etc()
        )
        ->where('isStaff', false)
    );
});

test('customer cannot view another customers order invoice', function () {
    $owner = User::factory()->create();
    $intruder = User::factory()->create();
    $intruder->assignRole('customer');

    $order = Order::create([
        'user_id' => $owner->id,
        'order_number' => 'ORD-PRIVATE-01',
        'customer_name' => $owner->name,
        'customer_email' => $owner->email,
        'shipping_address' => 'Jl. Sudirman No. 1',
        'status' => 'processing',
        'payment_status' => 'paid',
        'subtotal' => 100000,
        'total' => 100000,
    ]);

    $response = $this->actingAs($intruder)->get(route('orders.invoice', $order));

    $response->assertForbidden();
});

test('admin with orders.view permission can view any customers order invoice', function () {
    $admin = User::factory()->create();
    $admin->assignRole('admin');

    $customer = User::factory()->create();
    $order = Order::create([
        'user_id' => $customer->id,
        'order_number' => 'ORD-ADMIN-VIEW-01',
        'customer_name' => $customer->name,
        'customer_email' => $customer->email,
        'shipping_address' => 'Jl. Gatot Subroto No. 99',
        'status' => 'new',
        'payment_status' => 'pending',
        'subtotal' => 250000,
        'total' => 250000,
    ]);

    $response = $this->actingAs($admin)->get(route('orders.invoice', $order));

    $response->assertOk();
    $response->assertInertia(fn (Assert $page) => $page
        ->component('Orders/Invoice')
        ->where('order.id', $order->id)
        ->where('order.order_number', 'ORD-ADMIN-VIEW-01')
        ->where('isStaff', true)
    );
});

test('invoice correctly supports USD currency orders', function () {
    $customer = User::factory()->create();
    $customer->assignRole('customer');

    $order = Order::create([
        'user_id' => $customer->id,
        'order_number' => 'ORD-USD-01',
        'customer_name' => $customer->name,
        'customer_email' => $customer->email,
        'shipping_address' => '500 Howard St, San Francisco, CA',
        'status' => 'processing',
        'payment_status' => 'paid',
        'payment_method' => 'cod',
        'currency' => 'USD',
        'subtotal' => 120.5,
        'shipping_cost' => 15.0,
        'discount_amount' => 10.0,
        'total' => 125.5,
    ]);

    $response = $this->actingAs($customer)->get(route('orders.invoice', $order));

    $response->assertOk();
    $response->assertInertia(fn (Assert $page) => $page
        ->component('Orders/Invoice')
        ->where('order.currency', 'USD')
        ->where('order.subtotal', 120.5)
        ->where('order.shipping_cost', 15)
        ->where('order.discount_amount', 10)
        ->where('order.total', 125.5)
    );
});
