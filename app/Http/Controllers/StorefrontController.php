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
        $products = Product::query()
            ->with(['category', 'media'])
            ->where('is_active', true)
            ->where('stock', '>', 0)
            ->latest()
            ->get()
            ->map(function (Product $product) {
                $images = $product->getMedia('products')->map(fn ($media) => $media->getUrl())->values();

                return [
                    'id' => $product->id,
                    'name' => $product->name,
                    'slug' => $product->slug,
                    'sku' => $product->sku,
                    'description' => $product->description,
                    'price' => (float) $product->price,
                    'stock' => $product->stock,
                    'category' => $product->category?->name,
                    'is_active' => $product->is_active,
                    'image' => $images->first(),
                    'images' => $images,
                ];
            });

        return Inertia::render('Storefront', [
            'products' => $products,
            'categories' => Category::orderBy('name')->get(['id', 'name', 'slug']),
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
                'shipping_cost' => (float) CommerceSetting::current()->shipping_cost,
                'free_shipping_threshold' => CommerceSetting::current()->free_shipping_threshold !== null
                    ? (float) CommerceSetting::current()->free_shipping_threshold
                    : null,
            ],
        ]);
    }
}
