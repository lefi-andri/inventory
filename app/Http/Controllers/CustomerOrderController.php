<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Services\OrderEmailService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class CustomerOrderController extends Controller
{
    public function index(Request $request): Response
    {
        $orders = $request->user()
            ->orders()
            ->with(['items.product.category', 'items.product.media'])
            ->latest()
            ->get()
            ->map(fn ($order) => [
                ...$order->only(
                    'id',
                    'order_number',
                    'customer_name',
                    'customer_email',
                    'customer_phone',
                    'shipping_address',
                    'shipping_method',
                    'status',
                    'received_at',
                    'payment_status',
                    'payment_method',
                    'payment_details',
                    'promotion_code',
                    'promotion_kind',
                    'notes',
                ),
                'currency' => $order->currency ?: 'IDR',
                'subtotal' => (float) $order->subtotal,
                'discount_amount' => (float) $order->discount_amount,
                'shipping_cost' => (float) $order->shipping_cost,
                'total' => (float) $order->total,
                'created_at' => $order->created_at,
                'items' => $order->items->map(fn ($item) => [
                    ...$item->only('id', 'product_name', 'sku', 'quantity'),
                    'price' => (float) $item->price,
                    'subtotal' => (float) $item->subtotal,
                    'product' => $this->transformOrderItemProduct($item),
                ]),
            ]);

        return Inertia::render('Customer/Orders', [
            'orders' => $orders,
        ]);
    }

    public function confirmReceived(Request $request, Order $order, OrderEmailService $orderEmail): RedirectResponse
    {
        $order = DB::transaction(function () use ($request, $order) {
            $order = $request->user()
                ->orders()
                ->whereKey($order->id)
                ->lockForUpdate()
                ->firstOrFail();

            if ($order->status !== 'shipped') {
                throw ValidationException::withMessages([
                    'order' => 'Hanya pesanan yang sudah dikirim yang dapat dikonfirmasi diterima.',
                ]);
            }

            $order->update([
                'status' => 'completed',
                'received_at' => now(),
            ]);

            return $order;
        });

        $orderEmail->received($order);

        return back()->with('success', 'Penerimaan barang berhasil dikonfirmasi. Pesanan telah selesai.');
    }

    private function transformOrderItemProduct(OrderItem $item): array
    {
        $product = $item->product;
        $images = $product ? $product->getMedia('products')->map(fn ($media) => $media->getUrl())->values() : collect();

        return [
            'id' => $product?->id ?? $item->product_id,
            'name' => $item->product_name,
            'default_name' => $item->product_name,
            'sku' => $item->sku,
            'description' => $product ? ($product->localizedDescription() ?: $product->description) : null,
            'price' => (float) $item->price,
            'quantity' => (int) $item->quantity,
            'subtotal' => (float) $item->subtotal,
            'stock' => $product?->stock ?? 0,
            'category' => $product?->category?->name,
            'is_active' => $product?->is_active ?? false,
            'is_discontinued' => $product?->is_discontinued ?? false,
            'image' => $images->first(),
            'images' => $images->all(),
            'is_historical' => true,
        ];
    }
}
