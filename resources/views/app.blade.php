@php
    $currentSetting = \App\Models\SiteSetting::current();
    $faviconUrl = $currentSetting?->getFirstMediaUrl('site-favicon');
    $currentCurrency = \App\Models\CommerceSetting::current()->currency ?? 'IDR';
@endphp
<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}" data-currency="{{ $currentCurrency }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">

        <title inertia>{{ config('app.name', 'TithoShop') }}</title>

        <!-- Dynamic Favicon -->
        @if ($faviconUrl)
            <link rel="icon" id="dynamic-favicon" href="{{ $faviconUrl }}">
            <link rel="apple-touch-icon" href="{{ $faviconUrl }}">
        @else
            <link rel="icon" id="dynamic-favicon" type="image/svg+xml" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%232563eb' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z'/><path d='M3 6h18'/><path d='M16 10a4 4 0 0 1-8 0'/></svg>">
        @endif

        <!-- Fonts -->
        <link rel="preconnect" href="https://fonts.bunny.net">
        <link href="https://fonts.bunny.net/css?family=figtree:400,500,600&display=swap" rel="stylesheet" />

        <!-- Dynamic Theme Color -->
        <style id="site-theme-styles">
            :root {
                {!! \App\Support\ThemeColor::toCss(optional(\App\Models\SiteSetting::current())->theme_color) !!};
            }
        </style>

        <!-- Scripts -->
        @routes
        @viteReactRefresh
        @vite('resources/css/app.css')
        @vite(['resources/js/app.jsx', "resources/js/Pages/{$page['component']}.jsx"])
        @inertiaHead
    </head>
    <body class="font-sans antialiased">
        @inertia
    </body>
</html>
