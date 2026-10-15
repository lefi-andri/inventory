<?php

namespace App\Http\Controllers;

use App\Models\InventoryMovement;
use App\Models\Product;
use App\Services\InventoryService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class InventoryController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Inventory/Index', [
            'products' => Product::with('category')->orderBy('name')->get()->map(fn ($product) => [
                'id' => $product->id,
                'name' => $product->localizedName(),
                'default_name' => $product->name,
                'sku' => $product->sku,
                'stock' => $product->stock,
                'threshold' => $product->low_stock_threshold,
                'category' => $product->category?->name,
            ]),
            'movements' => InventoryMovement::with(['product', 'user'])->latest()->limit(50)->get()->map(fn ($movement) => [
                'id' => $movement->id,
                'product' => $movement->product?->localizedName() ?? $movement->product?->name,
                'sku' => $movement->product?->sku,
                'user' => $movement->user?->name ?? 'Sistem',
                'type' => $movement->type,
                'quantity' => $movement->quantity,
                'before_stock' => $movement->before_stock,
                'after_stock' => $movement->after_stock,
                'reference' => $movement->reference,
                'notes' => $movement->notes,
                'created_at' => $movement->created_at,
            ]),
        ]);
    }

    public function store(Request $request, InventoryService $inventory): RedirectResponse
    {
        $data = $request->validate([
            'product_id' => ['required', 'exists:products,id'],
            'type' => ['required', 'in:purchase,adjustment,return,damaged'],
            'quantity' => [
                'required',
                'integer',
                Rule::when($request->input('type') === 'adjustment', ['not_in:0'], ['min:1']),
            ],
            'reference' => ['nullable', 'string', 'max:120'],
            'notes' => ['required', 'string', 'max:1000'],
        ]);

        DB::transaction(function () use ($data, $request, $inventory) {
            $product = Product::query()->lockForUpdate()->findOrFail($data['product_id']);
            $quantity = match ($data['type']) {
                'damaged' => -$data['quantity'],
                default => $data['quantity'],
            };

            $inventory->apply(
                product: $product,
                quantity: $quantity,
                type: $data['type'],
                userId: $request->user()->id,
                reference: $data['reference'] ?? null,
                notes: $data['notes'],
            );
        });

        return back()->with('success', 'Pergerakan stok berhasil dicatat.');
    }
}
