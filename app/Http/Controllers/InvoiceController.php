<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\SiteSetting;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class InvoiceController extends Controller
{
    public function show(Request $request, Order $order): Response
    {
        $user = $request->user();

        // Allow access only to the customer who placed the order or staff/admin with orders.view permission
        if ($order->user_id !== $user->id && ! $user->can('orders.view')) {
            abort(403, 'Anda tidak memiliki hak akses untuk melihat invoice pesanan ini.');
        }

        $order->loadMissing(['items.product.category', 'items.product.media']);
        $site = SiteSetting::current()->load('media');

        $paymentDetails = $order->payment_details ?? [];
        $paymentMethodLabel = match ($order->payment_method) {
            'cod' => 'Bayar di Tempat (COD)',
            'bank_transfer' => 'Transfer Bank',
            default => $paymentDetails['label'] ?? ucfirst((string) $order->payment_method),
        };

        return Inertia::render('Orders/Invoice', [
            'order' => [
                'id' => $order->id,
                'order_number' => $order->order_number,
                'customer_name' => $order->customer_name,
                'customer_email' => $order->customer_email,
                'customer_phone' => $order->customer_phone,
                'shipping_address' => $order->shipping_address,
                'shipping_method' => $order->shipping_method ?: 'Pengiriman Reguler',
                'status' => $order->status,
                'received_at' => $order->received_at?->toISOString(),
                'payment_status' => $order->payment_status,
                'payment_method' => $order->payment_method,
                'payment_method_label' => $paymentMethodLabel,
                'payment_details' => $paymentDetails,
                'currency' => $order->currency ?: 'IDR',
                'subtotal' => (float) $order->subtotal,
                'discount_amount' => (float) $order->discount_amount,
                'shipping_cost' => (float) $order->shipping_cost,
                'total' => (float) $order->total,
                'promotion_code' => $order->promotion_code,
                'promotion_kind' => $order->promotion_kind,
                'notes' => $order->notes,
                'created_at' => $order->created_at?->toISOString(),
                'items' => $order->items->map(fn ($item) => [
                    'id' => $item->id,
                    'product_name' => $item->product_name,
                    'sku' => $item->sku,
                    'quantity' => (int) $item->quantity,
                    'price' => (float) $item->price,
                    'subtotal' => (float) $item->subtotal,
                ]),
            ],
            'store' => [
                'name' => $site->brand_name,
                'logo' => $site->getFirstMediaUrl('site-logo') ?: null,
                'description' => $site->footer_description,
                'copyright' => $site->footer_copyright,
            ],
            'isStaff' => (bool) $user->can('orders.view'),
        ]);
    }
}
