<?php

use App\Models\Category;
use App\Models\Product;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Permission;

beforeEach(function () {
    Storage::fake('public');
    Permission::firstOrCreate(['name' => 'products.view', 'guard_name' => 'web']);
    Permission::firstOrCreate(['name' => 'products.create', 'guard_name' => 'web']);
    Permission::firstOrCreate(['name' => 'products.update', 'guard_name' => 'web']);
    Permission::firstOrCreate(['name' => 'products.delete', 'guard_name' => 'web']);
});

test('products index returns structured media array for image management', function () {
    $category = Category::create(['name' => 'Katalog', 'slug' => 'katalog']);
    $product = Product::create([
        'category_id' => $category->id,
        'name' => 'Kamera Analog',
        'slug' => 'kamera-analog',
        'sku' => 'CAM-001',
        'price' => 500000,
        'cost' => 300000,
        'stock' => 5,
        'low_stock_threshold' => 1,
        'is_active' => true,
    ]);

    $file1 = UploadedFile::fake()->image('camera_front.jpg');
    $file2 = UploadedFile::fake()->image('camera_back.jpg');
    $product->addMedia($file1)->toMediaCollection('products', 'public');
    $product->addMedia($file2)->toMediaCollection('products', 'public');

    $admin = User::factory()->create();
    $admin->givePermissionTo('products.view');

    $this->actingAs($admin)
        ->get(route('products.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Products/Index')
            ->has('products.0.images', 2)
            ->where('products.0.images.0.is_primary', true)
            ->where('products.0.images.1.is_primary', false)
            ->where('products.0.images_count', 2));
});

test('admin can upload additional media via dedicated endpoint', function () {
    $category = Category::create(['name' => 'Katalog', 'slug' => 'katalog-2']);
    $product = Product::create([
        'category_id' => $category->id,
        'name' => 'Headphone Pro',
        'slug' => 'headphone-pro',
        'sku' => 'AUD-001',
        'price' => 800000,
        'cost' => 450000,
        'stock' => 10,
        'low_stock_threshold' => 2,
        'is_active' => true,
    ]);

    $admin = User::factory()->create();
    $admin->givePermissionTo('products.update');

    $file = UploadedFile::fake()->image('headphone.png');

    $response = $this->actingAs($admin)
        ->post(route('products.media.store', $product), [
            'images' => [$file],
        ]);

    $response->assertSessionHasNoErrors();
    expect($product->fresh()->media()->count())->toBe(1);
});

test('admin can delete an individual media file', function () {
    $category = Category::create(['name' => 'Katalog', 'slug' => 'katalog-3']);
    $product = Product::create([
        'category_id' => $category->id,
        'name' => 'Mouse Gaming',
        'slug' => 'mouse-gaming',
        'sku' => 'ACC-M01',
        'price' => 250000,
        'cost' => 120000,
        'stock' => 8,
        'low_stock_threshold' => 2,
        'is_active' => true,
    ]);

    $file = UploadedFile::fake()->image('mouse.jpg');
    $media = $product->addMedia($file)->toMediaCollection('products', 'public');

    $admin = User::factory()->create();
    $admin->givePermissionTo('products.update');

    $this->actingAs($admin)
        ->delete(route('products.media.destroy', [$product, $media->id]))
        ->assertSessionHasNoErrors();

    expect($product->fresh()->media()->count())->toBe(0);
});

test('admin can set a media file as primary', function () {
    $category = Category::create(['name' => 'Katalog', 'slug' => 'katalog-4']);
    $product = Product::create([
        'category_id' => $category->id,
        'name' => 'Keyboard Mechanical',
        'slug' => 'keyboard-mech',
        'sku' => 'KEY-001',
        'price' => 900000,
        'cost' => 500000,
        'stock' => 15,
        'low_stock_threshold' => 3,
        'is_active' => true,
    ]);

    $file1 = UploadedFile::fake()->image('first.jpg');
    $file2 = UploadedFile::fake()->image('second.jpg');
    $product->addMedia($file1)->toMediaCollection('products', 'public');
    $media2 = $product->addMedia($file2)->toMediaCollection('products', 'public');

    $admin = User::factory()->create();
    $admin->givePermissionTo('products.update');

    $this->actingAs($admin)
        ->post(route('products.media.primary', [$product, $media2->id]))
        ->assertSessionHasNoErrors();

    $freshMedia = $product->fresh()->getMedia('products');
    expect($freshMedia->first()->id)->toBe($media2->id);
});

test('admin can batch delete media when updating product in modal', function () {
    $category = Category::create(['name' => 'Katalog', 'slug' => 'katalog-5']);
    $product = Product::create([
        'category_id' => $category->id,
        'name' => 'Smartwatch Fit',
        'slug' => 'smartwatch-fit',
        'sku' => 'WAT-001',
        'price' => 1200000,
        'cost' => 700000,
        'stock' => 6,
        'low_stock_threshold' => 2,
        'is_active' => true,
    ]);

    $file1 = UploadedFile::fake()->image('watch1.jpg');
    $file2 = UploadedFile::fake()->image('watch2.jpg');
    $media1 = $product->addMedia($file1)->toMediaCollection('products', 'public');
    $media2 = $product->addMedia($file2)->toMediaCollection('products', 'public');

    $admin = User::factory()->create();
    $admin->givePermissionTo('products.update');

    $this->actingAs($admin)
        ->patch(route('products.update', $product), [
            'category_id' => $category->id,
            'name' => 'Smartwatch Fit Pro',
            'sku' => 'WAT-001',
            'price' => 1250000,
            'cost' => 700000,
            'low_stock_threshold' => 2,
            'is_active' => true,
            'deleted_media_ids' => [$media1->id],
        ])
        ->assertSessionHasNoErrors();

    $product->refresh();
    expect($product->media()->count())->toBe(1)
        ->and($product->media()->first()->id)->toBe($media2->id);
});
