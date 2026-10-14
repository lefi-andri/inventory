<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\Product;
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
                    'status',
                    'received_at',
                    'payment_status',
                    'promotion_code',
                    'promotion_kind',
                    'notes',
                ),
                'subtotal' => (float) $order->subtotal,
                'discount_amount' => (float) $order->discount_amount,
                'shipping_cost' => (float) $order->shipping_cost,
                'total' => (float) $order->total,
                'created_at' => $order->created_at,
                'items' => $order->items->map(fn ($item) => [
                    ...$item->only('id', 'product_name', 'sku', 'quantity'),
                    'price' => (float) $item->price,
                    'subtotal' => (float) $item->subtotal,
                    'product' => $item->product ? $this->transformProduct($item->product) : null,
                ]),
            ]);

        return Inertia::render('Customer/Orders', [
            'orders' => $orders,
        ]);
    }

    public function confirmReceived(Request $request, Order $order): RedirectResponse
    {
        DB::transaction(function () use ($request, $order) {
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
        });

        return back()->with('success', 'Penerimaan barang berhasil dikonfirmasi. Pesanan telah selesai.');
    }

    private function transformProduct(Product $product): array
    {
        $images = $product->getMedia('products')->map(fn ($media) => $media->getUrl())->values();

        return [
            'id' => $product->id,
            'name' => $product->name,
            'sku' => $product->sku,
            'description' => $product->description,
            'price' => (float) $product->price,
            'stock' => $product->stock,
            'category' => $product->category?->name,
            'is_active' => $product->is_active,
            'image' => $images->first(),
            'images' => $images,
        ];
    }
}
