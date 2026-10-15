<?php

namespace App\Services;

use App\Models\Order;
use App\Models\SiteSetting;
use App\Notifications\OrderProgressNotification;
use Illuminate\Support\Facades\Notification;

class OrderEmailService
{
    public function created(Order $order): void
    {
        $this->send($order, 'created', true, true);
    }

    public function updated(Order $order, bool $statusChanged, bool $paymentChanged): void
    {
        if (! $statusChanged && ! $paymentChanged) {
            return;
        }

        $this->send($order, 'updated', $statusChanged, $paymentChanged);
    }

    public function received(Order $order): void
    {
        $this->send($order, 'received', true, false);
    }

    private function send(Order $order, string $event, bool $statusChanged, bool $paymentChanged): void
    {
        if (! filter_var($order->customer_email, FILTER_VALIDATE_EMAIL)) {
            return;
        }

        $order->loadMissing('items');

        try {
            Notification::route('mail', [$order->customer_email => $order->customer_name])
                ->notify(new OrderProgressNotification(
                    order: $this->snapshot($order),
                    event: $event,
                    statusChanged: $statusChanged,
                    paymentChanged: $paymentChanged,
                ));
        } catch (\Throwable $exception) {
            report($exception);
        }
    }

    private function snapshot(Order $order): array
    {
        $paymentDetails = $order->payment_details ?? [];

        return [
            'store_name' => SiteSetting::current()->brand_name,
            'order_number' => $order->order_number,
            'customer_name' => $order->customer_name,
            'status' => $order->status,
            'status_label' => $this->statusLabel($order->status),
            'payment_status' => $order->payment_status,
            'payment_status_label' => $this->paymentStatusLabel($order->payment_status),
            'payment_method' => $order->payment_method,
            'payment_method_label' => $paymentDetails['label']
                ?? match ($order->payment_method) {
                    'bank_transfer' => 'Transfer bank',
                    'cod' => 'Bayar di tempat (COD)',
                    default => 'Belum tercatat',
                },
            'payment_details' => $paymentDetails,
            'shipping_address' => $order->shipping_address,
            'shipping_method' => $order->shipping_method ?: 'Pengiriman reguler',
            'subtotal' => (float) $order->subtotal,
            'discount_amount' => (float) $order->discount_amount,
            'shipping_cost' => (float) $order->shipping_cost,
            'total' => (float) $order->total,
            'promotion_code' => $order->promotion_code,
            'notes' => $order->notes,
            'items' => $order->items->map(fn ($item) => [
                'name' => $item->product_name,
                'sku' => $item->sku,
                'quantity' => $item->quantity,
                'price' => (float) $item->price,
                'subtotal' => (float) $item->subtotal,
            ])->all(),
        ];
    }

    private function statusLabel(string $status): string
    {
        return match ($status) {
            'new' => 'Baru',
            'processing' => 'Diproses',
            'shipped' => 'Dikirim',
            'completed' => 'Selesai',
            'cancelled' => 'Dibatalkan',
            default => ucfirst($status),
        };
    }

    private function paymentStatusLabel(string $status): string
    {
        return match ($status) {
            'pending' => 'Menunggu pembayaran',
            'paid' => 'Lunas',
            'failed' => 'Gagal',
            'refunded' => 'Dikembalikan',
            default => ucfirst($status),
        };
    }
}
