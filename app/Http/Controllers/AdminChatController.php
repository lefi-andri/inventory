<?php

namespace App\Http\Controllers;

use App\Models\ChatConversation;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class AdminChatController extends Controller
{
    public function index(Request $request, ?ChatConversation $conversation = null): Response
    {
        $conversations = ChatConversation::query()
            ->with([
                'customer:id,name,email',
                'latestMessage' => fn ($query) => $query->select([
                    'chat_messages.id',
                    'chat_messages.conversation_id',
                    'chat_messages.sender_id',
                    'chat_messages.body',
                    'chat_messages.created_at',
                ]),
            ])
            ->withCount([
                'messages as unread_count' => fn ($query) => $query
                    ->whereNull('read_at')
                    ->whereColumn('sender_id', 'chat_conversations.customer_id'),
            ])
            ->orderByDesc('last_message_at')
            ->get();

        $conversation ??= $conversations->first();

        if ($conversation) {
            $conversation->messages()
                ->where('sender_id', $conversation->customer_id)
                ->whereNull('read_at')
                ->update(['read_at' => now()]);

            $conversation->load(['customer:id,name,email,phone', 'messages.sender:id,name']);
        }

        return Inertia::render('Admin/Chats/Index', [
            'conversations' => $conversations->map(fn ($item) => [
                'id' => $item->id,
                'customer' => $item->customer,
                'status' => $item->status,
                'last_message' => $item->latestMessage?->body,
                'last_message_at' => $item->last_message_at,
                'unread_count' => $item->unread_count,
            ]),
            'activeConversation' => $conversation ? [
                'id' => $conversation->id,
                'customer' => $conversation->customer,
                'status' => $conversation->status,
                'messages' => $conversation->messages->map(fn ($message) => [
                    'id' => $message->id,
                    'body' => $message->body,
                    'sender_id' => $message->sender_id,
                    'sender_name' => $message->sender->name,
                    'read_at' => $message->read_at,
                    'created_at' => $message->created_at,
                ]),
            ] : null,
        ]);
    }

    public function store(Request $request, ChatConversation $conversation): RedirectResponse
    {
        $data = $request->validate([
            'body' => ['required', 'string', 'max:2000'],
        ]);

        DB::transaction(function () use ($request, $conversation, $data) {
            $conversation->messages()->create([
                'sender_id' => $request->user()->id,
                'body' => trim($data['body']),
            ]);

            $conversation->update([
                'status' => 'open',
                'last_message_at' => now(),
            ]);
        });

        return back();
    }

    public function updateStatus(Request $request, ChatConversation $conversation): RedirectResponse
    {
        $data = $request->validate([
            'status' => ['required', Rule::in(['open', 'closed'])],
        ]);

        $conversation->update($data);

        return back()->with('success', $data['status'] === 'closed'
            ? 'Percakapan ditutup.'
            : 'Percakapan dibuka kembali.');
    }
}
