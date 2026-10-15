<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('site_settings', function (Blueprint $table) {
            $table->boolean('cookie_consent_enabled')->default(true);
            $table->string('cookie_consent_title')->nullable();
            $table->text('cookie_consent_message')->nullable();
            $table->string('privacy_policy_title')->nullable();
            $table->longText('privacy_policy_content')->nullable();
            $table->string('cookie_policy_title')->nullable();
            $table->longText('cookie_policy_content')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('site_settings', function (Blueprint $table) {
            $table->dropColumn([
                'cookie_consent_enabled',
                'cookie_consent_title',
                'cookie_consent_message',
                'privacy_policy_title',
                'privacy_policy_content',
                'cookie_policy_title',
                'cookie_policy_content',
            ]);
        });
    }
};
