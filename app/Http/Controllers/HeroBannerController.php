<?php

namespace App\Http\Controllers;

use App\Models\HeroBanner;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class HeroBannerController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('HeroBanners/Index', [
            'banners' => HeroBanner::query()
                ->with('media')
                ->orderBy('sort_order')
                ->orderByDesc('id')
                ->get()
                ->map(fn (HeroBanner $banner) => $this->transform($banner)),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $this->validated($request, true);
        $image = $data['image'];
        unset($data['image']);

        $banner = HeroBanner::create($data);
        $banner->addMedia($image)->toMediaCollection('hero-banners', 'public');

        return back()->with('success', 'Hero banner berhasil ditambahkan.');
    }

    public function update(Request $request, HeroBanner $heroBanner): RedirectResponse
    {
        $data = $this->validated($request);
        $image = $data['image'] ?? null;
        unset($data['image']);

        $heroBanner->update($data);
        if ($image) {
            $heroBanner->addMedia($image)->toMediaCollection('hero-banners', 'public');
        }

        return back()->with('success', 'Hero banner berhasil diperbarui.');
    }

    public function destroy(HeroBanner $heroBanner): RedirectResponse
    {
        $heroBanner->delete();

        return back()->with('success', 'Hero banner berhasil dihapus.');
    }

    private function validated(Request $request, bool $imageRequired = false): array
    {
        $data = $request->validate([
            'eyebrow' => ['nullable', 'string', 'max:100'],
            'title' => ['required', 'string', 'max:160'],
            'description' => ['nullable', 'string', 'max:500'],
            'cta_label' => ['nullable', 'string', 'max:60'],
            'cta_url' => [
                'nullable',
                'string',
                'max:500',
                function (string $attribute, mixed $value, \Closure $fail): void {
                    if ($value && ! Str::startsWith($value, ['#', '/', 'http://', 'https://'])) {
                        $fail('Tautan tombol harus berupa tautan internal, http, atau https.');
                    }
                },
            ],
            'sort_order' => ['required', 'integer', 'min:0'],
            'is_active' => ['required', 'boolean'],
            'image' => [$imageRequired ? 'required' : 'nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:8192'],
        ]);

        if (($data['cta_label'] ?? null) && ! ($data['cta_url'] ?? null)) {
            throw ValidationException::withMessages([
                'cta_url' => 'Tautan tombol wajib diisi jika label tombol digunakan.',
            ]);
        }

        return $data;
    }

    private function transform(HeroBanner $banner): array
    {
        return [
            'id' => $banner->id,
            'eyebrow' => $banner->eyebrow,
            'title' => $banner->title,
            'description' => $banner->description,
            'cta_label' => $banner->cta_label,
            'cta_url' => $banner->cta_url,
            'sort_order' => $banner->sort_order,
            'is_active' => $banner->is_active,
            'image' => $banner->getFirstMediaUrl('hero-banners'),
        ];
    }
}
