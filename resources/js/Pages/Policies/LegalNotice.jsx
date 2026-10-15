import BrandLogo from '@/Components/BrandLogo';
import SitePreferencesBanner from '@/Components/SitePreferencesBanner';
import FloatingChatWidget from '@/Components/FloatingChatWidget';
import LanguageSwitcher from '@/Components/LanguageSwitcher';
import PolicyDocument from '@/Components/PolicyDocument';
import { Button } from '@/Components/ui/button';
import { Head, Link, usePage } from '@inertiajs/react';
import { ArrowLeft, Cookie, FileText, Settings2, Shield, Store } from 'lucide-react';
import React from 'react';

export default function LegalNotice({ type = 'cookie', title, content }) {
    const { site } = usePage().props;
    const isCookiePolicy = type === 'cookie' || (title && title.toLowerCase().includes('cookie'));

    const openConsentSettings = () => {
        window.dispatchEvent(new CustomEvent('open-cookie-settings'));
    };

    const brandName = site?.brand_name || 'Stokara';
    const copyright = site?.footer_copyright || `© ${new Date().getFullYear()} ${brandName}. Semua hak dilindungi.`;

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-blue-500 selection:text-white">
            <Head title={`${title} - ${brandName}`} />

            {/* Header / Navbar */}
            <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
                <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center gap-4">
                        <Link href={route('storefront')} className="flex items-center gap-2.5">
                            <BrandLogo className="size-8" />
                            <span className="text-lg font-black tracking-tight">{brandName}</span>
                        </Link>
                    </div>

                    <div className="flex items-center gap-3">
                        <LanguageSwitcher />
                        <Link
                            href={route('storefront')}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-bold text-slate-700 shadow-xs transition hover:bg-slate-50"
                        >
                            <Store className="size-3.5" />
                            <span>Katalog Toko</span>
                        </Link>
                    </div>
                </div>
            </header>

            {/* Hero / Eyebrow Header */}
            <div className="border-b border-slate-200 bg-white py-10 sm:py-14">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <Link
                        href={route('storefront')}
                        className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-600 hover:text-blue-700 mb-4"
                    >
                        <ArrowLeft className="size-3.5" />
                        <span>Kembali ke Storefront</span>
                    </Link>

                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <div className="flex items-center gap-2">
                                {isCookiePolicy ? (
                                    <>
                                        <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-extrabold text-blue-700">
                                            <Cookie className="size-3.5" />
                                            Transparansi Cookie & Pelacak
                                        </span>
                                        <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                                            GDPR & PDP Compliant
                                        </span>
                                    </>
                                ) : (
                                    <>
                                        <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-extrabold text-blue-700">
                                            <Shield className="size-3.5" />
                                            Perlindungan Data Pribadi
                                        </span>
                                        <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                                            UU PDP Compliant
                                        </span>
                                    </>
                                )}
                            </div>
                            <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl text-slate-950">
                                {title}
                            </h1>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            {isCookiePolicy ? (
                                <>
                                    <Button
                                        type="button"
                                        onClick={openConsentSettings}
                                        className="rounded-xl bg-blue-600 text-xs font-bold hover:bg-blue-700"
                                    >
                                        <Settings2 className="size-4 mr-1.5" />
                                        <span>Ubah Persetujuan Cookie</span>
                                    </Button>
                                    <Link
                                        href={route('privacy-policy')}
                                        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 shadow-xs hover:border-blue-300 hover:text-blue-600 transition"
                                    >
                                        <Shield className="size-4" />
                                        <span>Kebijakan Privasi</span>
                                    </Link>
                                </>
                            ) : (
                                <Link
                                    href={route('cookie-policy')}
                                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 shadow-xs hover:border-blue-300 hover:text-blue-600 transition"
                                >
                                    <Cookie className="size-4" />
                                    <span>Lihat Kebijakan Cookie</span>
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Document Content */}
            <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
                <PolicyDocument title={title} content={content} />
            </main>

            {/* Simple Footer */}
            <footer className="border-t border-slate-200 bg-white py-8 text-center text-xs text-slate-500">
                <div className="mx-auto max-w-7xl px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <p>{copyright}</p>
                    <div className="flex items-center gap-4 font-semibold">
                        <Link
                            href={route('privacy-policy')}
                            className={!isCookiePolicy ? 'text-blue-600 hover:underline' : 'text-slate-600 hover:text-blue-600'}
                        >
                            Kebijakan Privasi
                        </Link>
                        <span>·</span>
                        <Link
                            href={route('cookie-policy')}
                            className={isCookiePolicy ? 'text-blue-600 hover:underline' : 'text-slate-600 hover:text-blue-600'}
                        >
                            Kebijakan Cookie
                        </Link>
                        <span>·</span>
                        <button
                            type="button"
                            onClick={openConsentSettings}
                            className="text-slate-600 hover:text-blue-600"
                        >
                            Pengaturan Cookie
                        </button>
                    </div>
                </div>
            </footer>

            <SitePreferencesBanner />
            <FloatingChatWidget />
        </div>
    );
}
