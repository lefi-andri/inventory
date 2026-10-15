<x-mail::message>
# {{ $headline }}

Halo {{ $order['customer_name'] }},

{{ $intro }}

<x-mail::panel>
**Nomor pesanan:** {{ $order['order_number'] }}  
**Status pesanan:** {{ $order['status_label'] }}  
**Status pembayaran:** {{ $order['payment_status_label'] }}
</x-mail::panel>

@if ($statusChanged || $paymentChanged)
## Status terkini

@if ($statusChanged)
- Pesanan: **{{ $order['status_label'] }}**
@endif
@if ($paymentChanged)
- Pembayaran: **{{ $order['payment_status_label'] }}**
@endif
@endif

## Rincian barang

<x-mail::table>
| Produk | Jumlah | Harga | Subtotal |
| :-- | --: | --: | --: |
@foreach ($order['items'] as $item)
| {{ $item['name'] }} ({{ $item['sku'] }}) | {{ $item['quantity'] }} | Rp{{ number_format($item['price'], 0, ',', '.') }} | Rp{{ number_format($item['subtotal'], 0, ',', '.') }} |
@endforeach
</x-mail::table>

Subtotal: **Rp{{ number_format($order['subtotal'], 0, ',', '.') }}**  
@if ($order['discount_amount'] > 0)
Diskon{{ $order['promotion_code'] ? ' ('.$order['promotion_code'].')' : '' }}: **-Rp{{ number_format($order['discount_amount'], 0, ',', '.') }}**  
@endif
{{ $order['shipping_method'] }}: **{{ $order['shipping_cost'] > 0 ? 'Rp'.number_format($order['shipping_cost'], 0, ',', '.') : 'Gratis' }}**  
Total: **Rp{{ number_format($order['total'], 0, ',', '.') }}**

## Pengiriman

{{ $order['shipping_address'] }}

@if ($order['notes'])
Catatan: {{ $order['notes'] }}
@endif

## Pembayaran

Metode: **{{ $order['payment_method_label'] }}**

@if (! empty($order['payment_details']['bank_name']))
Bank: **{{ $order['payment_details']['bank_name'] }}**  
Nomor rekening: **{{ $order['payment_details']['account_number'] ?? '-' }}**  
Atas nama: **{{ $order['payment_details']['account_name'] ?? '-' }}**
@endif

@if (! empty($order['payment_details']['instructions']))
{{ $order['payment_details']['instructions'] }}
@endif

<x-mail::button :url="route('customer.orders.index')">
Lihat Pesanan Saya
</x-mail::button>

Email ini dikirim otomatis. Simpan nomor pesanan Anda untuk memudahkan proses bantuan.

Terima kasih,<br>
{{ $order['store_name'] }}
</x-mail::message>
