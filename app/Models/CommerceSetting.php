<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CommerceSetting extends Model
{
    protected $fillable = ['shipping_cost', 'free_shipping_threshold'];

    protected function casts(): array
    {
        return ['shipping_cost' => 'decimal:2', 'free_shipping_threshold' => 'decimal:2'];
    }

    public static function current(): self
    {
        return static::query()->first() ?? new static([
            'shipping_cost' => 25000,
            'free_shipping_threshold' => 500000,
        ]);
    }

    public function shippingFor(float $subtotal): float
    {
        $threshold = $this->free_shipping_threshold;
        return $threshold !== null && $subtotal >= (float) $threshold ? 0 : (float) $this->shipping_cost;
    }
}
