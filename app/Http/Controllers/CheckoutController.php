<?php

namespace App\Http\Controllers;

use App\Models\CommerceSetting;
use App\Models\Order;
use App\Models\Product;
use App\Models\Promotion;
use App\Services\InventoryService;
use App\Services\OrderEmailService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class CheckoutController extends Controller
{
    public function __construct(private readonly OrderEmailService $orderEmail)
    {
    }

    public function store(Request $request, InventoryService $inventory): RedirectResponse
    {
        $customer = $request->user();

        $request->merge([
            'customer_phone' => $request->filled('customer_phone')
                ? $request->input('customer_phone')
                : $customer->phone,
            'shipping_address' => $request->filled('shipping_address')
                ? $request->input('shipping_address')
                : $customer->shipping_address,
            'notes' => $request->has('notes')
                ? $request->input('notes')
                : $customer->checkout_notes,
        ]);

        $data = $request->validate([
            'customer_phone' => ['required', 'string', 'max:30'],
            'shipping_address' => ['required', 'string', 'max:1000'],
            'notes' => ['nullable', 'string', 'max:1000'],
            'promotion_code' => ['nullable', 'string', 'max:50'],
            'payment_method' => ['required', 'string', 'max:30'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.product_id' => ['required', 'integer', 'distinct', 'exists:products,id'],
            'items.*.quantity' => ['required', 'integer', 'min:1', 'max:99'],
        ]);

        $order = DB::transaction(function () use ($data, $request, $inventory) {
            $customer = $request->user();
            $lines = [];
            $subtotal = 0;

            $commerceSettings = CommerceSetting::current();
            $isDollar = ($commerceSettings->currency ?? 'IDR') === 'USD';

            $items = collect($data['items'])->sortBy('product_id');

            foreach ($items as $item) {
                $product = Product::query()->lockForUpdate()->findOrFail($item['product_id']);
                if ($product->is_discontinued) {
                    throw ValidationException::withMessages([
                        'items' => "Produk {$product->name} sudah discontinue dan tidak dapat dipesan.",
                    ]);
                }

                if (! $product->is_active || $product->stock < $item['quantity']) {
                    throw ValidationException::withMessages([
                        'items' => "Stok {$product->name} tidak mencukupi.",
                    ]);
                }

                $unitPrice = ($isDollar && $product->price_usd !== null && (float) $product->price_usd > 0)
                    ? (float) $product->price_usd
                    : (float) $product->price;

                $lineTotal = $unitPrice * $item['quantity'];
                $subtotal += $lineTotal;
                $lines[] = compact('product', 'item', 'lineTotal', 'unitPrice');
            }

            $promotion = null;
            $discountAmount = 0;
            if (! empty($data['promotion_code'])) {
                $promotion = Promotion::query()->lockForUpdate()->where('code', strtoupper(trim($data['promotion_code'])))->first();
                if (! $promotion) throw ValidationException::withMessages(['promotion_code' => 'Kode kupon atau voucher tidak ditemukan.']);
                if ($reason = $promotion->unavailableReason($subtotal)) throw ValidationException::withMessages(['promotion_code' => $reason]);
                $discountAmount = $promotion->discountFor($subtotal);
            }

            $paymentMethod = collect($commerceSettings->availablePaymentMethods())
                ->firstWhere('value', $data['payment_method']);

            if (! $paymentMethod) {
                throw ValidationException::withMessages([
                    'payment_method' => 'Metode pembayaran tidak tersedia.',
                ]);
            }

            $shippingCost = $commerceSettings->shippingFor($subtotal);
            $order = Order::create([
                ...collect($data)->except(['items', 'promotion_code'])->all(),
                'user_id' => $customer->id,
                'customer_name' => $customer->name,
                'customer_email' => $customer->email,
                'order_number' => 'ORD-'.now()->format('ymd').'-'.strtoupper(Str::random(6)),
                'currency' => $commerceSettings->currency ?? 'IDR',
                'promotion_id' => $promotion?->id,
                'promotion_code' => $promotion?->code,
                'promotion_kind' => $promotion?->kind,
                'shipping_method' => $commerceSettings->shipping_label,
                'payment_method' => $paymentMethod['value'],
                'payment_details' => [
                    'label' => $paymentMethod['label'],
                    ...$paymentMethod['details'],
                ],
                'subtotal' => $subtotal,
                'discount_amount' => $discountAmount,
                'shipping_cost' => $shippingCost,
                'total' => max(0, $subtotal - $discountAmount) + $shippingCost,
            ]);

            $promotion?->increment('used_count');

            foreach ($lines as $line) {
                /** @var Product $product */
                $product = $line['product'];
                $quantity = $line['item']['quantity'];
                $order->items()->create([
                    'product_id' => $product->id,
                    'product_name' => $product->localizedName() ?: $product->name,
                    'sku' => $product->sku,
                    'price' => $line['unitPrice'],
                    'quantity' => $quantity,
                    'subtotal' => $line['lineTotal'],
                ]);

                $inventory->apply(
                    product: $product,
                    quantity: -$quantity,
                    type: 'order_reservation',
                    userId: $request->user()->id,
                    reference: $order->order_number,
                    notes: 'Stok dialokasikan untuk pesanan storefront',
                );
            }

            return $order;
        });

        $this->orderEmail->created($order);

        return redirect()->route('customer.orders.index')
            ->with('success', "Pesanan {$order->order_number} berhasil dibuat. Email konfirmasi sedang dikirim.");
    }

    public function validatePromotion(Request $request): JsonResponse
    {
        $data = $request->validate([
            'promotion_code' => ['required', 'string', 'max:50'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.product_id' => ['required', 'integer', 'distinct', 'exists:products,id'],
            'items.*.quantity' => ['required', 'integer', 'min:1', 'max:99'],
        ]);

        $commerceSettings = CommerceSetting::current();
        $isDollar = ($commerceSettings->currency ?? 'IDR') === 'USD';

        $subtotal = collect($data['items'])->sum(function ($item) use ($isDollar) {
            $product = Product::query()->visibleToCustomers()->find($item['product_id']);
            if (! $product) {
                throw ValidationException::withMessages([
                    'items' => 'Salah satu produk sudah tidak tersedia.',
                ]);
            }

            $unitPrice = ($isDollar && $product->price_usd !== null && (float) $product->price_usd > 0)
                ? (float) $product->price_usd
                : (float) $product->price;

            return $unitPrice * $item['quantity'];
        });
        $promotion = Promotion::query()->where('code', strtoupper(trim($data['promotion_code'])))->first();
        if (! $promotion) throw ValidationException::withMessages(['promotion_code' => 'Kode kupon atau voucher tidak ditemukan.']);
        if ($reason = $promotion->unavailableReason($subtotal)) throw ValidationException::withMessages(['promotion_code' => $reason]);

        $discount = $promotion->discountFor($subtotal);
        $shipping = $commerceSettings->shippingFor($subtotal);

        return response()->json([
            'promotion' => ['code' => $promotion->code, 'kind' => $promotion->kind, 'description' => $promotion->description],
            'subtotal' => $subtotal,
            'discount_amount' => $discount,
            'shipping_cost' => $shipping,
            'total' => max(0, $subtotal - $discount) + $shipping,
        ]);
    }
}
