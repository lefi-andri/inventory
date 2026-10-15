<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CommerceSetting extends Model
{
    protected $fillable = [
        'shipping_label',
        'currency',
        'shipping_cost',
        'free_shipping_threshold',
        'bank_transfer_enabled',
        'bank_name',
        'bank_account_number',
        'bank_account_name',
        'cod_enabled',
        'payment_instructions',
    ];

    protected function casts(): array
    {
        return [
            'shipping_cost' => 'decimal:2',
            'free_shipping_threshold' => 'decimal:2',
            'bank_transfer_enabled' => 'boolean',
            'cod_enabled' => 'boolean',
        ];
    }

    public static function current(): self
    {
        return static::query()->first() ?? new static([
            'shipping_label' => 'Pengiriman reguler',
            'currency' => 'IDR',
            'shipping_cost' => 25000,
            'free_shipping_threshold' => 500000,
            'bank_transfer_enabled' => true,
            'cod_enabled' => false,
        ]);
    }

    public function currencySymbol(): string
    {
        return $this->currency === 'USD' ? '$' : 'Rp';
    }

    public function isDollar(): bool
    {
        return $this->currency === 'USD';
    }

    public function shippingFor(float $subtotal): float
    {
        $threshold = $this->free_shipping_threshold;
        return $threshold !== null && $subtotal >= (float) $threshold ? 0 : (float) $this->shipping_cost;
    }

    public function availablePaymentMethods(): array
    {
        $methods = [];

        if ($this->bank_transfer_enabled) {
            $methods[] = [
                'value' => 'bank_transfer',
                'label' => 'Transfer bank',
                'description' => $this->bank_name
                    ? trim($this->bank_name.' · '.$this->bank_account_number, ' ·')
                    : 'Bayar melalui transfer bank setelah pesanan dibuat.',
                'details' => array_filter([
                    'bank_name' => $this->bank_name,
                    'account_number' => $this->bank_account_number,
                    'account_name' => $this->bank_account_name,
                    'instructions' => $this->payment_instructions
                        ?: (! $this->bank_name ? 'Detail rekening akan diinformasikan oleh admin setelah pesanan dibuat.' : null),
                ], fn ($value) => $value !== null && $value !== ''),
            ];
        }

        if ($this->cod_enabled) {
            $methods[] = [
                'value' => 'cod',
                'label' => 'Bayar di tempat (COD)',
                'description' => 'Bayar saat pesanan diterima.',
                'details' => array_filter([
                    'instructions' => $this->payment_instructions,
                ], fn ($value) => $value !== null && $value !== ''),
            ];
        }

        return $methods;
    }
}
