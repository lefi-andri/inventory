<?php

use App\Models\ChatConversation;
use App\Models\ChatMessage;
use App\Models\Order;
use App\Models\Product;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

beforeEach(function () {
    $adminRole = Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'web']);
    Role::firstOrCreate(['name' => 'customer', 'guard_name' => 'web']);
    $viewPermission = Permission::firstOrCreate(['name' => 'dashboard.view', 'guard_name' => 'web']);
    $adminRole->givePermissionTo($viewPermission);
});

function notificationTestUser(string $roleName): User
{
    $user = User::factory()->create([
        'email_verified_at' => now(),
    ]);
    $user->assignRole($roleName);

    return $user;
}

test('dashboard exposes admin notifications data including new orders and unread customer chats', function () {
    $admin = notificationTestUser('admin');
    $customer = notificationTestUser('customer');

    // Create an incoming new order
    $order = Order::create([
        'user_id' => $customer->id,
        'order_number' => 'ORD-NOTIF-001',
        'customer_name' => $customer->name,
        'customer_email' => $customer->email,
        'customer_phone' => '08123456789',
        'shipping_address' => 'Jl. Merdeka No. 10',
        'shipping_method' => 'Kurir Toko',
        'status' => 'new',
        'payment_status' => 'pending',
        'payment_method' => 'bank_transfer',
        'subtotal' => 150000,
        'total' => 150000,
    ]);

    // Create an unread customer chat message
    $conversation = ChatConversation::create([
        'customer_id' => $customer->id,
        'status' => 'open',
        'last_message_at' => now(),
    ]);

    ChatMessage::create([
        'conversation_id' => $conversation->id,
        'sender_id' => $customer->id,
        'body' => 'Halo admin, apakah pesanan saya sudah diproses?',
        'read_at' => null,
    ]);

    $this->actingAs($admin)
        ->get('/dashboard')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Dashboard')
            ->has('adminNotifications')
            ->where('adminNotifications.summary.new_orders_count', 1)
            ->where('adminNotifications.summary.unread_chats_count', 1)
            ->where('adminNotifications.summary.total_count', 2)
            ->where('adminNotifications.new_orders.0.order_number', 'ORD-NOTIF-001')
            ->where('adminNotifications.unread_conversations.0.customer_name', $customer->name)
            ->where('adminNotifications.unread_conversations.0.unread_count', 1)
            ->where('adminNotifications.unread_conversations.0.preview', 'Halo admin, apakah pesanan saya sudah diproses?')
        );
});

test('admin notification endpoint returns json payload for live polling', function () {
    $admin = notificationTestUser('admin');
    $customer = notificationTestUser('customer');

    Order::create([
        'user_id' => $customer->id,
        'order_number' => 'ORD-POLL-002',
        'customer_name' => $customer->name,
        'customer_email' => $customer->email,
        'customer_phone' => '08123456789',
        'shipping_address' => 'Jl. Sudirman No. 5',
        'status' => 'new',
        'payment_status' => 'pending',
        'payment_method' => 'bank_transfer',
        'subtotal' => 75000,
        'total' => 75000,
    ]);

    $response = $this->actingAs($admin)
        ->getJson(route('admin.notifications.index'))
        ->assertOk()
        ->json();

    expect($response['summary']['new_orders_count'])->toBe(1)
        ->and($response['new_orders'][0]['order_number'])->toBe('ORD-POLL-002')
        ->and($response['summary']['total_count'])->toBe(1);
});

test('non admin cannot access admin notification endpoint', function () {
    $customer = notificationTestUser('customer');

    $this->actingAs($customer)
        ->getJson(route('admin.notifications.index'))
        ->assertForbidden();
});

test('admin can mark conversation messages as read via notifications endpoint', function () {
    $admin = notificationTestUser('admin');
    $customer = notificationTestUser('customer');

    $conversation = ChatConversation::create([
        'customer_id' => $customer->id,
        'status' => 'open',
        'last_message_at' => now(),
    ]);

    $message = ChatMessage::create([
        'conversation_id' => $conversation->id,
        'sender_id' => $customer->id,
        'body' => 'Pesan belum terbaca',
        'read_at' => null,
    ]);

    $this->actingAs($admin)
        ->postJson(route('admin.notifications.chats.read', $conversation))
        ->assertOk()
        ->assertJsonPath('success', true)
        ->assertJsonPath('notifications.summary.unread_chats_count', 0);

    expect($message->refresh()->read_at)->not->toBeNull();
});

test('updating order status from new to processing reduces new orders count', function () {
    $admin = notificationTestUser('admin');
    $customer = notificationTestUser('customer');

    $order = Order::create([
        'user_id' => $customer->id,
        'order_number' => 'ORD-STATUS-003',
        'customer_name' => $customer->name,
        'customer_email' => $customer->email,
        'customer_phone' => '08123456789',
        'shipping_address' => 'Jl. Gatot Subroto No. 1',
        'status' => 'new',
        'payment_status' => 'pending',
        'payment_method' => 'bank_transfer',
        'subtotal' => 50000,
        'total' => 50000,
    ]);

    $adminNotificationService = app(\App\Services\AdminNotificationService::class);
    expect($adminNotificationService->getSummary()['new_orders_count'])->toBe(1);

    // Update order status to processing
    $order->update(['status' => 'processing']);

    expect($adminNotificationService->getSummary()['new_orders_count'])->toBe(0);
});
