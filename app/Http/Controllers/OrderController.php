<?php

namespace App\Http\Controllers;

use App\Models\InventoryMovement;
use App\Models\Order;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class OrderController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Orders/Index', [
            'orders' => Order::with('items')->latest()->get()->map(fn ($order) => [
                ...$order->only('id', 'order_number', 'customer_name', 'customer_email', 'customer_phone', 'shipping_address', 'status', 'payment_status', 'notes'),
                'subtotal' => (float) $order->subtotal,
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

    public function update(Request $request, Order $order): RedirectResponse
    {
        $data = $request->validate([
            'status' => ['required', 'in:new,processing,shipped,completed,cancelled'],
            'payment_status' => ['required', 'in:pending,paid,failed,refunded'],
        ]);
        DB::transaction(function () use ($data, $order, $request) {
            $wasCancelled = $order->status === 'cancelled';
            $willBeCancelled = $data['status'] === 'cancelled';

            if ($wasCancelled !== $willBeCancelled) {
                $order->load('items.product');
                foreach ($order->items as $item) {
                    if (! $item->product_id) {
                        continue;
                    }

                    $product = $item->product()->lockForUpdate()->first();
                    if (! $product) {
                        continue;
                    }

                    $quantity = $willBeCancelled ? $item->quantity : -$item->quantity;
                    $after = $product->stock + $quantity;
                    if ($after < 0) {
                        throw ValidationException::withMessages([
                            'status' => "Stok {$product->name} tidak cukup untuk mengaktifkan kembali pesanan.",
                        ]);
                    }

                    InventoryMovement::create([
                        'product_id' => $product->id,
                        'user_id' => $request->user()->id,
                        'type' => $willBeCancelled ? 'return' : 'sale',
                        'quantity' => $quantity,
                        'before_stock' => $product->stock,
                        'after_stock' => $after,
                        'reference' => $order->order_number,
                        'notes' => $willBeCancelled ? 'Stok dikembalikan dari pembatalan pesanan' : 'Pesanan dibuka kembali',
                    ]);
                    $product->update(['stock' => $after]);
                }
            }

            $order->update($data);
        });

        return back()->with('success', 'Status pesanan berhasil diperbarui.');
    }
}
