<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\Product;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class ProductController extends Controller
{
    public function index(Request $request): Response
    {
        $products = Product::query()
            ->with(['category', 'media'])
            ->when($request->string('search')->toString(), fn ($query, $search) => $query
                ->where(fn ($q) => $q->where('name', 'like', "%{$search}%")->orWhere('sku', 'like', "%{$search}%")))
            ->latest()
            ->get()
            ->map(fn (Product $product) => $this->transform($product));

        return Inertia::render('Products/Index', [
            'products' => $products,
            'categories' => Category::orderBy('name')->get(['id', 'name']),
            'filters' => $request->only('search'),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $this->validated($request);
        $data['slug'] = $this->uniqueSlug($data['name']);
        $images = $data['images'] ?? [];
        unset($data['images']);

        $product = Product::create($data);
        foreach ($images as $image) {
            $product->addMedia($image)->toMediaCollection('products', 'public');
        }

        return back()->with('success', 'Produk berhasil ditambahkan.');
    }

    public function update(Request $request, Product $product): RedirectResponse
    {
        $data = $this->validated($request, $product);
        if ($data['name'] !== $product->name) {
            $data['slug'] = $this->uniqueSlug($data['name'], $product->id);
        }
        $images = $data['images'] ?? [];
        unset($data['images'], $data['stock']);
        $product->update($data);

        foreach ($images as $image) {
            $product->addMedia($image)->toMediaCollection('products', 'public');
        }

        return back()->with('success', 'Produk berhasil diperbarui.');
    }

    public function destroy(Product $product): RedirectResponse
    {
        if ($product->movements()->exists()) {
            $product->update(['is_active' => false]);
            return back()->with('success', 'Produk dinonaktifkan karena sudah memiliki riwayat stok.');
        }

        $product->delete();
        return back()->with('success', 'Produk berhasil dihapus.');
    }

    private function validated(Request $request, ?Product $product = null): array
    {
        return $request->validate([
            'category_id' => ['nullable', 'exists:categories,id'],
            'name' => ['required', 'string', 'max:160'],
            'sku' => ['required', 'string', 'max:80', Rule::unique('products')->ignore($product)],
            'description' => ['nullable', 'string', 'max:2000'],
            'price' => ['required', 'numeric', 'min:0'],
            'cost' => ['required', 'numeric', 'min:0'],
            'stock' => [$product ? 'nullable' : 'required', 'integer', 'min:0'],
            'low_stock_threshold' => ['required', 'integer', 'min:0'],
            'is_active' => ['required', 'boolean'],
            'images' => ['nullable', 'array', 'max:4'],
            'images.*' => ['image', 'mimes:jpg,jpeg,png,webp', 'max:4096'],
        ]);
    }

    private function uniqueSlug(string $name, ?int $ignoreId = null): string
    {
        $base = Str::slug($name);
        $slug = $base;
        $counter = 2;
        while (Product::where('slug', $slug)->when($ignoreId, fn ($q) => $q->whereKeyNot($ignoreId))->exists()) {
            $slug = "{$base}-{$counter}";
            $counter++;
        }
        return $slug;
    }

    private function transform(Product $product): array
    {
        return [
            'id' => $product->id,
            'category_id' => $product->category_id,
            'category' => $product->category?->name,
            'name' => $product->name,
            'sku' => $product->sku,
            'description' => $product->description,
            'price' => (float) $product->price,
            'cost' => (float) $product->cost,
            'stock' => $product->stock,
            'low_stock_threshold' => $product->low_stock_threshold,
            'is_active' => $product->is_active,
            'image' => $product->getFirstMediaUrl('products') ?: null,
            'images_count' => $product->media->count(),
        ];
    }
}
