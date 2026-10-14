<?php

use App\Models\HeroBanner;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Role;

function heroAdmin(): User
{
    $admin = User::factory()->create();
    $admin->assignRole(Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'web']));

    return $admin;
}

test('admin can create a hero banner with an image', function () {
    Storage::fake('public');

    $this->actingAs(heroAdmin())->post(route('admin.hero-banners.store'), [
        'eyebrow' => 'Koleksi baru',
        'title' => 'Belanja kebutuhan rumah lebih mudah',
        'description' => 'Semua kebutuhan dalam satu tempat.',
        'cta_label' => 'Belanja sekarang',
        'cta_url' => '#produk',
        'sort_order' => 1,
        'is_active' => true,
        'image' => UploadedFile::fake()->image('hero.jpg', 1600, 700),
    ])->assertSessionHasNoErrors();

    $banner = HeroBanner::sole();

    expect($banner->title)->toBe('Belanja kebutuhan rumah lebih mudah')
        ->and($banner->is_active)->toBeTrue()
        ->and($banner->getMedia('hero-banners'))->toHaveCount(1);
});

test('admin can update a banner and replace its image', function () {
    Storage::fake('public');
    $admin = heroAdmin();
    $banner = HeroBanner::create([
        'title' => 'Banner lama',
        'sort_order' => 0,
        'is_active' => true,
    ]);
    $banner->addMedia(UploadedFile::fake()->image('old.jpg'))->toMediaCollection('hero-banners', 'public');

    $this->actingAs($admin)->patch(route('admin.hero-banners.update', $banner), [
        'eyebrow' => null,
        'title' => 'Banner baru',
        'description' => null,
        'cta_label' => null,
        'cta_url' => null,
        'sort_order' => 2,
        'is_active' => false,
        'image' => UploadedFile::fake()->image('new.webp'),
    ])->assertSessionHasNoErrors();

    expect($banner->refresh()->title)->toBe('Banner baru')
        ->and($banner->sort_order)->toBe(2)
        ->and($banner->is_active)->toBeFalse()
        ->and($banner->getMedia('hero-banners'))->toHaveCount(1)
        ->and($banner->getFirstMedia('hero-banners')->file_name)->toBe('new.webp');
});

test('non admin cannot manage hero banners', function () {
    $customer = User::factory()->create();

    $this->actingAs($customer)
        ->get(route('admin.hero-banners.index'))
        ->assertForbidden();
});

test('storefront only receives active banners ordered by sort order', function () {
    HeroBanner::create(['title' => 'Kedua', 'sort_order' => 20, 'is_active' => true]);
    HeroBanner::create(['title' => 'Tidak tampil', 'sort_order' => 0, 'is_active' => false]);
    HeroBanner::create(['title' => 'Pertama', 'sort_order' => 10, 'is_active' => true]);

    $this->get(route('storefront'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Storefront')
            ->has('heroBanners', 2)
            ->where('heroBanners.0.title', 'Pertama')
            ->where('heroBanners.1.title', 'Kedua'));
});
