<?php

use App\Models\Category;
use App\Models\CommerceSetting;
use App\Models\Order;
use App\Models\Product;
use App\Models\User;
use App\Notifications\OrderProgressNotification;
use App\Services\OrderEmailService;
use Illuminate\Notifications\AnonymousNotifiable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Support\Facades\Notification;
use Spatie\Permission\Models\Permission;

function emailTestProduct(): Product
{
    $category = Category::create(['name' => 'Email Test', 'slug' => 'email-test']);

    return Product::create([
        'category_id' => $category->id,
        'name' => 'Produk Email',
        'slug' => 'produk-email',
        'sku' => 'EMAIL-001',
        'price' => 150000,
        'cost' => 75000,
        'stock' => 10,
        'low_stock_threshold' => 2,
        'is_active' => true,
    ]);
}

function emailTestOrder(User $customer, string $status = 'new', string $paymentStatus = 'pending'): Order
{
    $product = emailTestProduct();
    $order = Order::create([
        'user_id' => $customer->id,
        'order_number' => 'ORD-EMAIL-01',
        'customer_name' => $customer->name,
        'customer_email' => $customer->email,
        'customer_phone' => '08123456789',
        'shipping_address' => 'Jl. Email No. 1, Jakarta',
        'shipping_method' => 'Kurir reguler',
        'status' => $status,
        'payment_status' => $paymentStatus,
        'payment_method' => 'bank_transfer',
        'payment_details' => [
            'label' => 'Transfer bank',
            'bank_name' => 'BCA',
            'account_number' => '1234567890',
            'account_name' => 'PT Stokara',
            'instructions' => 'Transfer maksimal 24 jam.',
        ],
        'subtotal' => 150000,
        'shipping_cost' => 20000,
        'total' => 170000,
    ]);
    $order->items()->create([
        'product_id' => $product->id,
        'product_name' => $product->name,
        'sku' => $product->sku,
        'price' => 150000,
        'quantity' => 1,
        'subtotal' => 150000,
    ]);

    return $order;
}

test('customer receives an order confirmation email after checkout', function () {
    $product = emailTestProduct();
    $customer = User::factory()->create([
        'name' => 'Nadia Customer',
        'email' => 'nadia@example.com',
        'phone' => '08123456789',
        'shipping_address' => 'Jl. Customer No. 10',
    ]);
    CommerceSetting::create([
        'shipping_label' => 'Kurir toko',
        'shipping_cost' => 20000,
        'free_shipping_threshold' => null,
        'bank_transfer_enabled' => true,
        'bank_name' => 'BCA',
        'bank_account_number' => '1234567890',
        'bank_account_name' => 'PT Stokara',
        'payment_instructions' => 'Transfer maksimal 24 jam.',
    ]);
    $emailService = Mockery::mock(OrderEmailService::class);
    $emailService->shouldReceive('created')
        ->once()
        ->with(Mockery::type(Order::class));
    $this->app->instance(OrderEmailService::class, $emailService);

    $this->actingAs($customer)->post(route('checkout.store'), [
        'payment_method' => 'bank_transfer',
        'items' => [['product_id' => $product->id, 'quantity' => 1]],
    ])->assertSessionHasNoErrors()
        ->assertSessionHas('success', fn ($message) => str_contains((string) $message, 'Email konfirmasi'));

    expect(Order::count())->toBe(1)
        ->and(Order::sole()->customer_email)->toBe('nadia@example.com');
});

test('order email service sends payment and order details to the customer email', function () {
    Notification::fake();

    $customer = User::factory()->create(['name' => 'Nadia Customer', 'email' => 'nadia@example.com']);
    $order = emailTestOrder($customer);

    app(OrderEmailService::class)->created($order);

    Notification::assertSentOnDemand(OrderProgressNotification::class);
    $notification = Notification::sent(new AnonymousNotifiable, OrderProgressNotification::class)->sole();
    $renderedEmail = (string) $notification->toMail(new AnonymousNotifiable)->render();

    expect($notification->event)->toBe('created')
        ->and($notification)->toBeInstanceOf(ShouldQueue::class)
        ->and($notification->afterCommit)->toBeTrue()
        ->and($notification->order['status'])->toBe('new')
        ->and($notification->order['payment_details']['bank_name'])->toBe('BCA')
        ->and($notification->order['items'][0]['name'])->toBe('Produk Email')
        ->and($renderedEmail)->toContain('Pesanan berhasil dibuat')
        ->and($renderedEmail)->toContain('1234567890')
        ->and($renderedEmail)->toContain('Rp170.000');

    $paymentUpdate = new OrderProgressNotification(
        order: [...$notification->order, 'status' => 'processing', 'payment_status' => 'paid'],
        event: 'updated',
        statusChanged: false,
        paymentChanged: true,
    );

    expect($paymentUpdate->toMail(new AnonymousNotifiable)->subject)
        ->toStartWith('Pembayaran telah dikonfirmasi');
});

test('customer receives one consolidated email when admin updates order and payment statuses', function () {
    Notification::fake();

    $customer = User::factory()->create();
    $order = emailTestOrder($customer);
    $admin = User::factory()->create();
    Permission::create(['name' => 'orders.update', 'guard_name' => 'web']);
    $admin->givePermissionTo('orders.update');

    $this->actingAs($admin)->patch(route('orders.update', $order), [
        'status' => 'processing',
        'payment_status' => 'paid',
    ])->assertSessionHasNoErrors();

    Notification::assertSentOnDemand(OrderProgressNotification::class, function (OrderProgressNotification $notification) {
        return $notification->event === 'updated'
            && $notification->statusChanged
            && $notification->paymentChanged
            && $notification->order['status'] === 'processing'
            && $notification->order['payment_status'] === 'paid';
    });
    Notification::assertSentOnDemandTimes(OrderProgressNotification::class, 1);

    $this->actingAs($admin)->patch(route('orders.update', $order), [
        'status' => 'processing',
        'payment_status' => 'paid',
    ])->assertSessionHasNoErrors();

    Notification::assertSentOnDemandTimes(OrderProgressNotification::class, 1);
});

test('customer receives a completion email after confirming the order is received', function () {
    Notification::fake();

    $customer = User::factory()->create();
    $order = emailTestOrder($customer, 'shipped', 'paid');

    $this->actingAs($customer)
        ->patch(route('customer.orders.received', $order))
        ->assertSessionHasNoErrors();

    Notification::assertSentOnDemand(OrderProgressNotification::class, function (OrderProgressNotification $notification) {
        return $notification->event === 'received'
            && $notification->order['status'] === 'completed'
            && $notification->order['payment_status'] === 'paid';
    });
});
