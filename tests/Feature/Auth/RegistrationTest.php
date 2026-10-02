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
        'password_confirmation' => 'password',
    ]);

    $response->assertRedirect(route('storefront', absolute: false));
    $this->assertAuthenticated();
    expect(User::where('email', 'customer@example.com')->firstOrFail()->hasRole('customer'))->toBeTrue();
});
