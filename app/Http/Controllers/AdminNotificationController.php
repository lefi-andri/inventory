<?php

namespace App\Http\Controllers;

use App\Models\ChatConversation;
use App\Services\AdminNotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminNotificationController extends Controller
{
    public function __construct(private readonly AdminNotificationService $notificationService)
    {
    }

    public function index(Request $request): JsonResponse
    {
        return response()->json($this->notificationService->getNotificationsData());
    }

    public function markChatRead(Request $request, ChatConversation $conversation): JsonResponse
    {
        $conversation->messages()
            ->where('sender_id', $conversation->customer_id)
            ->whereNull('read_at')
            ->update(['read_at' => now()]);

        return response()->json([
            'success' => true,
            'notifications' => $this->notificationService->getNotificationsData(),
        ]);
    }
}
