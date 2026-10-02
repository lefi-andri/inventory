<?php

namespace App\Http\Controllers;

use App\Models\InventoryMovement;
use App\Models\Order;
use App\Models\Product;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class CheckoutController extends Controller
{
    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'customer_phone' => ['nullable', 'string', 'max:30'],
            'shipping_address' => ['required', 'string', 'max:1000'],
            'notes' => ['nullable', 'string', 'max:1000'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.product_id' => ['required', 'integer', 'exists:products,id'],
            'items.*.quantity' => ['required', 'integer', 'min:1', 'max:99'],
        ]);

        $order = DB::transaction(function () use ($data, $request) {
            $customer = $request->user();
            $lines = [];
            $subtotal = 0;

            foreach ($data['items'] as $item) {
                $product = Product::query()->lockForUpdate()->findOrFail($item['product_id']);
                if (! $product->is_active || $product->stock < $item['quantity']) {
                    throw ValidationException::withMessages([
                        'items' => "Stok {$product->name} tidak mencukupi.",
                    ]);
                }

                $lineTotal = (float) $product->price * $item['quantity'];
                $subtotal += $lineTotal;
                $lines[] = compact('product', 'item', 'lineTotal');
            }

            $shippingCost = $subtotal >= 500000 ? 0 : 25000;
            $order = Order::create([
                ...collect($data)->except('items')->all(),
                'user_id' => $customer->id,
                'customer_name' => $customer->name,
                'customer_email' => $customer->email,
                'order_number' => 'ORD-'.now()->format('ymd').'-'.strtoupper(Str::random(6)),
                'subtotal' => $subtotal,
                'shipping_cost' => $shippingCost,
                'total' => $subtotal + $shippingCost,
            ]);

            foreach ($lines as $line) {
                /** @var Product $product */
                $product = $line['product'];
                $quantity = $line['item']['quantity'];
                $before = $product->stock;

                $order->items()->create([
                    'product_id' => $product->id,
                    'product_name' => $product->name,
                    'sku' => $product->sku,
                    'price' => $product->price,
                    'quantity' => $quantity,
                    'subtotal' => $line['lineTotal'],
                ]);

                $product->decrement('stock', $quantity);
                InventoryMovement::create([
                    'product_id' => $product->id,
                    'type' => 'sale',
                    'quantity' => -$quantity,
                    'before_stock' => $before,
                    'after_stock' => $before - $quantity,
                    'reference' => $order->order_number,
                    'notes' => 'Pesanan dari storefront',
                ]);
            }

            return $order;
        });

        return back()->with('success', "Pesanan {$order->order_number} berhasil dibuat.");
    }
}
