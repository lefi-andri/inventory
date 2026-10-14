<?php

namespace App\Http\Controllers;

use App\Models\ChatConversation;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class CustomerChatController extends Controller
{
    public function index(Request $request): Response
    {
        abort_unless($request->user()->hasRole('customer'), 403);

        $conversation = ChatConversation::query()
            ->where('customer_id', $request->user()->id)
            ->first();

        if ($conversation) {
            $conversation->messages()
                ->where('sender_id', '!=', $request->user()->id)
                ->whereNull('read_at')
                ->update(['read_at' => now()]);

            $conversation->load(['messages.sender:id,name']);
        }

        return Inertia::render('Customer/Chat', [
            'conversation' => $conversation ? $this->conversationData($conversation, $request->user()->id) : null,
        ]);
    }

    public function messages(Request $request): JsonResponse
    {
        abort_unless($request->user()->hasRole('customer'), 403);

        $conversation = ChatConversation::query()
            ->where('customer_id', $request->user()->id)
            ->first();

        if (! $conversation) {
            return response()->json(['conversation' => null]);
        }

        if ($request->boolean('mark_read')) {
            $conversation->messages()
                ->where('sender_id', '!=', $request->user()->id)
                ->whereNull('read_at')
                ->update(['read_at' => now()]);
        }

        $conversation->load(['messages.sender:id,name']);

        return response()->json([
            'conversation' => $this->conversationData($conversation, $request->user()->id),
        ]);
    }

    public function store(Request $request): RedirectResponse|JsonResponse
    {
        abort_unless($request->user()->hasRole('customer'), 403);

        $data = $request->validate([
            'body' => ['required', 'string', 'max:2000'],
        ]);

        $conversation = DB::transaction(function () use ($request, $data) {
            $conversation = ChatConversation::firstOrCreate(
                ['customer_id' => $request->user()->id],
                ['status' => 'open'],
            );

            $conversation->messages()->create([
                'sender_id' => $request->user()->id,
                'body' => trim($data['body']),
            ]);

            $conversation->update([
                'status' => 'open',
                'last_message_at' => now(),
            ]);

            return $conversation;
        });

        if ($request->expectsJson()) {
            $conversation->load(['messages.sender:id,name']);

            return response()->json([
                'conversation' => $this->conversationData($conversation, $request->user()->id),
            ], 201);
        }

        return back();
    }

    private function conversationData(ChatConversation $conversation, int $customerId): array
    {
        return [
            'id' => $conversation->id,
            'status' => $conversation->status,
            'unread_count' => $conversation->messages
                ->where('sender_id', '!=', $customerId)
                ->whereNull('read_at')
                ->count(),
            'messages' => $conversation->messages->map(fn ($message) => [
                'id' => $message->id,
                'body' => $message->body,
                'sender_id' => $message->sender_id,
                'sender_name' => $message->sender->name,
                'read_at' => $message->read_at,
                'created_at' => $message->created_at,
            ]),
        ];
    }
}
