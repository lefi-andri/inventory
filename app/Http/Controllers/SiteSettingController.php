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
        $settings = SiteSetting::current()->load('media');

        return Inertia::render('SiteSettings/Edit', [
            'settings' => [
                ...$settings->toSharedArray(),
                'cookie_consent_enabled' => (bool) ($settings->cookie_consent_enabled ?? true),
                'cookie_consent_title' => $settings->getEffectiveCookieConsentTitle(),
                'cookie_consent_message' => $settings->getEffectiveCookieConsentMessage(),
                'privacy_policy_title' => $settings->getEffectivePrivacyPolicyTitle(),
                'privacy_policy_content' => $settings->getEffectivePrivacyPolicyContent(),
                'cookie_policy_title' => $settings->getEffectiveCookiePolicyTitle(),
                'cookie_policy_content' => $settings->getEffectiveCookiePolicyContent(),
            ],
            'defaultTemplates' => [
                'cookie_consent_title' => SiteSetting::defaultCookieConsentTitle(),
                'cookie_consent_message' => SiteSetting::defaultCookieConsentMessage(),
                'privacy_policy_title' => SiteSetting::defaultPrivacyPolicyTitle(),
                'privacy_policy_content' => SiteSetting::defaultPrivacyPolicyContent(),
                'cookie_policy_title' => SiteSetting::defaultCookiePolicyTitle(),
                'cookie_policy_content' => SiteSetting::defaultCookiePolicyContent(),
            ],
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        // Normalize link arrays so empty navigation/footer is a valid configuration
        // and handle fragmentation caused by multipart bracket notation (e.g. navbar_links[][label]).
        $request->merge([
            'navbar_links' => $this->normalizeLinkArray($request->input('navbar_links', [])),
            'footer_links' => $this->normalizeLinkArray($request->input('footer_links', [])),
            'cookie_consent_enabled' => $request->boolean('cookie_consent_enabled'),
        ]);

        $data = $request->validate([
            'brand_name' => ['required', 'string', 'max:80'],
            'theme_color' => ['nullable', 'string', 'max:20', 'regex:/^#([a-f0-9]{6}|[a-f0-9]{3})$/i'],
            'default_locale' => ['nullable', 'string', 'in:id,en'],
            'logo' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:4096'],
            'remove_logo' => ['nullable', 'boolean'],
            'favicon' => ['nullable', 'file', 'mimes:ico,png,jpg,jpeg,webp,svg', 'max:2048'],
            'remove_favicon' => ['nullable', 'boolean'],
            'cookie_consent_enabled' => ['required', 'boolean'],
            'cookie_consent_title' => ['nullable', 'string', 'max:120'],
            'cookie_consent_message' => ['nullable', 'string', 'max:1000'],
            'privacy_policy_title' => ['nullable', 'string', 'max:150'],
            'privacy_policy_content' => ['nullable', 'string'],
            'cookie_policy_title' => ['nullable', 'string', 'max:150'],
            'cookie_policy_content' => ['nullable', 'string'],
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

        if (array_key_exists('theme_color', $data)) {
            $data['theme_color'] = \App\Support\ThemeColor::sanitize($data['theme_color']);
        }

        $logo = $request->hasFile('logo') ? $request->file('logo') : null;
        $removeLogo = $request->boolean('remove_logo');
        $favicon = $request->hasFile('favicon') ? $request->file('favicon') : null;
        $removeFavicon = $request->boolean('remove_favicon');
        unset($data['logo'], $data['remove_logo'], $data['favicon'], $data['remove_favicon']);

        $settings = SiteSetting::current();
        $settings->update($data);

        if (! empty($data['default_locale'])) {
            $request->session()->put('locale', $data['default_locale']);
            if ($request->user() && $request->user()->locale !== null) {
                $request->user()->update(['locale' => $data['default_locale']]);
            }
        }

        if ($removeLogo) {
            $settings->clearMediaCollection('site-logo');
        }
        if ($logo) {
            $settings->addMedia($logo)->toMediaCollection('site-logo', 'public');
        }

        if ($removeFavicon) {
            $settings->clearMediaCollection('site-favicon');
        }
        if ($favicon) {
            $settings->addMedia($favicon)->toMediaCollection('site-favicon', 'public');
        }

        return back()->with('success', 'Tampilan situs berhasil diperbarui.');
    }

    private function normalizeLinkArray(mixed $links): array
    {
        if (! is_array($links)) {
            return [];
        }

        // Reconstruct link items if fragmented by PHP multipart parser from empty bracket notation (e.g. navbar_links[][label])
        $isFragmented = false;
        foreach ($links as $item) {
            if (is_array($item) && count($item) === 1 && (isset($item['label']) || isset($item['url']) || isset($item['is_active']))) {
                $isFragmented = true;
                break;
            }
        }

        if ($isFragmented) {
            $reconstituted = [];
            $currentItem = [];
            foreach ($links as $item) {
                if (! is_array($item)) {
                    continue;
                }
                $currentItem = array_merge($currentItem, $item);
                if (isset($currentItem['label'], $currentItem['url'], $currentItem['is_active'])) {
                    $currentItem['is_active'] = filter_var($currentItem['is_active'], FILTER_VALIDATE_BOOLEAN);
                    $reconstituted[] = $currentItem;
                    $currentItem = [];
                }
            }
            if (! empty($currentItem)) {
                $reconstituted[] = $currentItem;
            }

            return $reconstituted;
        }

        return array_values(array_map(function ($item) {
            if (is_array($item) && isset($item['is_active'])) {
                $item['is_active'] = filter_var($item['is_active'], FILTER_VALIDATE_BOOLEAN);
            }

            return $item;
        }, $links));
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
