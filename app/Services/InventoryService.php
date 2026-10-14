<?php

namespace App\Services;

use App\Models\InventoryMovement;
use App\Models\Product;
use Illuminate\Validation\ValidationException;

class InventoryService
{
    /**
     * Apply a signed stock change to a product that is already protected by
     * the caller's database transaction (and row lock for existing products).
     */
    public function apply(
        Product $product,
        int $quantity,
        string $type,
        ?int $userId = null,
        ?string $reference = null,
        ?string $notes = null,
    ): InventoryMovement {
        if ($quantity === 0) {
            throw ValidationException::withMessages([
                'quantity' => 'Perubahan stok tidak boleh nol.',
            ]);
        }

        $before = (int) $product->stock;
        $after = $before + $quantity;

        if ($after < 0) {
            throw ValidationException::withMessages([
                'quantity' => "Stok {$product->name} tidak mencukupi. Stok tersedia: {$before}.",
            ]);
        }

        $movement = InventoryMovement::create([
            'product_id' => $product->id,
            'user_id' => $userId,
            'type' => $type,
            'quantity' => $quantity,
            'before_stock' => $before,
            'after_stock' => $after,
            'reference' => $reference,
            'notes' => $notes,
        ]);

        $product->update(['stock' => $after]);

        return $movement;
    }
}
