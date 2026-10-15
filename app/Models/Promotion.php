<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Promotion extends Model
{
    protected $fillable = ['kind', 'code', 'description', 'discount_type', 'value', 'min_order', 'max_discount', 'usage_limit', 'used_count', 'starts_at', 'ends_at', 'is_active'];

    protected function casts(): array
    {
        return ['value' => 'decimal:2', 'min_order' => 'decimal:2', 'max_discount' => 'decimal:2', 'starts_at' => 'datetime', 'ends_at' => 'datetime', 'is_active' => 'boolean'];
    }

    public function unavailableReason(float $subtotal): ?string
    {
        if (! $this->is_active) return 'Kode promo sedang tidak aktif.';
        if ($this->starts_at && now()->lt($this->starts_at)) return 'Kode promo belum dapat digunakan.';
        if ($this->ends_at && now()->gt($this->ends_at)) return 'Masa berlaku kode promo telah berakhir.';
        if ($this->usage_limit !== null && $this->used_count >= $this->usage_limit) return 'Kuota penggunaan kode promo telah habis.';
        if ($subtotal < (float) $this->min_order) {
            $isDollar = (CommerceSetting::current()->currency ?? 'IDR') === 'USD';
            $formattedMin = $isDollar
                ? '$'.number_format((float) $this->min_order, 2)
                : 'Rp'.number_format((float) $this->min_order, 0, ',', '.');
            return "Minimum belanja untuk kode ini adalah {$formattedMin}.";
        }

        return null;
    }

    public function discountFor(float $subtotal): float
    {
        $discount = $this->discount_type === 'percentage'
            ? $subtotal * ((float) $this->value / 100)
            : (float) $this->value;
        if ($this->max_discount !== null) $discount = min($discount, (float) $this->max_discount);

        return round(min($discount, $subtotal), 2);
    }
}
