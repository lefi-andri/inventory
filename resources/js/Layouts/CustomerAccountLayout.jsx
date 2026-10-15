import BrandLogo from '@/Components/BrandLogo';
import FloatingChatWidget from '@/Components/FloatingChatWidget';
import LanguageSwitcher from '@/Components/LanguageSwitcher';
import ProfileCompletionNotice from '@/Components/ProfileCompletionNotice';
import { Link, router, usePage } from '@inertiajs/react';
import { LogOut, MessageCircle, ReceiptText, Store, UserRound } from 'lucide-react';

const navigation = [
    { label: 'Toko', route: 'storefront', icon: Store },
    { label: 'Pesanan', route: 'customer.orders.index', icon: ReceiptText },
    { label: 'Chat', route: 'customer.chat.index', icon: MessageCircle },
    { label: 'Profil', route: 'profile.edit', icon: UserRound },
];

export default function CustomerAccountLayout({ title, description, children }) {
    const { auth, flash, site } = usePage().props;

    return (
        <div className="min-h-screen bg-[#f7f8fb] text-slate-950">
            <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
                <div className="mx-auto flex h-20 max-w-6xl items-center gap-3 px-4 sm:px-6 lg:px-8">
                    <Link href={route('storefront')} className="flex items-center gap-3">
                        <BrandLogo />
                        <span className="hidden max-w-40 truncate text-xl font-black tracking-tight min-[380px]:inline">{site.brand_name}</span>
                    </Link>

                    <nav className="ml-auto flex items-center gap-1 sm:gap-2">
                        {navigation.map((item) => {
                            const Icon = item.icon;
                            const active = route().current(item.route);

                            return <Link key={item.route} href={route(item.route)} className={`flex h-10 items-center gap-2 rounded-xl px-3 text-sm font-bold transition ${active ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950'}`}>
                                <Icon className="size-4" />
                                <span className="hidden sm:inline">{item.label}</span>
                            </Link>;
                        })}
                        <LanguageSwitcher compact />
                        <button type="button" onClick={() => router.post(route('logout'))} className="flex h-10 items-center gap-2 rounded-xl px-3 text-sm font-bold text-slate-500 hover:bg-red-50 hover:text-red-600">
                            <LogOut className="size-4" />
                            <span className="hidden md:inline">Keluar</span>
                        </button>
                    </nav>
                </div>
            </header>

            <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
                <div className="flex flex-col gap-4 border-b border-slate-200 pb-7 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <p className="text-xs font-black uppercase tracking-[.2em] text-blue-600">Akun pelanggan</p>
                        <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">{title}</h1>
                        {description && <p className="mt-2 max-w-2xl text-slate-500">{description}</p>}
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm">
                        <p className="font-extrabold text-slate-900">{auth.user.name}</p>
                        <p className="text-slate-500">{auth.user.email}</p>
                    </div>
                </div>

                {flash?.success && <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">{flash.success}</div>}
                {flash?.error && <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800">{flash.error}</div>}
                <ProfileCompletionNotice className="mt-6" />

                <div className="mt-7">{children}</div>
            </main>
            <FloatingChatWidget />
        </div>
    );
}
