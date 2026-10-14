<?php

use App\Models\ChatConversation;
use App\Models\ChatMessage;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Role;

function chatUser(string $role): User
{
    $user = User::factory()->create();
    $user->assignRole(Role::firstOrCreate(['name' => $role, 'guard_name' => 'web']));

    return $user;
}

test('customer can start a chat and view their messages', function () {
    $customer = chatUser('customer');

    $this->actingAs($customer)
        ->post(route('customer.chat.messages.store'), ['body' => 'Saya butuh bantuan pesanan.'])
        ->assertSessionHasNoErrors();

    $conversation = ChatConversation::where('customer_id', $customer->id)->firstOrFail();

    expect($conversation->status)->toBe('open');
    $this->assertDatabaseHas('chat_messages', [
        'conversation_id' => $conversation->id,
        'sender_id' => $customer->id,
        'body' => 'Saya butuh bantuan pesanan.',
    ]);

    $this->get(route('customer.chat.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Customer/Chat')
            ->where('conversation.id', $conversation->id)
            ->where('conversation.messages.0.body', 'Saya butuh bantuan pesanan.'));
});

test('floating chat endpoint returns messages and unread count', function () {
    $customer = chatUser('customer');
    $admin = chatUser('admin');
    $conversation = ChatConversation::create(['customer_id' => $customer->id]);
    ChatMessage::create([
        'conversation_id' => $conversation->id,
        'sender_id' => $admin->id,
        'body' => 'Pesan baru dari admin',
    ]);

    $this->actingAs($customer)
        ->getJson(route('customer.chat.messages.index'))
        ->assertOk()
        ->assertJsonPath('conversation.unread_count', 1)
        ->assertJsonPath('conversation.messages.0.body', 'Pesan baru dari admin');

    $this->actingAs($customer)
        ->getJson(route('customer.chat.messages.index', ['mark_read' => 1]))
        ->assertOk()
        ->assertJsonPath('conversation.unread_count', 0);

    expect(ChatMessage::firstOrFail()->read_at)->not->toBeNull();
});

test('floating chat can send a message without leaving the current page', function () {
    $customer = chatUser('customer');

    $this->actingAs($customer)
        ->postJson(route('customer.chat.messages.store'), ['body' => 'Pesan dari widget'])
        ->assertCreated()
        ->assertJsonPath('conversation.messages.0.body', 'Pesan dari widget');
});

test('non customer cannot use the customer chat', function () {
    $admin = chatUser('admin');

    $this->actingAs($admin)->get(route('customer.chat.index'))->assertForbidden();
    $this->actingAs($admin)
        ->post(route('customer.chat.messages.store'), ['body' => 'Tidak boleh'])
        ->assertForbidden();
});

test('admin can view customer conversations and reply', function () {
    $customer = chatUser('customer');
    $admin = chatUser('admin');
    $conversation = ChatConversation::create([
        'customer_id' => $customer->id,
        'status' => 'open',
        'last_message_at' => now(),
    ]);
    ChatMessage::create([
        'conversation_id' => $conversation->id,
        'sender_id' => $customer->id,
        'body' => 'Halo admin',
    ]);

    $this->actingAs($admin)
        ->get(route('admin.chats.index', $conversation))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Admin/Chats/Index')
            ->where('activeConversation.id', $conversation->id)
            ->where('activeConversation.customer.id', $customer->id));

    $this->actingAs($admin)
        ->post(route('admin.chats.messages.store', $conversation), ['body' => 'Halo, ada yang bisa dibantu?'])
        ->assertSessionHasNoErrors();

    $this->assertDatabaseHas('chat_messages', [
        'conversation_id' => $conversation->id,
        'sender_id' => $admin->id,
        'body' => 'Halo, ada yang bisa dibantu?',
    ]);
});

test('only admins can access the admin chat inbox', function () {
    $customer = chatUser('customer');

    $this->actingAs($customer)->get(route('admin.chats.index'))->assertForbidden();
});

test('admin can close and customer can reopen a conversation with a new message', function () {
    $customer = chatUser('customer');
    $admin = chatUser('admin');
    $conversation = ChatConversation::create(['customer_id' => $customer->id]);

    $this->actingAs($admin)
        ->patch(route('admin.chats.status.update', $conversation), ['status' => 'closed'])
        ->assertSessionHasNoErrors();

    expect($conversation->refresh()->status)->toBe('closed');

    $this->actingAs($customer)
        ->post(route('customer.chat.messages.store'), ['body' => 'Saya masih membutuhkan bantuan.'])
        ->assertSessionHasNoErrors();

    expect($conversation->refresh()->status)->toBe('open');
});
