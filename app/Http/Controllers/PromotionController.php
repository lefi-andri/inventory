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
        $data = $request->validate([
            'shipping_cost' => ['required', 'numeric', 'min:0'],
            'free_shipping_threshold' => ['nullable', 'numeric', 'min:0'],
        ]);
        CommerceSetting::query()->updateOrCreate(['id' => 1], $data);
        return back()->with('success', 'Pengaturan ongkir berhasil disimpan.');
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
