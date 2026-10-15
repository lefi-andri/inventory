<?php

namespace App\Http\Middleware;

use App\Models\SiteSetting;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\App;
use Symfony\Component\HttpFoundation\Response;

class SetLocale
{
    public function handle(Request $request, Closure $next): Response
    {
        $defaultLocale = 'id';
        try {
            $defaultLocale = SiteSetting::current()->default_locale ?: 'id';
        } catch (\Throwable $e) {
            $defaultLocale = 'id';
        }

        if (! in_array($defaultLocale, ['id', 'en'], true)) {
            $defaultLocale = 'id';
        }

        $locale = $request->user()?->locale
            ?? $request->session()->get('locale', $defaultLocale);

        if (! in_array($locale, ['id', 'en'], true)) {
            $locale = $defaultLocale;
        }

        App::setLocale($locale);

        $response = $next($request);
        $response->headers->set('Content-Language', $locale);

        return $response;
    }
}
