<?php

namespace App\Services;

use App\Models\ChatConversation;
use App\Models\ChatMessage;
use App\Models\Order;

class AdminNotificationService
{
    public function getSummary(): array
    {
        $newOrdersCount = Order::query()->where('status', 'new')->count();

        $unreadChatsCount = (int) ChatMessage::query()
            ->whereNull('read_at')
            ->whereHas('conversation', fn ($q) => $q->whereColumn('chat_messages.sender_id', 'chat_conversations.customer_id'))
            ->count();

        $unreadConversationsCount = ChatConversation::query()
            ->whereHas('messages', fn ($q) => $q
                ->whereNull('read_at')
                ->whereColumn('chat_messages.sender_id', 'chat_conversations.customer_id')
            )
            ->count();

        return [
            'new_orders_count' => $newOrdersCount,
            'unread_chats_count' => $unreadChatsCount,
            'unread_conversations_count' => $unreadConversationsCount,
            'total_count' => $newOrdersCount + $unreadChatsCount,
        ];
    }

    public function getNotificationsData(): array
    {
        $summary = $this->getSummary();

        $newOrders = Order::query()
            ->where('status', 'new')
            ->latest()
            ->limit(10)
            ->get(['id', 'order_number', 'customer_name', 'customer_email', 'customer_phone', 'status', 'payment_status', 'payment_method', 'total', 'created_at'])
            ->map(fn ($order) => [
                'id' => $order->id,
                'order_number' => $order->order_number,
                'customer_name' => $order->customer_name,
                'customer_email' => $order->customer_email,
                'customer_phone' => $order->customer_phone,
                'status' => $order->status,
                'payment_status' => $order->payment_status,
                'payment_method' => $order->payment_method,
                'total' => (float) $order->total,
                'created_at' => $order->created_at?->toISOString(),
                'time_ago' => $order->created_at?->diffForHumans(),
            ]);

        $unreadConversations = ChatConversation::query()
            ->whereHas('messages', fn ($q) => $q
                ->whereNull('read_at')
                ->whereColumn('chat_messages.sender_id', 'chat_conversations.customer_id')
            )
            ->with([
                'customer:id,name,email,phone',
                'latestMessage',
            ])
            ->withCount([
                'messages as unread_count' => fn ($query) => $query
                    ->whereNull('read_at')
                    ->whereColumn('sender_id', 'chat_conversations.customer_id'),
            ])
            ->orderByDesc('last_message_at')
            ->limit(10)
            ->get()
            ->map(function ($conv) {
                $latest = $conv->latestMessage;
                $preview = $latest?->body;

                if (! $preview && $latest?->attachment_path) {
                    $preview = str_starts_with($latest->attachment_mime ?? '', 'image/')
                        ? '📷 [Gambar]'
                        : '📄 [Dokumen PDF]';
                }

                return [
                    'id' => $conv->id,
                    'customer_id' => $conv->customer_id,
                    'customer_name' => $conv->customer?->name ?? 'Pelanggan',
                    'customer_email' => $conv->customer?->email,
                    'unread_count' => (int) $conv->unread_count,
                    'last_message_at' => $conv->last_message_at?->toISOString(),
                    'time_ago' => $conv->last_message_at?->diffForHumans() ?? $conv->updated_at?->diffForHumans(),
                    'preview' => $preview,
                    'latest_message' => $latest ? [
                        'id' => $latest->id,
                        'body' => $latest->body,
                        'attachment' => $latest->toAttachmentArray(),
                        'created_at' => $latest->created_at?->toISOString(),
                        'is_from_customer' => $latest->sender_id === $conv->customer_id,
                    ] : null,
                ];
            });

        $latestOrderTime = Order::latest('created_at')->value('created_at')?->timestamp ?? 0;
        $latestMessageTime = ChatMessage::latest('created_at')->value('created_at')?->timestamp ?? 0;

        return [
            'summary' => $summary,
            'new_orders' => $newOrders,
            'unread_conversations' => $unreadConversations,
            'latest_timestamp' => max($latestOrderTime, $latestMessageTime),
        ];
    }
}
