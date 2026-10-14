<?php

use App\Models\Category;
use App\Models\InventoryMovement;
use App\Models\Order;
use App\Models\Product;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;
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
        'phone' => '08123456789',
        'shipping_address' => 'Jl. Testing No. 1, Jakarta',
        'checkout_notes' => 'Titipkan ke satpam',
    ]);

    $response = $this->actingAs($customer)->post('/checkout', [
        'items' => [['product_id' => $product->id, 'quantity' => 2]],
    ]);

    $response->assertSessionHasNoErrors();
    expect(Order::count())->toBe(1)
        ->and(Order::first()->user_id)->toBe($customer->id)
        ->and(Order::first()->customer_email)->toBe('budi@example.com')
        ->and(Order::first()->customer_phone)->toBe('08123456789')
        ->and(Order::first()->shipping_address)->toBe('Jl. Testing No. 1, Jakarta')
        ->and(Order::first()->notes)->toBe('Titipkan ke satpam')
        ->and($product->refresh()->stock)->toBe(8)
        ->and(InventoryMovement::first()->quantity)->toBe(-2)
        ->and(InventoryMovement::first()->type)->toBe('order_reservation');
});

test('guests must login before viewing purchase history', function () {
    $this->get(route('customer.orders.index'))->assertRedirect(route('login'));
});

test('customers only see their own purchase history with product details', function () {
    $product = createProduct();
    $customer = User::factory()->create();
    $otherCustomer = User::factory()->create();

    $ownOrder = Order::create([
        'user_id' => $customer->id,
        'order_number' => 'ORD-MINE-01',
        'customer_name' => $customer->name,
        'customer_email' => $customer->email,
        'shipping_address' => 'Alamat pelanggan',
        'status' => 'processing',
        'payment_status' => 'paid',
        'subtotal' => 100000,
        'shipping_cost' => 25000,
        'total' => 125000,
    ]);
    $ownOrder->items()->create([
        'product_id' => $product->id,
        'product_name' => $product->name,
        'sku' => $product->sku,
        'price' => 100000,
        'quantity' => 1,
        'subtotal' => 100000,
    ]);

    Order::create([
        'user_id' => $otherCustomer->id,
        'order_number' => 'ORD-OTHER-01',
        'customer_name' => $otherCustomer->name,
        'customer_email' => $otherCustomer->email,
        'shipping_address' => 'Alamat pengguna lain',
        'status' => 'new',
        'payment_status' => 'pending',
        'subtotal' => 100000,
        'shipping_cost' => 25000,
        'total' => 125000,
    ]);

    $this->actingAs($customer)
        ->get(route('customer.orders.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Customer/Orders')
            ->has('orders', 1)
            ->where('orders.0.order_number', 'ORD-MINE-01')
            ->where('orders.0.items.0.product.id', $product->id)
            ->where('orders.0.items.0.product.description', $product->description));
});

test('customer can confirm their own shipped order as received', function () {
    $customer = User::factory()->create();
    $order = Order::create([
        'user_id' => $customer->id,
        'order_number' => 'ORD-RECEIVED-01',
        'customer_name' => $customer->name,
        'customer_email' => $customer->email,
        'shipping_address' => 'Alamat pelanggan',
        'status' => 'shipped',
        'payment_status' => 'paid',
        'subtotal' => 100000,
        'shipping_cost' => 25000,
        'total' => 125000,
    ]);

    $response = $this->actingAs($customer)->patch(route('customer.orders.received', $order));

    $response->assertSessionHasNoErrors()
        ->assertSessionHas('success');

    expect($order->refresh()->status)->toBe('completed')
        ->and($order->received_at)->not->toBeNull();
});

test('customer cannot confirm an order that has not been shipped', function () {
    $customer = User::factory()->create();
    $order = Order::create([
        'user_id' => $customer->id,
        'order_number' => 'ORD-PROCESSING-01',
        'customer_name' => $customer->name,
        'customer_email' => $customer->email,
        'shipping_address' => 'Alamat pelanggan',
        'status' => 'processing',
        'payment_status' => 'paid',
        'subtotal' => 100000,
        'shipping_cost' => 25000,
        'total' => 125000,
    ]);

    $response = $this->actingAs($customer)->patch(route('customer.orders.received', $order));

    $response->assertSessionHasErrors('order');
    expect($order->refresh()->status)->toBe('processing')
        ->and($order->received_at)->toBeNull();
});

test('customer cannot confirm another customers order', function () {
    $owner = User::factory()->create();
    $otherCustomer = User::factory()->create();
    $order = Order::create([
        'user_id' => $owner->id,
        'order_number' => 'ORD-OTHER-RECEIVED-01',
        'customer_name' => $owner->name,
        'customer_email' => $owner->email,
        'shipping_address' => 'Alamat pelanggan',
        'status' => 'shipped',
        'payment_status' => 'paid',
        'subtotal' => 100000,
        'shipping_cost' => 25000,
        'total' => 125000,
    ]);

    $this->actingAs($otherCustomer)
        ->patch(route('customer.orders.received', $order))
        ->assertNotFound();

    expect($order->refresh()->status)->toBe('shipped')
        ->and($order->received_at)->toBeNull();
});

test('storefront exposes complete product data for the detail dialog', function () {
    $product = createProduct();

    $this->get(route('storefront'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Storefront')
            ->has('products', 1)
            ->where('products.0.id', $product->id)
            ->where('products.0.description', $product->description)
            ->where('products.0.images', []));
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
    $movement = InventoryMovement::whereBelongsTo($product)->sole();

    expect($product->getMedia('products'))->toHaveCount(1)
        ->and($movement->type)->toBe('opening_balance')
        ->and($movement->quantity)->toBe(5)
        ->and($movement->before_stock)->toBe(0)
        ->and($movement->after_stock)->toBe(5)
        ->and($movement->user_id)->toBe($user->id);
});

test('inventory purchase adds stock and records an auditable movement', function () {
    $product = createProduct(['stock' => 10]);
    $user = User::factory()->create();
    Permission::create(['name' => 'inventory.adjust', 'guard_name' => 'web']);
    $user->givePermissionTo('inventory.adjust');

    $response = $this->actingAs($user)->post(route('inventory.store'), [
        'product_id' => $product->id,
        'type' => 'purchase',
        'quantity' => 7,
        'reference' => 'PO-TEST-001',
        'notes' => 'Penerimaan barang dari pemasok',
    ]);

    $response->assertSessionHasNoErrors();
    $movement = InventoryMovement::sole();

    expect($product->refresh()->stock)->toBe(17)
        ->and($movement->type)->toBe('purchase')
        ->and($movement->quantity)->toBe(7)
        ->and($movement->before_stock)->toBe(10)
        ->and($movement->after_stock)->toBe(17)
        ->and($movement->reference)->toBe('PO-TEST-001');
});

test('damaged inventory uses a positive unit input but deducts stock', function () {
    $product = createProduct(['stock' => 10]);
    $user = User::factory()->create();
    Permission::create(['name' => 'inventory.adjust', 'guard_name' => 'web']);
    $user->givePermissionTo('inventory.adjust');

    $response = $this->actingAs($user)->post(route('inventory.store'), [
        'product_id' => $product->id,
        'type' => 'damaged',
        'quantity' => 3,
        'notes' => 'Rusak saat pemeriksaan gudang',
    ]);

    $response->assertSessionHasNoErrors();
    expect($product->refresh()->stock)->toBe(7)
        ->and(InventoryMovement::sole()->quantity)->toBe(-3);
});

test('directed inventory movements reject ambiguous negative quantities', function () {
    $product = createProduct(['stock' => 10]);
    $user = User::factory()->create();
    Permission::create(['name' => 'inventory.adjust', 'guard_name' => 'web']);
    $user->givePermissionTo('inventory.adjust');

    $response = $this->actingAs($user)->post(route('inventory.store'), [
        'product_id' => $product->id,
        'type' => 'purchase',
        'quantity' => -2,
        'notes' => 'Tanda salah',
    ]);

    $response->assertSessionHasErrors('quantity');
    expect($product->refresh()->stock)->toBe(10)
        ->and(InventoryMovement::count())->toBe(0);
});

test('stock adjustment cannot make inventory negative', function () {
    $product = createProduct(['stock' => 2]);
    $user = User::factory()->create();
    Permission::create(['name' => 'inventory.adjust', 'guard_name' => 'web']);
    $user->givePermissionTo('inventory.adjust');

    $response = $this->actingAs($user)->post(route('inventory.store'), [
        'product_id' => $product->id,
        'type' => 'adjustment',
        'quantity' => -3,
        'notes' => 'Koreksi stok opname',
    ]);

    $response->assertSessionHasErrors('quantity');
    expect($product->refresh()->stock)->toBe(2)
        ->and(InventoryMovement::count())->toBe(0);
});

test('checkout rejects duplicate product lines without changing stock', function () {
    $product = createProduct(['stock' => 5]);
    $customer = User::factory()->create();

    $response = $this->actingAs($customer)->post(route('checkout.store'), [
        'shipping_address' => 'Jl. Testing No. 1, Jakarta',
        'items' => [
            ['product_id' => $product->id, 'quantity' => 3],
            ['product_id' => $product->id, 'quantity' => 3],
        ],
    ]);

    $response->assertSessionHasErrors('items.1.product_id');
    expect($product->refresh()->stock)->toBe(5)
        ->and(Order::count())->toBe(0)
        ->and(InventoryMovement::count())->toBe(0);
});

test('database seeding creates a continuous stock audit and is safe to rerun', function () {
    $this->seed();

    $product = Product::where('sku', 'ACC-001')->firstOrFail();
    $movements = InventoryMovement::whereBelongsTo($product)->oldest('id')->get();

    expect($product->stock)->toBe(30)
        ->and($movements)->toHaveCount(2)
        ->and($movements[0]->type)->toBe('opening_balance')
        ->and($movements[0]->before_stock)->toBe(0)
        ->and($movements[0]->after_stock)->toBe(32)
        ->and($movements[1]->type)->toBe('order_reservation')
        ->and($movements[1]->before_stock)->toBe(32)
        ->and($movements[1]->after_stock)->toBe(30);

    $this->seed();

    expect($product->refresh()->stock)->toBe(30)
        ->and(InventoryMovement::whereBelongsTo($product)->count())->toBe(2);
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
        ->and(InventoryMovement::latest('id')->first()->quantity)->toBe(2)
        ->and(InventoryMovement::latest('id')->first()->type)->toBe('order_cancellation');
});

test('a cancelled order cannot be reopened and deduct stock a second time', function () {
    $product = createProduct(['stock' => 10]);
    $order = Order::create([
        'order_number' => 'ORD-CANCELLED-01', 'customer_name' => 'Test Customer',
        'customer_email' => 'customer@example.com', 'shipping_address' => 'Test address',
        'status' => 'cancelled', 'payment_status' => 'refunded', 'subtotal' => 200000,
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
        'status' => 'processing', 'payment_status' => 'paid',
    ]);

    $response->assertSessionHasErrors('status');
    expect($order->refresh()->status)->toBe('cancelled')
        ->and($product->refresh()->stock)->toBe(10)
        ->and(InventoryMovement::count())->toBe(0);
});

test('a shipped order cannot be cancelled before goods are returned', function () {
    $product = createProduct(['stock' => 8]);
    $order = Order::create([
        'order_number' => 'ORD-SHIPPED-01', 'customer_name' => 'Test Customer',
        'customer_email' => 'customer@example.com', 'shipping_address' => 'Test address',
        'status' => 'shipped', 'payment_status' => 'paid', 'subtotal' => 200000,
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

    $response->assertSessionHasErrors('status');
    expect($order->refresh()->status)->toBe('shipped')
        ->and($product->refresh()->stock)->toBe(8)
        ->and(InventoryMovement::count())->toBe(0);
});
