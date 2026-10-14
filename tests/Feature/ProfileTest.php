<?php

use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Role;

test('profile page is displayed', function () {
    $user = User::factory()->create();

    $response = $this
        ->actingAs($user)
        ->get('/profile');

    $response->assertOk();
});

test('customer profile page exposes saved account and shipping data', function () {
    $user = User::factory()->create([
        'phone' => '08123456789',
        'shipping_address' => 'Jl. Customer No. 10',
        'checkout_notes' => 'Hubungi sebelum mengantar',
    ]);
    $customerRole = Role::create(['name' => 'customer', 'guard_name' => 'web']);
    $user->assignRole($customerRole);

    $this->actingAs($user)
        ->get(route('profile.edit'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Profile/Edit')
            ->where('auth.roles.0', 'customer')
            ->where('auth.user.phone', '08123456789')
            ->where('auth.user.shipping_address', 'Jl. Customer No. 10')
            ->where('auth.user.checkout_notes', 'Hubungi sebelum mengantar'));
});

test('profile information can be updated', function () {
    $user = User::factory()->create();

    $response = $this
        ->actingAs($user)
        ->patch('/profile', [
            'name' => 'Test User',
            'email' => 'test@example.com',
            'phone' => '08123456789',
            'shipping_address' => 'Jl. Profil Baru No. 10',
            'checkout_notes' => 'Hubungi sebelum mengantar',
        ]);

    $response
        ->assertSessionHasNoErrors()
        ->assertRedirect('/profile');

    $user->refresh();

    $this->assertSame('Test User', $user->name);
    $this->assertSame('test@example.com', $user->email);
    $this->assertSame('08123456789', $user->phone);
    $this->assertSame('Jl. Profil Baru No. 10', $user->shipping_address);
    $this->assertSame('Hubungi sebelum mengantar', $user->checkout_notes);
    $this->assertNull($user->email_verified_at);
});

test('email verification status is unchanged when the email address is unchanged', function () {
    $user = User::factory()->create();

    $response = $this
        ->actingAs($user)
        ->patch('/profile', [
            'name' => 'Test User',
            'email' => $user->email,
            'phone' => '08123456789',
            'shipping_address' => 'Jl. Testing No. 1',
            'checkout_notes' => null,
        ]);

    $response
        ->assertSessionHasNoErrors()
        ->assertRedirect('/profile');

    $this->assertNotNull($user->refresh()->email_verified_at);
});

test('required customer profile data cannot be cleared', function () {
    $user = User::factory()->create([
        'phone' => '08123456789',
        'shipping_address' => 'Alamat lama',
    ]);

    $this->actingAs($user)
        ->patch(route('profile.update'), [
            'name' => $user->name,
            'email' => $user->email,
            'phone' => '',
            'shipping_address' => '',
            'checkout_notes' => null,
        ])
        ->assertSessionHasErrors(['phone', 'shipping_address']);

    expect($user->refresh()->phone)->toBe('08123456789')
        ->and($user->shipping_address)->toBe('Alamat lama');
});

test('user can delete their account', function () {
    $user = User::factory()->create();

    $response = $this
        ->actingAs($user)
        ->delete('/profile', [
            'password' => 'password',
        ]);

    $response
        ->assertSessionHasNoErrors()
        ->assertRedirect('/');

    $this->assertGuest();
    $this->assertNull($user->fresh());
});

test('correct password must be provided to delete account', function () {
    $user = User::factory()->create();

    $response = $this
        ->actingAs($user)
        ->from('/profile')
        ->delete('/profile', [
            'password' => 'wrong-password',
        ]);

    $response
        ->assertSessionHasErrors('password')
        ->assertRedirect('/profile');

    $this->assertNotNull($user->fresh());
});
