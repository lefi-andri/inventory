<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class OrderProgressNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public int $tries = 3;

    public array $backoff = [60, 300, 900];

    public function __construct(
        public array $order,
        public string $event,
        public bool $statusChanged = false,
        public bool $paymentChanged = false,
    ) {
        $this->afterCommit();
    }

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject($this->subject())
            ->markdown('emails.orders.progress', [
                'order' => $this->order,
                'event' => $this->event,
                'headline' => $this->headline(),
                'intro' => $this->intro(),
                'statusChanged' => $this->statusChanged,
                'paymentChanged' => $this->paymentChanged,
            ]);
    }

    private function subject(): string
    {
        return $this->headline().' · '.$this->order['order_number'];
    }

    private function headline(): string
    {
        if ($this->event === 'created') {
            return 'Pesanan berhasil dibuat';
        }

        if ($this->event === 'received') {
            return 'Pesanan telah selesai';
        }

        if ($this->statusChanged) {
            return match ($this->order['status']) {
                'processing' => 'Pesanan sedang diproses',
                'shipped' => 'Pesanan telah dikirim',
                'completed' => 'Pesanan telah selesai',
                'cancelled' => 'Pesanan dibatalkan',
                default => 'Status pesanan diperbarui',
            };
        }

        return match ($this->order['payment_status']) {
            'paid' => 'Pembayaran telah dikonfirmasi',
            'failed' => 'Pembayaran gagal',
            'refunded' => 'Pembayaran telah dikembalikan',
            default => 'Status pembayaran diperbarui',
        };
    }

    private function intro(): string
    {
        if ($this->event === 'created') {
            return 'Terima kasih, pesanan Anda sudah kami terima. Berikut rincian pesanan dan informasi pembayarannya.';
        }

        if ($this->event === 'received') {
            return 'Terima kasih telah mengonfirmasi penerimaan barang. Pesanan Anda kini telah selesai.';
        }

        if ($this->statusChanged) {
            return match ($this->order['status']) {
                'processing' => 'Pesanan Anda sedang disiapkan oleh tim kami.',
                'shipped' => 'Pesanan Anda sudah diserahkan untuk proses pengiriman.',
                'completed' => 'Seluruh proses pesanan Anda telah selesai.',
                'cancelled' => 'Pesanan Anda telah dibatalkan. Silakan hubungi kami jika memerlukan bantuan.',
                default => 'Ada pembaruan pada status pesanan Anda.',
            };
        }

        return match ($this->order['payment_status']) {
            'paid' => 'Pembayaran Anda telah kami terima dan konfirmasi.',
            'failed' => 'Pembayaran belum berhasil. Silakan periksa kembali metode pembayaran Anda.',
            'refunded' => 'Pembayaran untuk pesanan ini telah dikembalikan.',
            default => 'Ada pembaruan pada status pembayaran pesanan Anda.',
        };
    }
}
