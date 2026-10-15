<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\Product;
use App\Services\InventoryService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
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
                ->where(fn ($q) => $q->where('name', 'like', "%{$search}%")
                    ->orWhere('sku', 'like', "%{$search}%")
                    ->orWhere('translations', 'like', "%{$search}%")))
            ->latest()
            ->get()
            ->map(fn (Product $product) => $this->transform($product));

        return Inertia::render('Products/Index', [
            'products' => $products,
            'categories' => Category::orderBy('name')->get(['id', 'name']),
            'filters' => $request->only('search'),
        ]);
    }

    public function store(Request $request, InventoryService $inventory): RedirectResponse
    {
        $data = $this->validated($request);
        $data['slug'] = $this->uniqueSlug($data['name']);
        $images = $data['images'] ?? [];
        unset($data['images']);

        $product = DB::transaction(function () use ($data, $request, $inventory) {
            $initialStock = (int) $data['stock'];
            $product = Product::create([...$data, 'stock' => 0]);

            if ($initialStock > 0) {
                $inventory->apply(
                    product: $product,
                    quantity: $initialStock,
                    type: 'opening_balance',
                    userId: $request->user()->id,
                    notes: 'Stok awal saat produk dibuat',
                );
            }

            return $product;
        });
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
        $deletedMediaIds = $data['deleted_media_ids'] ?? [];
        $primaryMediaId = $data['primary_media_id'] ?? null;
        unset($data['images'], $data['stock'], $data['deleted_media_ids'], $data['primary_media_id']);
        $product->update($data);

        if (! empty($deletedMediaIds) && is_array($deletedMediaIds)) {
            $product->media()->whereIn('id', $deletedMediaIds)->each(fn ($m) => $m->delete());
        }

        foreach ($images as $image) {
            $product->addMedia($image)->toMediaCollection('products', 'public');
        }

        if ($primaryMediaId) {
            $target = $product->media()->find($primaryMediaId);
            if ($target) {
                $minOrder = $product->media()->min('order_column') ?? 1;
                $target->order_column = $minOrder - 1;
                $target->save();
            }
        }

        return back()->with('success', 'Produk berhasil diperbarui.');
    }

    public function storeMedia(Request $request, Product $product): RedirectResponse
    {
        $request->validate([
            'images' => ['required', 'array', 'max:8'],
            'images.*' => ['image', 'mimes:jpg,jpeg,png,webp', 'max:4096'],
        ]);

        foreach ($request->file('images', []) as $image) {
            $product->addMedia($image)->toMediaCollection('products', 'public');
        }

        return back()->with('success', 'Gambar produk berhasil ditambahkan.');
    }

    public function destroyMedia(Product $product, int $mediaId): RedirectResponse
    {
        $media = $product->media()->findOrFail($mediaId);
        $media->delete();

        return back()->with('success', 'Gambar produk berhasil dihapus.');
    }

    public function setPrimaryMedia(Product $product, int $mediaId): RedirectResponse
    {
        $target = $product->media()->findOrFail($mediaId);
        $minOrder = $product->media()->min('order_column') ?? 1;
        $target->order_column = $minOrder - 1;
        $target->save();

        return back()->with('success', 'Gambar utama produk berhasil diperbarui.');
    }

    public function destroy(Product $product): RedirectResponse
    {
        if ($product->movements()->exists()) {
            $product->update([
                'is_active' => false,
                'is_discontinued' => true,
            ]);

            return back()->with('success', 'Produk ditandai discontinue karena sudah memiliki riwayat stok.');
        }

        $product->delete();

        return back()->with('success', 'Produk berhasil dihapus.');
    }

    private function validated(Request $request, ?Product $product = null): array
    {
        $data = $request->validate([
            'category_id' => ['nullable', 'exists:categories,id'],
            'name' => ['nullable', 'string', 'max:160'],
            'sku' => ['required', 'string', 'max:80', Rule::unique('products')->ignore($product)],
            'description' => ['nullable', 'string', 'max:2000'],
            'translations' => ['nullable'],
            'price' => ['required', 'numeric', 'min:0'],
            'cost' => ['required', 'numeric', 'min:0'],
            'stock' => [$product ? 'nullable' : 'required', 'integer', 'min:0'],
            'low_stock_threshold' => ['required', 'integer', 'min:0'],
            'is_active' => ['required', 'boolean'],
            'is_discontinued' => ['sometimes', 'boolean'],
            'images' => ['nullable', 'array', 'max:8'],
            'images.*' => ['image', 'mimes:jpg,jpeg,png,webp', 'max:4096'],
            'deleted_media_ids' => ['nullable', 'array'],
            'deleted_media_ids.*' => ['integer'],
            'primary_media_id' => ['nullable', 'integer'],
        ]);

        $rawTranslations = $data['translations'] ?? [];
        if (is_string($rawTranslations)) {
            $rawTranslations = json_decode($rawTranslations, true) ?? [];
        }
        if (! is_array($rawTranslations)) {
            $rawTranslations = [];
        }

        $idName = trim((string) ($rawTranslations['id']['name'] ?? $data['name'] ?? ''));
        $idDescription = trim((string) ($rawTranslations['id']['description'] ?? $data['description'] ?? ''));
        $enName = trim((string) ($rawTranslations['en']['name'] ?? ''));
        $enDescription = trim((string) ($rawTranslations['en']['description'] ?? ''));

        if ($idName === '') {
            throw \Illuminate\Validation\ValidationException::withMessages([
                'name' => 'Nama produk wajib diisi.',
            ]);
        }

        $data['name'] = $idName;
        $data['description'] = $idDescription !== '' ? $idDescription : null;
        $data['translations'] = [
            'id' => [
                'name' => $idName,
                'description' => $idDescription !== '' ? $idDescription : null,
            ],
            'en' => [
                'name' => $enName !== '' ? $enName : null,
                'description' => $enDescription !== '' ? $enDescription : null,
            ],
        ];

        return $data;
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
        $translations = $product->translations ?? [];
        $idName = $translations['id']['name'] ?? $product->name;
        $idDesc = $translations['id']['description'] ?? $product->description;
        $enName = $translations['en']['name'] ?? '';
        $enDesc = $translations['en']['description'] ?? '';

        $mediaList = $product->getMedia('products')->values();
        $images = $mediaList->map(fn ($m, $index) => [
            'id' => $m->id,
            'url' => $m->getUrl(),
            'file_name' => $m->file_name,
            'size' => $m->human_readable_size,
            'is_primary' => $index === 0,
        ])->all();

        return [
            'id' => $product->id,
            'category_id' => $product->category_id,
            'category' => $product->category?->name,
            'name' => $product->localizedName(),
            'default_name' => $product->name,
            'sku' => $product->sku,
            'description' => $product->localizedDescription(),
            'price' => (float) $product->price,
            'cost' => (float) $product->cost,
            'stock' => $product->stock,
            'low_stock_threshold' => $product->low_stock_threshold,
            'is_active' => $product->is_active,
            'is_discontinued' => $product->is_discontinued,
            'image' => $images[0]['url'] ?? null,
            'images' => $images,
            'images_count' => count($images),
            'translations' => [
                'id' => ['name' => $idName, 'description' => $idDesc ?: ''],
                'en' => ['name' => $enName, 'description' => $enDesc ?: ''],
            ],
            'available_locales' => array_values(array_filter([
                ! empty($idName) ? 'id' : null,
                ! empty($enName) ? 'en' : null,
            ])),
        ];
    }
}
