import { Button } from '@/Components/ui/button';
import { Link, usePage } from '@inertiajs/react';
import { Cookie, Settings2, ShieldCheck, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';

const STORAGE_KEY = 'site_privacy_preferences';

export default function SitePreferencesBanner() {
    const { site } = usePage().props;
    const cookieConsentConfig = site?.cookie_consent || { enabled: true };

    const [visible, setVisible] = useState(false);
    const [showDetails, setShowDetails] = useState(false);
    const [preferences, setPreferences] = useState({
        necessary: true,
        functional: true,
        analytics: true,
    });

    useEffect(() => {
        if (!cookieConsentConfig.enabled) {
            setVisible(false);
            return;
        }

        const saved = localStorage.getItem(STORAGE_KEY) || localStorage.getItem('cookie_consent_preferences');
        if (!saved) {
            setVisible(true);
        } else {
            try {
                const parsed = JSON.parse(saved);
                setPreferences({
                    necessary: true,
                    functional: Boolean(parsed.functional),
                    analytics: Boolean(parsed.analytics),
                });
            } catch {
                setVisible(true);
            }
        }

        const handleOpenEvent = () => {
            setVisible(true);
            setShowDetails(true);
        };

        window.addEventListener('open-cookie-settings', handleOpenEvent);
        return () => window.removeEventListener('open-cookie-settings', handleOpenEvent);
    }, [cookieConsentConfig.enabled]);

    if (!visible || !cookieConsentConfig.enabled) {
        return null;
    }

    const saveConsent = (choice) => {
        const payload = {
            ...choice,
            necessary: true,
            timestamp: new Date().toISOString(),
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
        // Backwards compatibility for older code
        localStorage.setItem('cookie_consent_preferences', JSON.stringify(payload));
        setVisible(false);
        setShowDetails(false);
    };

    const acceptAll = () => {
        saveConsent({ necessary: true, functional: true, analytics: true });
    };

    const rejectOptional = () => {
        saveConsent({ necessary: true, functional: false, analytics: false });
    };

    const saveCustom = () => {
        saveConsent(preferences);
    };

    return (
        <aside
            aria-label="Persetujuan Privasi & Preferensi"
            className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-xl animate-in fade-in slide-in-from-bottom-5 duration-300 sm:bottom-6 sm:left-6 sm:right-auto"
        >
            <div className="overflow-hidden rounded-3xl border border-slate-200/90 bg-white/95 p-5 shadow-2xl backdrop-blur-md sm:p-6">
                <div className="flex items-start gap-4">
                    <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-blue-50 text-blue-600 shadow-sm">
                        <Cookie className="size-6" />
                    </span>
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                            <h3 className="text-base font-extrabold text-slate-900">
                                {cookieConsentConfig.title || 'Persetujuan Privasi & Cookie'}
                            </h3>
                            <button
                                type="button"
                                onClick={() => setVisible(false)}
                                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 sm:hidden"
                                aria-label="Tutup banner sementara"
                            >
                                <X className="size-4" />
                            </button>
                        </div>
                        <p className="mt-1.5 text-xs leading-5 text-slate-600">
                            {cookieConsentConfig.message ||
                                'Kami menggunakan cookie untuk memastikan sistem dan sesi belanja berfungsi optimal, menjaga keamanan sesi, serta mempersonalisasi preferensi Anda sesuai regulasi perlindungan data.'}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-x-3 text-xs font-semibold text-blue-600">
                            <Link href={route('privacy-policy')} className="underline hover:text-blue-700">
                                Kebijakan Privasi
                            </Link>
                            <span className="text-slate-300">·</span>
                            <Link href={route('cookie-policy')} className="underline hover:text-blue-700">
                                Kebijakan Cookie
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Detailed Categories */}
                {showDetails && (
                    <div className="mt-4 space-y-3 border-t border-slate-100 pt-4 text-xs">
                        <div className="flex items-start justify-between gap-3 rounded-xl bg-slate-50 p-3">
                            <div>
                                <span className="font-extrabold text-slate-900 flex items-center gap-1.5">
                                    <ShieldCheck className="size-3.5 text-emerald-600" />
                                    Cookie Wajib (Esensial)
                                </span>
                                <p className="mt-1 text-slate-500">
                                    Diperlukan untuk otentikasi login, token keamanan CSRF, dan keranjang belanja. Tidak dapat dinonaktifkan.
                                </p>
                            </div>
                            <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800 shrink-0">
                                Selalu Aktif
                            </span>
                        </div>

                        <label className="flex items-start justify-between gap-3 rounded-xl border border-slate-200 p-3 cursor-pointer hover:bg-slate-50">
                            <div>
                                <span className="font-bold text-slate-900">Cookie Fungsionalitas</span>
                                <p className="mt-1 text-slate-500">
                                    Mengingat preferensi bahasa pilihan dan nuansa tema warna situs Anda.
                                </p>
                            </div>
                            <input
                                type="checkbox"
                                checked={preferences.functional}
                                onChange={(e) =>
                                    setPreferences((prev) => ({ ...prev, functional: e.target.checked }))
                                }
                                className="mt-1 size-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                            />
                        </label>

                        <label className="flex items-start justify-between gap-3 rounded-xl border border-slate-200 p-3 cursor-pointer hover:bg-slate-50">
                            <div>
                                <span className="font-bold text-slate-900">Cookie Analitik & Kinerja</span>
                                <p className="mt-1 text-slate-500">
                                    Membantu kami memahami interaksi navigasi untuk optimalisasi kecepatan toko.
                                </p>
                            </div>
                            <input
                                type="checkbox"
                                checked={preferences.analytics}
                                onChange={(e) =>
                                    setPreferences((prev) => ({ ...prev, analytics: e.target.checked }))
                                }
                                className="mt-1 size-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                            />
                        </label>
                    </div>
                )}

                {/* Action Buttons */}
                <div className="mt-4 flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-slate-100">
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowDetails(!showDetails)}
                        className="text-xs font-semibold text-slate-600 hover:text-slate-900"
                    >
                        <Settings2 className="size-3.5 mr-1.5" />
                        {showDetails ? 'Sembunyikan Opsi' : 'Atur Preferensi'}
                    </Button>

                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={rejectOptional}
                        className="rounded-xl text-xs font-bold"
                    >
                        Hanya Cookie Wajib
                    </Button>

                    {showDetails ? (
                        <Button
                            type="button"
                            size="sm"
                            onClick={saveCustom}
                            className="rounded-xl bg-blue-600 text-xs font-bold text-white hover:bg-blue-700"
                        >
                            Simpan Pilihan
                        </Button>
                    ) : (
                        <Button
                            type="button"
                            size="sm"
                            onClick={acceptAll}
                            className="rounded-xl bg-blue-600 text-xs font-bold text-white hover:bg-blue-700"
                        >
                            Terima Semua
                        </Button>
                    )}
                </div>
            </div>
        </aside>
    );
}
