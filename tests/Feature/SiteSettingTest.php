<?php

use App\Models\SiteSetting;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Role;

function siteSettingsAdmin(): User
{
    $admin = User::factory()->create();
    $admin->assignRole(Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'web']));

    return $admin;
}

test('admin can update site identity navbar footer and logo', function () {
    Storage::fake('public');

    $this->actingAs(siteSettingsAdmin())->patch(route('admin.site-settings.update'), [
        'brand_name' => 'Toko Harmoni',
        'logo' => UploadedFile::fake()->image('logo.png', 400, 400),
        'remove_logo' => false,
        'navbar_links' => [
            ['label' => 'Katalog', 'url' => '#produk', 'is_active' => true],
            ['label' => 'Tentang', 'url' => '/tentang', 'is_active' => false],
        ],
        'footer_description' => 'Semua kebutuhan rumah dalam satu tempat.',
        'footer_copyright' => '© 2026 Toko Harmoni.',
        'footer_links' => [
            ['label' => 'Instagram', 'url' => 'https://instagram.com/tokoharmoni', 'is_active' => true],
        ],
    ])->assertSessionHasNoErrors();

    $settings = SiteSetting::current()->refresh();

    expect($settings->brand_name)->toBe('Toko Harmoni')
        ->and($settings->navbar_links)->toHaveCount(2)
        ->and($settings->footer_links[0]['label'])->toBe('Instagram')
        ->and($settings->getMedia('site-logo'))->toHaveCount(1);
});

test('site settings are globally shared with inertia pages', function () {
    SiteSetting::current()->update([
        'brand_name' => 'Brand Global',
        'navbar_links' => [['label' => 'Produk Pilihan', 'url' => '#produk', 'is_active' => true]],
        'footer_description' => 'Deskripsi global',
        'footer_copyright' => 'Hak cipta global',
        'footer_links' => [],
    ]);

    expect(SiteSetting::current()->brand_name)->toBe('Brand Global');

    $this->get(route('storefront'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('site.brand_name', 'Brand Global')
            ->where('site.navbar_links.0.label', 'Produk Pilihan')
            ->where('site.footer_description', 'Deskripsi global'));

    $this->get(route('login'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->where('site.brand_name', 'Brand Global'));
});

test('admin can save site settings when multipart form omits empty link arrays', function () {
    $settings = SiteSetting::current();
    $settings->update([
        'footer_links' => [['label' => 'Lama', 'url' => '/lama', 'is_active' => true]],
    ]);

    $this->actingAs(siteSettingsAdmin())->post(route('admin.site-settings.update'), [
        '_method' => 'patch',
        'brand_name' => 'Brand Tersimpan',
        'remove_logo' => '0',
        'footer_description' => 'Deskripsi baru',
        'footer_copyright' => 'Hak cipta baru',
        // FormData omits navbar_links and footer_links when both arrays are empty.
    ])->assertSessionHasNoErrors()
        ->assertSessionHas('success');

    $settings->refresh();

    expect($settings->brand_name)->toBe('Brand Tersimpan')
        ->and($settings->navbar_links)->toBe([])
        ->and($settings->footer_links)->toBe([])
        ->and($settings->footer_description)->toBe('Deskripsi baru');
});

test('non admin cannot manage site settings', function () {
    $this->actingAs(User::factory()->create())
        ->get(route('admin.site-settings.edit'))
        ->assertForbidden();
});

test('unsafe navigation links are rejected', function () {
    $this->actingAs(siteSettingsAdmin())->patch(route('admin.site-settings.update'), [
        'brand_name' => 'Stokara',
        'remove_logo' => false,
        'navbar_links' => [['label' => 'Tidak aman', 'url' => 'javascript:alert(1)', 'is_active' => true]],
        'footer_description' => null,
        'footer_copyright' => null,
        'footer_links' => [],
    ])->assertSessionHasErrors('navbar_links.0.url');
});
