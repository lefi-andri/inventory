<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\CommerceSetting;
use App\Models\HeroBanner;
use App\Models\Product;
use Inertia\Inertia;
use Inertia\Response;

class StorefrontController extends Controller
{
    public function index(): Response
    {
        $commerceSettings = CommerceSetting::current();
        $isDollar = ($commerceSettings->currency ?? 'IDR') === 'USD';
        $products = Product::query()
            ->with(['category', 'media'])
            ->availableForSale()
            ->latest()
            ->get()
            ->map(function (Product $product) use ($isDollar) {
                $images = $product->getMedia('products')->map(fn ($media) => $media->getUrl())->values();
                $effectivePrice = ($isDollar && $product->price_usd !== null && (float) $product->price_usd > 0)
                    ? (float) $product->price_usd
                    : (float) $product->price;

                return [
                    'id' => $product->id,
                    'name' => $product->localizedName(),
                    'default_name' => $product->name,
                    'slug' => $product->slug,
                    'sku' => $product->sku,
                    'description' => $product->localizedDescription(),
                    'price' => $effectivePrice,
                    'price_idr' => (float) $product->price,
                    'price_usd' => $product->price_usd !== null ? (float) $product->price_usd : null,
                    'stock' => $product->stock,
                    'category' => $product->category?->name,
                    'is_active' => $product->is_active,
                    'image' => $images->first(),
                    'images' => $images,
                    'translations' => $product->translations ?? [],
                ];
            });

        return Inertia::render('Storefront', [
            'products' => $products,
            'categories' => Category::query()
                ->whereHas('products', fn ($query) => $query->availableForSale())
                ->orderBy('name')
                ->get(['id', 'name', 'slug']),
            'heroBanners' => HeroBanner::query()
                ->with('media')
                ->where('is_active', true)
                ->orderBy('sort_order')
                ->orderBy('id')
                ->get()
                ->map(fn (HeroBanner $banner) => [
                    'id' => $banner->id,
                    'eyebrow' => $banner->eyebrow,
                    'title' => $banner->title,
                    'description' => $banner->description,
                    'cta_label' => $banner->cta_label,
                    'cta_url' => $banner->cta_url,
                    'image' => $banner->getFirstMediaUrl('hero-banners'),
                ]),
            'shippingSettings' => [
                'shipping_label' => $commerceSettings->shipping_label,
                'shipping_cost' => (float) $commerceSettings->shipping_cost,
                'free_shipping_threshold' => $commerceSettings->free_shipping_threshold !== null
                    ? (float) $commerceSettings->free_shipping_threshold
                    : null,
            ],
            'paymentMethods' => $commerceSettings->availablePaymentMethods(),
        ]);
    }
}
