<?php

namespace App\Http\Controllers;

use App\Models\SiteSetting;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class SiteSettingController extends Controller
{
    public function edit(): Response
    {
        return Inertia::render('SiteSettings/Edit', [
            'settings' => SiteSetting::current()->load('media')->toSharedArray(),
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        // Empty arrays are omitted when Inertia serializes the form as multipart
        // data for logo uploads. Normalize them so an empty navigation/footer is
        // a valid, intentional configuration instead of a silent validation error.
        $request->merge([
            'navbar_links' => $request->input('navbar_links', []),
            'footer_links' => $request->input('footer_links', []),
        ]);

        $data = $request->validate([
            'brand_name' => ['required', 'string', 'max:80'],
            'logo' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:4096'],
            'remove_logo' => ['required', 'boolean'],
            'navbar_links' => ['array', 'max:10'],
            'navbar_links.*.label' => ['required', 'string', 'max:50'],
            'navbar_links.*.url' => ['required', 'string', 'max:500', $this->safeLinkRule()],
            'navbar_links.*.is_active' => ['required', 'boolean'],
            'footer_description' => ['nullable', 'string', 'max:500'],
            'footer_copyright' => ['nullable', 'string', 'max:180'],
            'footer_links' => ['array', 'max:10'],
            'footer_links.*.label' => ['required', 'string', 'max:50'],
            'footer_links.*.url' => ['required', 'string', 'max:500', $this->safeLinkRule()],
            'footer_links.*.is_active' => ['required', 'boolean'],
        ]);

        $logo = $data['logo'] ?? null;
        $removeLogo = $data['remove_logo'];
        unset($data['logo'], $data['remove_logo']);

        $settings = SiteSetting::current();
        $settings->update($data);

        if ($removeLogo) {
            $settings->clearMediaCollection('site-logo');
        }
        if ($logo) {
            $settings->addMedia($logo)->toMediaCollection('site-logo', 'public');
        }

        return back()->with('success', 'Tampilan situs berhasil diperbarui.');
    }

    private function safeLinkRule(): \Closure
    {
        return function (string $attribute, mixed $value, \Closure $fail): void {
            if (! Str::startsWith($value, ['#', '/', 'http://', 'https://'])) {
                $fail('Tautan harus berupa anchor, path internal, http, atau https.');
            }
        };
    }
}
