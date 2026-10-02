<?php

use App\Models\Category;
use App\Models\InventoryMovement;
use App\Models\Order;
use App\Models\Product;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Spatie\Permission\Models\Permission;

function createProduct(array $attributes = []): Product
{
    $category = Category::create(['name' => 'Test', 'slug' => 'test']);

    return Product::create([
        'category_id' => $category->id,
        'name' => 'Test Product',
        'slug' => 'test-product',
        'sku' => 'TEST-001',
        'description' => 'A product for testing.',
        'price' => 100000,
        'cost' => 50000,
        'stock' => 10,
        'low_stock_threshold' => 2,
        'is_active' => true,
        ...$attributes,
    ]);
}

test('guests must login before checkout', function () {
    $product = createProduct();

    $this->post('/checkout', [
        'shipping_address' => 'Jl. Testing No. 1, Jakarta',
        'items' => [['product_id' => $product->id, 'quantity' => 2]],
    ])->assertRedirect(route('login'));

    expect(Order::count())->toBe(0)
        ->and($product->refresh()->stock)->toBe(10);
});

test('authenticated customer checkout creates an order and deducts inventory atomically', function () {
    $product = createProduct();
    $customer = User::factory()->create([
        'name' => 'Budi Santoso',
        'email' => 'budi@example.com',
    ]);

    $response = $this->actingAs($customer)->post('/checkout', [
        'customer_phone' => '08123456789',
        'shipping_address' => 'Jl. Testing No. 1, Jakarta',
        'items' => [['product_id' => $product->id, 'quantity' => 2]],
    ]);

    $response->assertSessionHasNoErrors();
    expect(Order::count())->toBe(1)
        ->and(Order::first()->user_id)->toBe($customer->id)
        ->and(Order::first()->customer_email)->toBe('budi@example.com')
        ->and($product->refresh()->stock)->toBe(8)
        ->and(InventoryMovement::first()->quantity)->toBe(-2);
});

test('dashboard is protected by a spatie permission', function () {
    $user = User::factory()->create();

    $this->actingAs($user)->get('/dashboard')->assertForbidden();

    Permission::create(['name' => 'dashboard.view', 'guard_name' => 'web']);
    $user->givePermissionTo('dashboard.view');

    $this->actingAs($user)->get('/dashboard')->assertOk();
});

test('authorized user can create a product with a media library image', function () {
    Storage::fake('public');
    $user = User::factory()->create();
    Permission::create(['name' => 'products.create', 'guard_name' => 'web']);
    $user->givePermissionTo('products.create');
    $category = Category::create(['name' => 'Home', 'slug' => 'home']);

    $response = $this->actingAs($user)->post('/products', [
        'category_id' => $category->id,
        'name' => 'Lampu Test',
        'sku' => 'LMP-001',
        'description' => 'Lampu untuk pengujian.',
        'price' => 250000,
        'cost' => 150000,
        'stock' => 5,
        'low_stock_threshold' => 2,
        'is_active' => true,
        'images' => [UploadedFile::fake()->image('lampu.jpg')],
    ]);

    $response->assertSessionHasNoErrors();
    $product = Product::where('sku', 'LMP-001')->firstOrFail();
    expect($product->getMedia('products'))->toHaveCount(1);
});

test('cancelling an order restores its stock with an audit movement', function () {
    $product = createProduct(['stock' => 8]);
    $order = Order::create([
        'order_number' => 'ORD-CANCEL-01', 'customer_name' => 'Test Customer',
        'customer_email' => 'customer@example.com', 'shipping_address' => 'Test address',
        'status' => 'processing', 'payment_status' => 'paid', 'subtotal' => 200000,
        'shipping_cost' => 0, 'total' => 200000,
    ]);
    $order->items()->create([
        'product_id' => $product->id, 'product_name' => $product->name, 'sku' => $product->sku,
        'price' => 100000, 'quantity' => 2, 'subtotal' => 200000,
    ]);
    $user = User::factory()->create();
    Permission::create(['name' => 'orders.update', 'guard_name' => 'web']);
    $user->givePermissionTo('orders.update');

    $response = $this->actingAs($user)->patch(route('orders.update', $order), [
        'status' => 'cancelled', 'payment_status' => 'refunded',
    ]);

    $response->assertSessionHasNoErrors();
    expect($product->refresh()->stock)->toBe(10)
        ->and(InventoryMovement::latest('id')->first()->quantity)->toBe(2);
});
