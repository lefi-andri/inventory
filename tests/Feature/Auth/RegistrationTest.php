<?php

use App\Models\User;

test('customer registration screen can be rendered', function () {
    $response = $this->get('/register');

    $response->assertOk();
});

test('new users can register as customers', function () {
    $response = $this->post('/register', [
        'name' => 'Test Customer',
        'email' => 'customer@example.com',
        'password' => 'password',
    ]);

    $response
        ->assertRedirect(route('storefront', absolute: false))
        ->assertSessionHas('success');
    $this->assertAuthenticated();
    $user = User::where('email', 'customer@example.com')->firstOrFail();

    expect($user->hasRole('customer'))->toBeTrue()
        ->and($user->phone)->toBeNull()
        ->and($user->shipping_address)->toBeNull()
        ->and($user->checkout_notes)->toBeNull();
});
