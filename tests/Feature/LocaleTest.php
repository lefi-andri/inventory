<?php

use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('guest can change language and keep it in the session', function () {
    $this->from(route('storefront'))
        ->post(route('locale.update'), ['locale' => 'en'])
        ->assertRedirect(route('storefront'))
        ->assertSessionHas('locale', 'en');

    $this->get(route('storefront'))
        ->assertOk()
        ->assertHeader('Content-Language', 'en')
        ->assertInertia(fn (Assert $page) => $page
            ->where('locale', 'en')
            ->has('supportedLocales', 2));
});

test('signed in user language preference is persisted', function () {
    $user = User::factory()->create(['locale' => 'id']);

    $this->actingAs($user)
        ->post(route('locale.update'), ['locale' => 'en'])
        ->assertSessionHasNoErrors()
        ->assertSessionHas('locale', 'en');

    expect($user->refresh()->locale)->toBe('en');
});

test('signed in user preference takes priority over a previous guest session', function () {
    $user = User::factory()->create(['locale' => 'id']);

    $this->actingAs($user)
        ->withSession(['locale' => 'en'])
        ->get(route('storefront'))
        ->assertOk()
        ->assertHeader('Content-Language', 'id')
        ->assertInertia(fn (Assert $page) => $page->where('locale', 'id'));
});

test('unsupported language is rejected', function () {
    $this->from(route('storefront'))
        ->post(route('locale.update'), ['locale' => 'fr'])
        ->assertRedirect(route('storefront'))
        ->assertSessionHasErrors('locale');
});

test('new customer inherits the language selected before registration', function () {
    $this->withSession(['locale' => 'en'])
        ->post(route('register'), [
            'name' => 'English Customer',
            'email' => 'english@example.com',
            'password' => 'password',
        ])
        ->assertSessionHasNoErrors();

    expect(User::where('email', 'english@example.com')->firstOrFail()->locale)->toBe('en');
});
