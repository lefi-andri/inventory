<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Services\InventoryService;
use App\Services\OrderEmailService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class OrderController extends Controller
{
    private const STATUS_TRANSITIONS = [
        'new' => ['new', 'processing', 'cancelled'],
        'processing' => ['processing', 'shipped', 'cancelled'],
        'shipped' => ['shipped', 'completed'],
        'completed' => ['completed'],
        'cancelled' => ['cancelled'],
    ];

    public function index(): Response
    {
        return Inertia::render('Orders/Index', [
            'orders' => Order::with('items')->latest()->get()->map(fn ($order) => [
                ...$order->only('id', 'order_number', 'customer_name', 'customer_email', 'customer_phone', 'shipping_address', 'shipping_method', 'status', 'payment_status', 'payment_method', 'payment_details', 'promotion_code', 'promotion_kind', 'notes'),
                'subtotal' => (float) $order->subtotal,
                'discount_amount' => (float) $order->discount_amount,
                'shipping_cost' => (float) $order->shipping_cost,
                'total' => (float) $order->total,
                'created_at' => $order->created_at,
                'items' => $order->items->map(fn ($item) => [
                    ...$item->only('id', 'product_name', 'sku', 'quantity'),
                    'price' => (float) $item->price,
                    'subtotal' => (float) $item->subtotal,
                ]),
            ]),
        ]);
    }

    public function update(Request $request, Order $order, InventoryService $inventory, OrderEmailService $orderEmail): RedirectResponse
    {
        $data = $request->validate([
            'status' => ['required', 'in:new,processing,shipped,completed,cancelled'],
            'payment_status' => ['required', 'in:pending,paid,failed,refunded'],
        ]);
        $changes = DB::transaction(function () use ($data, $order, $request, $inventory) {
            $order = Order::query()->lockForUpdate()->findOrFail($order->id);

            if (! in_array($data['status'], self::STATUS_TRANSITIONS[$order->status] ?? [], true)) {
                throw ValidationException::withMessages([
                    'status' => "Status pesanan tidak dapat diubah dari {$order->status} menjadi {$data['status']}.",
                ]);
            }

            $originalStatus = $order->status;
            $originalPaymentStatus = $order->payment_status;
            $wasCancelled = $order->status === 'cancelled';
            $willBeCancelled = $data['status'] === 'cancelled';

            if ($wasCancelled !== $willBeCancelled) {
                $items = $order->items()->orderBy('product_id')->get();
                foreach ($items as $item) {
                    if (! $item->product_id) {
                        continue;
                    }

                    $product = $item->product()->lockForUpdate()->first();
                    if (! $product) {
                        continue;
                    }

                    $inventory->apply(
                        product: $product,
                        quantity: $item->quantity,
                        type: 'order_cancellation',
                        userId: $request->user()->id,
                        reference: $order->order_number,
                        notes: 'Stok dikembalikan dari pembatalan pesanan',
                    );
                }
            }

            if ($data['status'] === 'completed' && ! $order->received_at) {
                $data['received_at'] = now();
            }

            $order->update($data);

            return [
                'order_id' => $order->id,
                'status_changed' => $originalStatus !== $order->status,
                'payment_changed' => $originalPaymentStatus !== $order->payment_status,
            ];
        });

        $orderEmail->updated(
            Order::with('items')->findOrFail($changes['order_id']),
            $changes['status_changed'],
            $changes['payment_changed'],
        );

        return back()->with('success', 'Status pesanan berhasil diperbarui.');
    }
}
