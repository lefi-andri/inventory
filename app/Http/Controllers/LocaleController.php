<?php

namespace App\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class LocaleController extends Controller
{
    public function __invoke(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'locale' => ['required', Rule::in(['id', 'en'])],
        ]);

        $request->session()->put('locale', $data['locale']);

        if ($request->user()) {
            $request->user()->update(['locale' => $data['locale']]);
        }

        return back();
    }
}
