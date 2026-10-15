<?php

namespace App\Http\Controllers;

use App\Models\CommerceSetting;
use App\Models\Promotion;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class PromotionController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Promotions/Index', [
            'promotions' => Promotion::latest()->get(),
            'shippingSettings' => CommerceSetting::current(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        Promotion::create($this->validated($request));
        return back()->with('success', 'Kupon atau voucher berhasil dibuat.');
    }

    public function update(Request $request, Promotion $promotion): RedirectResponse
    {
        $promotion->update($this->validated($request, $promotion));
        return back()->with('success', 'Promo berhasil diperbarui.');
    }

    public function destroy(Promotion $promotion): RedirectResponse
    {
        $promotion->delete();
        return back()->with('success', 'Promo berhasil dihapus.');
    }

    public function updateShipping(Request $request): RedirectResponse
    {
        $request->merge([
            'shipping_label' => $request->input('shipping_label', CommerceSetting::current()->shipping_label),
        ]);

        $data = $request->validate([
            'shipping_label' => ['required', 'string', 'max:100'],
            'shipping_cost' => ['required', 'numeric', 'min:0'],
            'free_shipping_threshold' => ['nullable', 'numeric', 'min:0'],
        ]);
        $settings = CommerceSetting::current();
        $settings->fill($data)->save();
        return back()->with('success', 'Pengaturan ongkir berhasil disimpan.');
    }

    public function updatePayment(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'currency' => ['nullable', 'string', 'in:IDR,USD'],
            'bank_transfer_enabled' => ['required', 'boolean'],
            'bank_name' => ['nullable', 'required_if:bank_transfer_enabled,true', 'string', 'max:100'],
            'bank_account_number' => ['nullable', 'required_if:bank_transfer_enabled,true', 'string', 'max:100'],
            'bank_account_name' => ['nullable', 'required_if:bank_transfer_enabled,true', 'string', 'max:100'],
            'cod_enabled' => ['required', 'boolean'],
            'payment_instructions' => ['nullable', 'string', 'max:1000'],
        ]);

        $data['currency'] = $data['currency'] ?? 'IDR';

        if (! $data['bank_transfer_enabled'] && ! $data['cod_enabled']) {
            throw \Illuminate\Validation\ValidationException::withMessages([
                'bank_transfer_enabled' => 'Aktifkan minimal satu metode pembayaran.',
            ]);
        }

        $settings = CommerceSetting::current();
        $settings->fill($data)->save();

        return back()->with('success', 'Informasi pembayaran berhasil disimpan.');
    }

    private function validated(Request $request, ?Promotion $promotion = null): array
    {
        $data = $request->validate([
            'kind' => ['required', Rule::in(['coupon', 'voucher'])],
            'code' => ['required', 'string', 'max:50', Rule::unique('promotions', 'code')->ignore($promotion?->id)],
            'description' => ['nullable', 'string', 'max:255'],
            'discount_type' => ['required', Rule::in(['fixed', 'percentage'])],
            'value' => ['required', 'numeric', 'gt:0'],
            'min_order' => ['required', 'numeric', 'min:0'],
            'max_discount' => ['nullable', 'numeric', 'gt:0'],
            'usage_limit' => ['nullable', 'integer', 'min:1'],
            'starts_at' => ['nullable', 'date'],
            'ends_at' => ['nullable', 'date', 'after_or_equal:starts_at'],
            'is_active' => ['required', 'boolean'],
        ]);
        $data['code'] = strtoupper(trim($data['code']));
        if ($data['discount_type'] === 'percentage' && $data['value'] > 100) {
            throw \Illuminate\Validation\ValidationException::withMessages(['value' => 'Diskon persentase maksimal 100%.']);
        }
        return $data;
    }
}
