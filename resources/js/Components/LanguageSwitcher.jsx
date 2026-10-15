import { router, usePage } from '@inertiajs/react';
import { ChevronDown, Globe2 } from 'lucide-react';
import { useState } from 'react';

export default function LanguageSwitcher({ compact = false, dark = false, className = '' }) {
    const { locale = 'id', supportedLocales = [] } = usePage().props;
    const [processing, setProcessing] = useState(false);

    const changeLocale = (event) => {
        const value = event.target.value;
        if (value === locale) return;

        router.post(route('locale.update'), { locale: value }, {
            preserveScroll: true,
            preserveState: true,
            onStart: () => setProcessing(true),
            onFinish: () => setProcessing(false),
        });
    };

    return (
        <label className={`relative inline-flex h-10 items-center rounded-xl border transition-colors ${dark ? 'border-white/15 bg-white/[.06] text-slate-200 hover:bg-white/10' : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'} ${className}`}>
            <Globe2 className={`pointer-events-none ml-2.5 size-4 shrink-0 ${dark ? 'text-slate-400' : 'text-slate-400'}`} />
            <span className="sr-only">Bahasa</span>
            <select
                value={locale}
                onChange={changeLocale}
                disabled={processing}
                aria-label="Pilih bahasa"
                className={`h-full flex-1 cursor-pointer appearance-none border-0 bg-transparent py-0 pl-1.5 pr-7 text-xs font-extrabold uppercase outline-none focus:ring-0 ${dark ? 'text-slate-200' : 'text-slate-700'} disabled:opacity-60`}
            >
                {supportedLocales.map((option) => (
                    <option key={option.value} value={option.value} className="text-slate-900" data-i18n-ignore>
                        {compact ? option.short_label : option.label}
                    </option>
                ))}
            </select>
            <ChevronDown className={`pointer-events-none absolute right-2.5 top-1/2 size-3.5 -translate-y-1/2 stroke-[2.25] ${dark ? 'text-slate-300' : 'text-slate-400'}`} />
        </label>
    );
}
