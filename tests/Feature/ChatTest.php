<?php

use App\Models\ChatConversation;
use App\Models\ChatMessage;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
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

test('admin can start a chat with a registered customer', function () {
    $customer = chatUser('customer');
    $admin = chatUser('admin');

    $response = $this->actingAs($admin)
        ->post(route('admin.chats.store'), [
            'customer_id' => $customer->id,
            'body' => 'Halo, kami ingin menginformasikan status pesanan Anda.',
        ])
        ->assertSessionHasNoErrors();

    $conversation = ChatConversation::where('customer_id', $customer->id)->firstOrFail();

    $response->assertRedirect(route('admin.chats.index', $conversation));
    expect($conversation->status)->toBe('open')
        ->and($conversation->last_message_at)->not->toBeNull();

    $this->assertDatabaseHas('chat_messages', [
        'conversation_id' => $conversation->id,
        'sender_id' => $admin->id,
        'body' => 'Halo, kami ingin menginformasikan status pesanan Anda.',
    ]);
});

test('admin starting a chat again reuses and reopens the customer conversation', function () {
    $customer = chatUser('customer');
    $admin = chatUser('admin');
    $conversation = ChatConversation::create([
        'customer_id' => $customer->id,
        'status' => 'closed',
    ]);

    $this->actingAs($admin)
        ->post(route('admin.chats.store'), [
            'customer_id' => $customer->id,
            'body' => 'Ada informasi baru untuk Anda.',
        ])
        ->assertRedirect(route('admin.chats.index', $conversation))
        ->assertSessionHasNoErrors();

    expect(ChatConversation::where('customer_id', $customer->id)->count())->toBe(1)
        ->and($conversation->refresh()->status)->toBe('open')
        ->and($conversation->messages()->count())->toBe(1);
});

test('admin cannot start a chat with a user who is not a customer', function () {
    $admin = chatUser('admin');
    $otherAdmin = chatUser('admin');

    $this->actingAs($admin)
        ->from(route('admin.chats.index'))
        ->post(route('admin.chats.store'), [
            'customer_id' => $otherAdmin->id,
            'body' => 'Pesan yang tidak valid.',
        ])
        ->assertRedirect(route('admin.chats.index'))
        ->assertSessionHasErrors('customer_id');

    expect(ChatConversation::count())->toBe(0);
});

test('admin chat inbox lists registered customers for a new chat', function () {
    $customer = chatUser('customer');
    $admin = chatUser('admin');

    $this->actingAs($admin)
        ->get(route('admin.chats.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Admin/Chats/Index')
            ->has('customers', 1)
            ->where('customers.0.id', $customer->id)
            ->where('customers.0.email', $customer->email)
            ->where('customers.0.conversation_id', null));
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

test('customer can upload an image or pdf in chat with or without body text', function () {
    Storage::fake('public');
    $customer = chatUser('customer');

    $image = UploadedFile::fake()->image('bukti_transfer.jpg', 600, 400);

    $this->actingAs($customer)
        ->post(route('customer.chat.messages.store'), [
            'body' => 'Berikut bukti transfer pesanan',
            'attachment' => $image,
        ])
        ->assertSessionHasNoErrors();

    $conversation = ChatConversation::where('customer_id', $customer->id)->firstOrFail();
    $message = $conversation->messages()->firstOrFail();

    expect($message->attachment_path)->not->toBeNull()
        ->and($message->attachment_name)->toBe('bukti_transfer.jpg')
        ->and(str_starts_with($message->attachment_mime, 'image/'))->toBeTrue();

    Storage::disk('public')->assertExists($message->attachment_path);

    // Test sending PDF without body text
    $pdf = UploadedFile::fake()->create('resep_dokter.pdf', 500, 'application/pdf');

    $this->actingAs($customer)
        ->post(route('customer.chat.messages.store'), [
            'body' => '',
            'attachment' => $pdf,
        ])
        ->assertSessionHasNoErrors();

    $pdfMessage = $conversation->messages()->latest('id')->firstOrFail();
    expect($pdfMessage->body)->toBeNull()
        ->and($pdfMessage->attachment_name)->toBe('resep_dokter.pdf')
        ->and($pdfMessage->attachment_mime)->toBe('application/pdf');

    Storage::disk('public')->assertExists($pdfMessage->attachment_path);

    // Verify chat index exposes attachment details
    $this->get(route('customer.chat.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Customer/Chat')
            ->where('conversation.messages.0.attachment.name', 'bukti_transfer.jpg')
            ->where('conversation.messages.0.attachment.is_image', true)
            ->where('conversation.messages.1.attachment.name', 'resep_dokter.pdf')
            ->where('conversation.messages.1.attachment.is_pdf', true));
});

test('admin can upload an image or pdf when replying or starting a chat', function () {
    Storage::fake('public');
    $customer = chatUser('customer');
    $admin = chatUser('admin');

    $pdf = UploadedFile::fake()->create('invoice_order.pdf', 300, 'application/pdf');

    // Admin start chat with pdf attachment
    $this->actingAs($admin)
        ->post(route('admin.chats.store'), [
            'customer_id' => $customer->id,
            'body' => 'Berikut invoice pesanan Anda',
            'attachment' => $pdf,
        ])
        ->assertSessionHasNoErrors();

    $conversation = ChatConversation::where('customer_id', $customer->id)->firstOrFail();
    $message = $conversation->messages()->firstOrFail();

    expect($message->attachment_name)->toBe('invoice_order.pdf');
    Storage::disk('public')->assertExists($message->attachment_path);

    // Admin reply with image without body text
    $image = UploadedFile::fake()->image('produk_ready.png', 400, 400);

    $this->actingAs($admin)
        ->post(route('admin.chats.messages.store', $conversation), [
            'body' => '',
            'attachment' => $image,
        ])
        ->assertSessionHasNoErrors();

    $replyMessage = $conversation->messages()->latest('id')->firstOrFail();
    expect($replyMessage->body)->toBeNull()
        ->and($replyMessage->attachment_name)->toBe('produk_ready.png')
        ->and(str_starts_with($replyMessage->attachment_mime, 'image/'))->toBeTrue();

    Storage::disk('public')->assertExists($replyMessage->attachment_path);
});

test('invalid file type or oversized file in chat is rejected', function () {
    Storage::fake('public');
    $customer = chatUser('customer');

    $exeFile = UploadedFile::fake()->create('script.exe', 100, 'application/x-msdownload');

    $this->actingAs($customer)
        ->post(route('customer.chat.messages.store'), [
            'body' => 'Cek file ini',
            'attachment' => $exeFile,
        ])
        ->assertSessionHasErrors('attachment');

    $oversizedFile = UploadedFile::fake()->create('huge.pdf', 15000, 'application/pdf');

    $this->actingAs($customer)
        ->post(route('customer.chat.messages.store'), [
            'body' => 'File besar',
            'attachment' => $oversizedFile,
        ])
        ->assertSessionHasErrors('attachment');
});

test('customer and admin can send messages containing emoticons and emojis', function () {
    $customer = chatUser('customer');
    $admin = chatUser('admin');

    $emojiText = 'Halo min 😀👍 apakah barang ready? 📦🛒✨';
    $this->actingAs($customer)
        ->post(route('customer.chat.messages.store'), [
            'body' => $emojiText,
        ])
        ->assertSessionHasNoErrors();

    $conversation = ChatConversation::where('customer_id', $customer->id)->firstOrFail();
    $message = $conversation->messages()->firstOrFail();
    expect($message->body)->toBe($emojiText);

    $adminReply = 'Hai! Barang ready ya kak 😊❤️ segera kami proses 🎉';
    $this->actingAs($admin)
        ->post(route('admin.chats.messages.store', $conversation), [
            'body' => $adminReply,
        ])
        ->assertSessionHasNoErrors();

    $reply = $conversation->messages()->latest('id')->firstOrFail();
    expect($reply->body)->toBe($adminReply);
});

