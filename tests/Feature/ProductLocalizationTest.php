<?php

use App\Models\Category;
use App\Models\CommerceSetting;
use App\Models\Order;
use App\Models\Product;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Permission;

beforeEach(function () {
    Permission::firstOrCreate(['name' => 'products.create', 'guard_name' => 'web']);
    Permission::firstOrCreate(['name' => 'products.view', 'guard_name' => 'web']);
    Permission::firstOrCreate(['name' => 'products.update', 'guard_name' => 'web']);
});

test('product model returns localized name and description based on active locale', function () {
    $category = Category::create(['name' => 'Elektronik', 'slug' => 'elektronik']);
    $product = Product::create([
        'category_id' => $category->id,
        'name' => 'Lampu Meja',
        'slug' => 'lampu-meja',
        'sku' => 'LMP-001',
        'description' => 'Deskripsi bahasa indonesia.',
        'translations' => [
            'id' => ['name' => 'Lampu Meja', 'description' => 'Deskripsi bahasa indonesia.'],
            'en' => ['name' => 'Desk Lamp', 'description' => 'English desk lamp description.'],
        ],
        'price' => 200000,
        'cost' => 100000,
        'stock' => 10,
        'low_stock_threshold' => 2,
        'is_active' => true,
    ]);

    app()->setLocale('id');
    expect($product->localizedName())->toBe('Lampu Meja')
        ->and($product->localizedDescription())->toBe('Deskripsi bahasa indonesia.');

    app()->setLocale('en');
    expect($product->localizedName())->toBe('Desk Lamp')
        ->and($product->localizedDescription())->toBe('English desk lamp description.');
});

test('product falls back to default name when translation for requested locale is missing', function () {
    $category = Category::create(['name' => 'Aksesoris', 'slug' => 'aksesoris']);
    $product = Product::create([
        'category_id' => $category->id,
        'name' => 'Gantungan Kunci',
        'slug' => 'gantungan-kunci',
        'sku' => 'ACC-999',
        'description' => 'Gantungan kunci kayu.',
        'translations' => [
            'id' => ['name' => 'Gantungan Kunci', 'description' => 'Gantungan kunci kayu.'],
            'en' => ['name' => null, 'description' => null],
        ],
        'price' => 25000,
        'cost' => 10000,
        'stock' => 50,
        'low_stock_threshold' => 5,
        'is_active' => true,
    ]);

    app()->setLocale('en');
    expect($product->localizedName())->toBe('Gantungan Kunci')
        ->and($product->localizedDescription())->toBe('Gantungan kunci kayu.');
});

test('admin can create a product with translations', function () {
    $admin = User::factory()->create();
    $admin->givePermissionTo(['products.create', 'products.view']);
    $category = Category::create(['name' => 'Dapur', 'slug' => 'dapur']);

    $response = $this->actingAs($admin)->post(route('products.store'), [
        'category_id' => $category->id,
        'sku' => 'KCH-001',
        'price' => 150000,
        'cost' => 80000,
        'stock' => 12,
        'low_stock_threshold' => 3,
        'is_active' => true,
        'translations' => [
            'id' => [
                'name' => 'Cangkir Keramik',
                'description' => 'Cangkir buatan tangan.',
            ],
            'en' => [
                'name' => 'Ceramic Mug',
                'description' => 'Handcrafted ceramic mug.',
            ],
        ],
    ]);

    $response->assertSessionHasNoErrors();

    $product = Product::where('sku', 'KCH-001')->firstOrFail();
    expect($product->name)->toBe('Cangkir Keramik')
        ->and($product->description)->toBe('Cangkir buatan tangan.')
        ->and($product->translations['en']['name'])->toBe('Ceramic Mug')
        ->and($product->translations['en']['description'])->toBe('Handcrafted ceramic mug.');
});

test('admin can update product translations', function () {
    $admin = User::factory()->create();
    $admin->givePermissionTo(['products.update', 'products.view']);
    $category = Category::create(['name' => 'Dekorasi', 'slug' => 'dekorasi']);

    $product = Product::create([
        'category_id' => $category->id,
        'name' => 'Vas Bunga',
        'slug' => 'vas-bunga',
        'sku' => 'VAS-001',
        'description' => 'Vas kaca minimalis.',
        'price' => 85000,
        'cost' => 45000,
        'stock' => 15,
        'low_stock_threshold' => 3,
        'is_active' => true,
    ]);

    $response = $this->actingAs($admin)->patch(route('products.update', $product), [
        'category_id' => $category->id,
        'sku' => 'VAS-001',
        'price' => 90000,
        'cost' => 45000,
        'low_stock_threshold' => 3,
        'is_active' => true,
        'translations' => [
            'id' => [
                'name' => 'Vas Bunga Kaca',
                'description' => 'Vas kaca minimalis transparan.',
            ],
            'en' => [
                'name' => 'Glass Flower Vase',
                'description' => 'Minimalist clear glass flower vase.',
            ],
        ],
    ]);

    $response->assertSessionHasNoErrors();

    $product->refresh();
    expect($product->name)->toBe('Vas Bunga Kaca')
        ->and($product->translations['en']['name'])->toBe('Glass Flower Vase')
        ->and($product->translations['en']['description'])->toBe('Minimalist clear glass flower vase.');
});

test('storefront displays localized product details when locale is switched', function () {
    $category = Category::create(['name' => 'Home', 'slug' => 'home']);
    Product::create([
        'category_id' => $category->id,
        'name' => 'Bantal Sofa',
        'slug' => 'bantal-sofa',
        'sku' => 'BTL-001',
        'description' => 'Bantal sofa empuk.',
        'translations' => [
            'id' => ['name' => 'Bantal Sofa', 'description' => 'Bantal sofa empuk.'],
            'en' => ['name' => 'Cushion Pillow', 'description' => 'Soft cushion pillow for sofa.'],
        ],
        'price' => 75000,
        'cost' => 40000,
        'stock' => 20,
        'low_stock_threshold' => 5,
        'is_active' => true,
    ]);

    // Test Indonesian storefront
    $this->withSession(['locale' => 'id'])
        ->get(route('storefront'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Storefront')
            ->where('locale', 'id')
            ->where('products.0.name', 'Bantal Sofa')
            ->where('products.0.description', 'Bantal sofa empuk.'));

    // Test English storefront
    $this->withSession(['locale' => 'en'])
        ->get(route('storefront'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Storefront')
            ->where('locale', 'en')
            ->where('products.0.name', 'Cushion Pillow')
            ->where('products.0.description', 'Soft cushion pillow for sofa.'));
});

test('admin can search products by translated name', function () {
    $admin = User::factory()->create();
    $admin->givePermissionTo('products.view');
    $category = Category::create(['name' => 'Kantor', 'slug' => 'kantor']);

    Product::create([
        'category_id' => $category->id,
        'name' => 'Buku Catatan',
        'slug' => 'buku-catatan',
        'sku' => 'BK-001',
        'description' => 'Buku tulis bergaris.',
        'translations' => [
            'id' => ['name' => 'Buku Catatan', 'description' => 'Buku tulis bergaris.'],
            'en' => ['name' => 'Notebook Hardcover', 'description' => 'Lined notebook.'],
        ],
        'price' => 45000,
        'cost' => 20000,
        'stock' => 10,
        'low_stock_threshold' => 2,
        'is_active' => true,
    ]);

    $this->actingAs($admin)
        ->get(route('products.index', ['search' => 'Notebook']))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Products/Index')
            ->has('products', 1)
            ->where('products.0.sku', 'BK-001'));
});

test('admin can create and update a product with both rupiah and dollar prices', function () {
    $admin = User::factory()->create();
    $admin->givePermissionTo(['products.create', 'products.update', 'products.view']);
    $category = Category::create(['name' => 'Koleksi', 'slug' => 'koleksi']);

    $this->actingAs($admin)->post(route('products.store'), [
        'category_id' => $category->id,
        'name' => 'Meja Kerja Kayu',
        'sku' => 'MJ-001',
        'price' => 1500000,
        'price_usd' => 100.50,
        'cost' => 800000,
        'stock' => 5,
        'low_stock_threshold' => 1,
        'is_active' => true,
    ])->assertSessionHasNoErrors();

    $product = Product::where('sku', 'MJ-001')->firstOrFail();
    expect((float) $product->price)->toBe(1500000.0)
        ->and((float) $product->price_usd)->toBe(100.50);

    $this->actingAs($admin)->patch(route('products.update', $product->id), [
        'category_id' => $category->id,
        'name' => 'Meja Kerja Kayu Premium',
        'sku' => 'MJ-001',
        'price' => 1750000,
        'price_usd' => 115.00,
        'cost' => 900000,
        'low_stock_threshold' => 1,
        'is_active' => true,
    ])->assertSessionHasNoErrors();

    $product->refresh();
    expect((float) $product->price)->toBe(1750000.0)
        ->and((float) $product->price_usd)->toBe(115.00);
});

test('storefront and checkout apply dollar price when currency is USD', function () {
    $category = Category::create(['name' => 'Lifestyle', 'slug' => 'lifestyle']);
    $product = Product::create([
        'category_id' => $category->id,
        'name' => 'Lilin Aromaterapi',
        'slug' => 'lilin-aromaterapi',
        'sku' => 'LLN-001',
        'price' => 150000,
        'price_usd' => 10.00,
        'cost' => 50000,
        'stock' => 10,
        'low_stock_threshold' => 2,
        'is_active' => true,
    ]);

    CommerceSetting::create([
        'currency' => 'USD',
        'shipping_cost' => 5.00,
        'free_shipping_threshold' => null,
        'bank_transfer_enabled' => true,
        'bank_name' => 'Bank of America',
        'bank_account_number' => '12345678',
        'bank_account_name' => 'TithoShop Global',
    ]);

    // Storefront reflects effective price in USD
    $this->get(route('storefront'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Storefront')
            ->where('products.0.price', fn ($val) => (float) $val === 10.0)
            ->where('products.0.price_idr', fn ($val) => (float) $val === 150000.0)
            ->where('products.0.price_usd', fn ($val) => (float) $val === 10.0));

    // Checkout calculates order items using USD price
    $customer = User::factory()->create(['phone' => '08123', 'shipping_address' => 'US Address']);
    $this->actingAs($customer)->post(route('checkout.store'), [
        'payment_method' => 'bank_transfer',
        'items' => [['product_id' => $product->id, 'quantity' => 2]],
    ])->assertSessionHasNoErrors();

    $order = Order::sole();
    expect($order->currency)->toBe('USD')
        ->and((float) $order->subtotal)->toBe(20.00)
        ->and((float) $order->total)->toBe(25.00)
        ->and((float) $order->items->first()->price)->toBe(10.00)
        ->and((float) $order->items->first()->subtotal)->toBe(20.00);
});

test('storefront and checkout apply rupiah price when currency is IDR', function () {
    $category = Category::create(['name' => 'Fashion', 'slug' => 'fashion']);
    $product = Product::create([
        'category_id' => $category->id,
        'name' => 'Tas Kanvas',
        'slug' => 'tas-kanvas',
        'sku' => 'TAS-001',
        'price' => 250000,
        'price_usd' => 16.50,
        'cost' => 120000,
        'stock' => 8,
        'low_stock_threshold' => 2,
        'is_active' => true,
    ]);

    CommerceSetting::create([
        'currency' => 'IDR',
        'shipping_cost' => 20000,
        'free_shipping_threshold' => null,
        'bank_transfer_enabled' => true,
        'bank_name' => 'BCA',
        'bank_account_number' => '998877',
        'bank_account_name' => 'PT TithoShop',
    ]);

    $this->get(route('storefront'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Storefront')
            ->where('products.0.price', fn ($val) => (float) $val === 250000.0)
            ->where('products.0.price_idr', fn ($val) => (float) $val === 250000.0)
            ->where('products.0.price_usd', fn ($val) => (float) $val === 16.5));

    $customer = User::factory()->create(['phone' => '08123', 'shipping_address' => 'Jakarta']);
    $this->actingAs($customer)->post(route('checkout.store'), [
        'payment_method' => 'bank_transfer',
        'items' => [['product_id' => $product->id, 'quantity' => 2]],
    ])->assertSessionHasNoErrors();

    $order = Order::sole();
    expect($order->currency)->toBe('IDR')
        ->and((float) $order->subtotal)->toBe(500000.00)
        ->and((float) $order->total)->toBe(520000.00)
        ->and((float) $order->items->first()->price)->toBe(250000.00);
});
