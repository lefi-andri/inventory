<?php

namespace App\Http\Controllers;

use App\Models\Category;
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
            ->map(fn (Product $product) => [
                'id' => $product->id,
                'name' => $product->name,
                'slug' => $product->slug,
                'sku' => $product->sku,
                'description' => $product->description,
                'price' => (float) $product->price,
                'stock' => $product->stock,
                'category' => $product->category?->name,
                'image' => $product->getFirstMediaUrl('products') ?: null,
            ]);

        return Inertia::render('Storefront', [
            'products' => $products,
            'categories' => Category::orderBy('name')->get(['id', 'name', 'slug']),
        ]);
    }
}
