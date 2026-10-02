import { Link, router, usePage } from '@inertiajs/react';
import {
    Boxes, ChevronDown, ClipboardList, LayoutDashboard, LogOut, Menu,
    PackageSearch, ShoppingBag, Store, UserRoundCog, X,
} from 'lucide-react';
import { useState } from 'react';

const navItems = [
    { label: 'Ringkasan', route: 'dashboard', icon: LayoutDashboard, permission: 'dashboard.view' },
    { label: 'Produk', route: 'products.index', icon: PackageSearch, permission: 'products.view' },
    { label: 'Inventory', route: 'inventory.index', icon: Boxes, permission: 'inventory.view' },
    { label: 'Pesanan', route: 'orders.index', icon: ClipboardList, permission: 'orders.view' },
    { label: 'Tim & Role', route: 'users.index', icon: UserRoundCog, permission: 'users.view' },
];

export default function AuthenticatedLayout({ title, eyebrow, action, children }) {
    const { auth, flash } = usePage().props;
    const [open, setOpen] = useState(false);
    const [userMenu, setUserMenu] = useState(false);
    const allowed = (permission) => auth.permissions.includes(permission);

    const sidebar = (
        <>
            <div className="flex h-20 items-center justify-between px-6">
                <Link href={route('dashboard')} className="flex items-center gap-3">
                    <span className="grid size-10 place-items-center rounded-xl bg-lime-300 text-slate-950 shadow-[0_8px_30px_rgba(190,242,100,.18)]">
                        <ShoppingBag className="size-5" strokeWidth={2.4} />
                    </span>
                    <span>
                        <span className="block text-lg font-extrabold tracking-tight text-white">stokara</span>
                        <span className="block text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">commerce ops</span>
                    </span>
                </Link>
                <button className="text-slate-400 lg:hidden" onClick={() => setOpen(false)} aria-label="Tutup menu"><X /></button>
            </div>

            <nav className="mt-7 flex-1 space-y-1 px-3">
                <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-600">Workspace</p>
                {navItems.filter((item) => allowed(item.permission)).map((item) => {
                    const Icon = item.icon;
                    const active = route().current(item.route);
                    return (
                        <Link key={item.route} href={route(item.route)} onClick={() => setOpen(false)} className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition ${active ? 'bg-white/10 text-white shadow-sm' : 'text-slate-400 hover:bg-white/[.06] hover:text-white'}`}>
                            <Icon className={`size-[18px] ${active ? 'text-lime-300' : ''}`} />
                            {item.label}
                            {active && <span className="ml-auto size-1.5 rounded-full bg-lime-300" />}
                        </Link>
                    );
                })}
            </nav>

            <div className="m-3 rounded-2xl border border-white/10 bg-white/[.045] p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-lime-300">Toko aktif</p>
                <p className="mt-1 text-sm font-semibold text-white">Katalog online tersedia</p>
                <Link href={route('storefront')} className="mt-3 inline-flex items-center gap-2 text-xs font-semibold text-slate-300 hover:text-white">
                    <Store className="size-4" /> Lihat storefront
                </Link>
            </div>
        </>
    );

    return (
        <div className="min-h-screen bg-[#f4f6fa] text-slate-900">
            <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col bg-[#0b1220] lg:flex">{sidebar}</aside>
            {open && <div className="fixed inset-0 z-50 bg-slate-950/45 backdrop-blur-sm lg:hidden" onClick={() => setOpen(false)}><aside className="flex h-full w-72 flex-col bg-[#0b1220]" onClick={(e) => e.stopPropagation()}>{sidebar}</aside></div>}

            <div className="lg:pl-64">
                <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
                    <div className="flex h-20 items-center gap-4 px-4 sm:px-7 lg:px-10">
                        <button onClick={() => setOpen(true)} className="grid size-10 place-items-center rounded-xl border border-slate-200 lg:hidden" aria-label="Buka menu"><Menu className="size-5" /></button>
                        <div className="min-w-0 flex-1">
                            {eyebrow && <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-600">{eyebrow}</p>}
                            <h1 className="truncate text-xl font-extrabold tracking-tight text-slate-950 sm:text-2xl">{title}</h1>
                        </div>
                        {action}
                        <div className="relative">
                            <button onClick={() => setUserMenu(!userMenu)} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-1.5 pr-3 text-left shadow-sm">
                                <span className="grid size-9 place-items-center rounded-lg bg-blue-600 text-sm font-extrabold text-white">{auth.user.name.slice(0, 2).toUpperCase()}</span>
                                <span className="hidden sm:block">
                                    <span className="block max-w-32 truncate text-sm font-bold text-slate-900">{auth.user.name}</span>
                                    <span className="block text-xs capitalize text-slate-500">{auth.roles[0]?.replace('-', ' ')}</span>
                                </span>
                                <ChevronDown className="size-4 text-slate-400" />
                            </button>
                            {userMenu && (
                                <div className="absolute right-0 mt-2 w-48 overflow-hidden rounded-xl border border-slate-200 bg-white p-1 shadow-xl">
                                    <Link href={route('profile.edit')} className="block rounded-lg px-3 py-2 text-sm font-medium hover:bg-slate-100">Profil akun</Link>
                                    <button onClick={() => router.post(route('logout'))} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"><LogOut className="size-4" /> Keluar</button>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                <main className="px-4 py-7 sm:px-7 lg:px-10 lg:py-9">
                    {flash?.success && <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">{flash.success}</div>}
                    {flash?.error && <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800">{flash.error}</div>}
                    {children}
                </main>
            </div>
        </div>
    );
}
