<?php

use App\Models\SiteSetting;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Role;

function policyAdmin(): User
{
    $admin = User::factory()->create();
    $admin->assignRole(Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'web']));

    return $admin;
}

test('public visitors can view privacy policy page with default pre-filled template', function () {
    $this->get(route('privacy-policy'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Policies/LegalNotice')
            ->where('type', 'privacy')
            ->has('title')
            ->has('content')
            ->where('title', 'Kebijakan Privasi')
            ->where('content', fn ($content) => str_contains($content, 'Undang-Undang Republik Indonesia Nomor 27 Tahun 2022') && str_contains($content, 'lefi.andri@kokek.com'))
        );
});

test('public visitors can view cookie policy page with default pre-filled template', function () {
    $this->get(route('cookie-policy'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Policies/LegalNotice')
            ->where('type', 'cookie')
            ->has('title')
            ->has('content')
            ->where('title', 'Kebijakan Cookie')
            ->where('content', fn ($content) => str_contains($content, 'laravel_session') && str_contains($content, 'XSRF-TOKEN'))
        );
});

test('cookie consent configuration is globally shared with inertia pages', function () {
    $this->get(route('storefront'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('site.cookie_consent.enabled', true)
            ->where('site.cookie_consent.title', 'Persetujuan Privasi & Cookie')
            ->has('site.cookie_consent.message')
            ->has('site.privacy_policy.url')
            ->has('site.cookie_policy.url')
        );
});

test('admin can update cookie consent settings and custom policies', function () {
    $admin = policyAdmin();

    $this->actingAs($admin)->patch(route('admin.site-settings.update'), [
        'brand_name' => 'Toko Amanah',
        'cookie_consent_enabled' => true,
        'cookie_consent_title' => 'Persetujuan Cookie Baru',
        'cookie_consent_message' => 'Pesan persetujuan kustom yang diperbarui.',
        'privacy_policy_title' => 'Kebijakan Privasi Resmi Toko',
        'privacy_policy_content' => '# Kebijakan Privasi Resmi\n\nKami menjaga data Anda dengan aman.',
        'cookie_policy_title' => 'Kebijakan Cookie Resmi Toko',
        'cookie_policy_content' => '# Kebijakan Cookie Resmi\n\nPenjelasan cookie toko.',
        'navbar_links' => [],
        'footer_links' => [],
    ])->assertSessionHasNoErrors();

    $setting = SiteSetting::current()->fresh();

    expect($setting->cookie_consent_enabled)->toBeTrue()
        ->and($setting->cookie_consent_title)->toBe('Persetujuan Cookie Baru')
        ->and($setting->cookie_consent_message)->toBe('Pesan persetujuan kustom yang diperbarui.')
        ->and($setting->privacy_policy_title)->toBe('Kebijakan Privasi Resmi Toko')
        ->and($setting->privacy_policy_content)->toBe('# Kebijakan Privasi Resmi\n\nKami menjaga data Anda dengan aman.')
        ->and($setting->cookie_policy_title)->toBe('Kebijakan Cookie Resmi Toko')
        ->and($setting->cookie_policy_content)->toBe('# Kebijakan Cookie Resmi\n\nPenjelasan cookie toko.');

    // Public pages reflect the updated content
    $this->get(route('privacy-policy'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('title', 'Kebijakan Privasi Resmi Toko')
            ->where('content', '# Kebijakan Privasi Resmi\n\nKami menjaga data Anda dengan aman.')
        );

    $this->get(route('cookie-policy'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('title', 'Kebijakan Cookie Resmi Toko')
            ->where('content', '# Kebijakan Cookie Resmi\n\nPenjelasan cookie toko.')
        );
});

test('admin can disable cookie consent banner', function () {
    $admin = policyAdmin();

    $this->actingAs($admin)->patch(route('admin.site-settings.update'), [
        'brand_name' => 'Toko Tanpa Banner',
        'cookie_consent_enabled' => false,
        'navbar_links' => [],
        'footer_links' => [],
    ])->assertSessionHasNoErrors();

    $setting = SiteSetting::current()->fresh();
    expect($setting->cookie_consent_enabled)->toBeFalse();

    $this->get(route('storefront'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('site.cookie_consent.enabled', false)
        );
});
