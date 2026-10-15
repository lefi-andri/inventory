<?php

namespace App\Http\Controllers;

use App\Models\SiteSetting;
use Inertia\Inertia;
use Inertia\Response;

class PolicyController extends Controller
{
    public function privacy(): Response
    {
        $setting = SiteSetting::current();

        return Inertia::render('Policies/LegalNotice', [
            'type' => 'privacy',
            'title' => $setting->getEffectivePrivacyPolicyTitle(),
            'content' => $setting->getEffectivePrivacyPolicyContent(),
        ]);
    }

    public function cookie(): Response
    {
        $setting = SiteSetting::current();

        return Inertia::render('Policies/LegalNotice', [
            'type' => 'cookie',
            'title' => $setting->getEffectiveCookiePolicyTitle(),
            'content' => $setting->getEffectiveCookiePolicyContent(),
        ]);
    }
}
