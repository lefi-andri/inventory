import { Button } from '@/Components/ui/button';
import BrandLogo from '@/Components/BrandLogo';
import SitePreferencesBanner from '@/Components/SitePreferencesBanner';
import FloatingChatWidget from '@/Components/FloatingChatWidget';
import LanguageSwitcher from '@/Components/LanguageSwitcher';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/Components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/Components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/Components/ui/sheet';
import ProductDetailDialog from '@/Components/ProductDetailDialog';
import ProfileCompletionNotice from '@/Components/ProfileCompletionNotice';
import { currency } from '@/lib/format';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import axios from 'axios';
import { ArrowRight, Banknote, CheckCircle2, ChevronDown, ChevronLeft, ChevronRight, CreditCard, LayoutDashboard, LogIn, LogOut, Menu, MessageCircle, Minus, Package, Plus, ReceiptText, Search, ShieldCheck, ShoppingBag, Trash2, Truck, UserPlus, UserRound, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

const CART_STORAGE_KEY = 'stokara.cart.v1';
const DEFAULT_HERO = {
    id: 'default',
    eyebrow: 'Pilihan rumah & gaya hidup',
    title: 'Barang tepat untuk hari yang lebih tertata.',
    description: 'Koleksi fungsional, stok siap kirim, dan proses belanja yang ringkas.',
    cta_label: 'Jelajahi produk',
    cta_url: '#produk',
    image: null,
};

export default function Storefront({ products, categories, shippingSettings, paymentMethods = [], heroBanners = [] }) {
    const { auth, flash, site } = usePage().props;
    const [cart, setCart] = useState(() => loadCart(products));
    const [category, setCategory] = useState('all');
    const [query, setQuery] = useState('');
    const [checkout, setCheckout] = useState(false);
    const [cartOpen, setCartOpen] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [promotionCode, setPromotionCode] = useState('');
    const [promotion, setPromotion] = useState(null);
    const [promotionError, setPromotionError] = useState('');
    const [checkingPromotion, setCheckingPromotion] = useState(false);
    const [activeHeroIndex, setActiveHeroIndex] = useState(0);
    const form = useForm({
        customer_phone: auth.user?.phone ?? '',
        shipping_address: auth.user?.shipping_address ?? '',
        notes: auth.user?.checkout_notes ?? '',
        promotion_code: '',
        payment_method: paymentMethods[0]?.value ?? '',
        items: [],
    });
    const filtered = useMemo(() => products.filter((product) => (category === 'all' || product.category === category) && product.name.toLowerCase().includes(query.toLowerCase())), [products, category, query]);
    const count = cart.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const configuredShipping = shippingSettings.free_shipping_threshold !== null && subtotal >= shippingSettings.free_shipping_threshold ? 0 : shippingSettings.shipping_cost;
    const shipping = promotion?.shipping_cost ?? configuredShipping;
    const discount = promotion?.discount_amount ?? 0;
    const total = Math.max(0, subtotal - discount) + shipping;
    const selectedPayment = paymentMethods.find((method) => method.value === form.data.payment_method);
    const heroes = heroBanners.length ? heroBanners : [DEFAULT_HERO];
    const activeHero = heroes[activeHeroIndex] ?? heroes[0];

    useEffect(() => {
        if (cart.length === 0) {
            window.localStorage.removeItem(CART_STORAGE_KEY);
            return;
        }

        window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(
            cart.map(({ id, quantity }) => ({ id, quantity })),
        ));
    }, [cart]);

    useEffect(() => {
        setPromotion(null);
        setPromotionError('');
        form.setData('promotion_code', '');
    }, [subtotal]);

    useEffect(() => {
        setActiveHeroIndex(0);
        if (heroes.length < 2) return undefined;

        const interval = window.setInterval(() => {
            setActiveHeroIndex((current) => (current + 1) % heroes.length);
        }, 6500);

        return () => window.clearInterval(interval);
    }, [heroes.length]);

    useEffect(() => {
        setCart((currentCart) => currentCart.map((item) => {
            const fresh = products.find((p) => p.id === item.id);
            return fresh ? { ...item, name: fresh.name, description: fresh.description } : item;
        }));
        if (selectedProduct) {
            const freshSelected = products.find((p) => p.id === selectedProduct.id);
            if (freshSelected) {
                setSelectedProduct(freshSelected);
            }
        }
    }, [products]);

    const add = (product) => setCart((current) => {
        const existing = current.find((item) => item.id === product.id);
        if (existing) return current.map((item) => item.id === product.id ? { ...item, quantity: Math.min(item.quantity + 1, item.stock) } : item);
        return [...current, { ...product, quantity: 1 }];
    });
    const changeQuantity = (id, delta) => setCart((current) => current.map((item) => item.id === id ? { ...item, quantity: Math.max(1, Math.min(item.quantity + delta, item.stock)) } : item));
    const applyPromotion = async () => {
        if (!promotionCode.trim()) return;
        setCheckingPromotion(true);
        setPromotionError('');
        try {
            const response = await axios.post(route('checkout.promotion.validate'), {
                promotion_code: promotionCode.trim(),
                items: cart.map((item) => ({ product_id: item.id, quantity: item.quantity })),
            });
            setPromotion(response.data);
            setPromotionCode(response.data.promotion.code);
            form.setData('promotion_code', response.data.promotion.code);
        } catch (error) {
            setPromotion(null);
            form.setData('promotion_code', '');
            setPromotionError(error.response?.data?.errors?.promotion_code?.[0] || 'Kode promo tidak dapat digunakan.');
        } finally {
            setCheckingPromotion(false);
        }
    };
    const submit = (e) => {
        e.preventDefault();
        form.transform((data) => ({
            ...data,
            items: cart.map((item) => ({ product_id: item.id, quantity: item.quantity })),
        }));
        form.post(route('checkout.store'), {
            onSuccess: () => {
                setCheckout(false);
                setCartOpen(false);
                setCart([]);
                form.reset();
                setPromotion(null);
                setPromotionCode('');
            },
        });
    };

    return (
        <div className="min-h-screen bg-[#f7f8fb] text-slate-950">
            <Head title={`${site.brand_name} Shop`} />
            <StorefrontNavbar
                auth={auth}
                count={count}
                mobileMenuOpen={mobileMenuOpen}
                setMobileMenuOpen={setMobileMenuOpen}
                cartOpen={cartOpen}
                setCartOpen={setCartOpen}
                cart={cart}
                setCart={setCart}
                changeQuantity={changeQuantity}
                subtotal={subtotal}
                shippingSettings={shippingSettings}
                onCheckout={() => setCheckout(true)}
                site={site}
            />

            {flash?.success && <div className="fixed left-1/2 top-24 z-40 flex w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 items-center gap-3 rounded-2xl border border-emerald-200 bg-white p-4 shadow-2xl"><CheckCircle2 className="size-5 shrink-0 text-emerald-600" /><p className="flex-1 text-sm font-bold text-emerald-800">{flash.success}</p></div>}
            {flash?.error && <div className="fixed left-1/2 top-24 z-40 flex max-w-lg -translate-x-1/2 items-center gap-3 rounded-2xl border border-red-200 bg-white p-4 shadow-2xl"><X className="size-5 text-red-600" /><p className="text-sm font-bold text-red-800">{flash.error}</p></div>}

            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <ProfileCompletionNotice className="my-5" />
            </div>

            <main>
                <HeroCarousel heroes={heroes} activeIndex={activeHeroIndex} activeHero={activeHero} onChange={setActiveHeroIndex} />

                <section id="produk" className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20"><div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between"><div><p className="text-xs font-black uppercase tracking-[.2em] text-blue-600">Katalog</p><h2 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">Temukan pilihanmu</h2></div><div className="relative w-full md:w-72"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Cari produk..." className="h-11 w-full rounded-xl border-slate-200 bg-white pl-10 pr-4 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500" /></div></div><div className="mt-7 flex gap-2 overflow-x-auto pb-2"><button onClick={() => setCategory('all')} className={`shrink-0 rounded-full px-4 py-2 text-sm font-bold ${category === 'all' ? 'bg-slate-950 text-white' : 'border border-slate-200 bg-white text-slate-600'}`}>Semua</button>{categories.map((item) => <button key={item.id} onClick={() => setCategory(item.name)} className={`shrink-0 rounded-full px-4 py-2 text-sm font-bold ${category === item.name ? 'bg-slate-950 text-white' : 'border border-slate-200 bg-white text-slate-600'}`}>{item.name}</button>)}</div>
                    <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{filtered.map((product) => <article key={product.id} role="button" tabIndex="0" onClick={() => setSelectedProduct(product)} onKeyDown={(event) => event.key === 'Enter' && setSelectedProduct(product)} className="group cursor-pointer overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-blue-500"><div className="relative aspect-square overflow-hidden bg-gradient-to-br from-slate-100 to-slate-50">{product.image ? <img src={product.image} alt={product.name} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" /> : <div className="grid h-full place-items-center"><span className="grid size-20 place-items-center rounded-3xl bg-white text-blue-600 shadow-sm"><Package className="size-9" /></span></div>}<span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-xs font-bold text-slate-700 shadow-sm backdrop-blur">{product.category}</span></div><div className="p-4"><p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{product.sku}</p><h3 className="mt-1 text-lg font-extrabold leading-snug">{product.name}</h3><p className="mt-2 line-clamp-2 min-h-10 text-sm leading-5 text-slate-500">{product.description}</p><p className="mt-2 text-xs font-bold text-blue-600">Klik untuk melihat detail</p><div className="mt-4 flex items-end justify-between gap-3"><div><p className="text-lg font-black text-blue-600">{currency(product.price)}</p><p className="text-xs text-slate-500">Stok {product.stock}</p></div><Button onClick={(event) => { event.stopPropagation(); add(product); }} size="icon" className="rounded-xl bg-slate-950 hover:bg-blue-600" aria-label={`Tambah ${product.name}`}><Plus /></Button></div></div></article>)}{!filtered.length && <div className="col-span-full py-20 text-center"><Package className="mx-auto size-10 text-slate-300" /><p className="mt-3 font-bold text-slate-600">Produk tidak ditemukan.</p></div>}</div>
                </section>
            </main>
            <StorefrontFooter site={site} />

            <Dialog open={checkout} onOpenChange={setCheckout}>
                <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-xl">
                    <DialogHeader>
                        <DialogTitle>Pengiriman & pembayaran</DialogTitle>
                        <DialogDescription>Periksa alamat, ongkir, metode pembayaran, dan total sebelum membuat pesanan.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={submit} className="space-y-4">
                        {auth.user && <div className="rounded-xl border border-blue-100 bg-blue-50 p-4"><p className="text-xs font-bold uppercase tracking-wider text-blue-600">Akun pemesan</p><p className="mt-1 text-sm font-extrabold text-slate-900">{auth.user.name}</p><p className="text-sm text-slate-600">{auth.user.email}</p></div>}
                        <Field label="Nomor telepon" error={form.errors.customer_phone}><input type="tel" value={form.data.customer_phone} onChange={(e) => form.setData('customer_phone', e.target.value)} className="app-field" required /></Field>
                        <Field label="Alamat lengkap" error={form.errors.shipping_address}><textarea value={form.data.shipping_address} onChange={(e) => form.setData('shipping_address', e.target.value)} rows="3" className="app-field resize-none" required /></Field>
                        <Field label="Catatan (opsional)" error={form.errors.notes}><textarea value={form.data.notes} onChange={(e) => form.setData('notes', e.target.value)} rows="2" className="app-field resize-none" /></Field>

                        <div>
                            <span className="mb-2 block text-sm font-bold text-slate-700">Metode pembayaran</span>
                            <div className="grid gap-2">
                                {paymentMethods.map((method) => <label key={method.value} className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition ${form.data.payment_method === method.value ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-blue-200'}`}>
                                    <input type="radio" name="payment_method" value={method.value} checked={form.data.payment_method === method.value} onChange={(event) => form.setData('payment_method', event.target.value)} className="mt-1 border-slate-300 text-blue-600 focus:ring-blue-500" />
                                    <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-white text-blue-600 shadow-sm">{method.value === 'cod' ? <Banknote className="size-4" /> : <CreditCard className="size-4" />}</span>
                                    <span><span className="block text-sm font-extrabold text-slate-900">{method.label}</span><span className="mt-0.5 block text-xs text-slate-500">{method.description}</span></span>
                                </label>)}
                            </div>
                            {!paymentMethods.length && <p className="rounded-xl bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">Belum ada metode pembayaran yang tersedia. Silakan hubungi admin.</p>}
                            {form.errors.payment_method && <p className="mt-1 text-xs font-semibold text-red-600">{form.errors.payment_method}</p>}
                            {selectedPayment?.details && Object.keys(selectedPayment.details).length > 0 && <PaymentDetails details={selectedPayment.details} />}
                        </div>

                        <div><span className="mb-1.5 block text-sm font-bold text-slate-700">Kupon atau voucher</span><div className="flex gap-2"><input value={promotionCode} onChange={(e) => { setPromotionCode(e.target.value.toUpperCase()); setPromotion(null); form.setData('promotion_code', ''); }} className="app-field uppercase" placeholder="Masukkan kode promo" /><Button type="button" variant="outline" onClick={applyPromotion} disabled={checkingPromotion || !promotionCode.trim()}>{checkingPromotion ? 'Memeriksa...' : 'Gunakan'}</Button></div>{promotionError && <p className="mt-1 text-xs font-semibold text-red-600">{promotionError}</p>}{form.errors.promotion_code && <p className="mt-1 text-xs font-semibold text-red-600">{form.errors.promotion_code}</p>}{promotion && <p className="mt-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700">Kode {promotion.promotion.code} berhasil digunakan.</p>}</div>
                        {form.errors.items && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">{form.errors.items}</p>}
                        <div className="rounded-xl bg-slate-50 p-4 text-sm"><div className="flex justify-between text-slate-600"><span>Subtotal</span><span>{currency(subtotal)}</span></div>{discount > 0 && <div className="mt-2 flex justify-between font-semibold text-emerald-700"><span>Diskon {promotion?.promotion?.code}</span><span>-{currency(discount)}</span></div>}<div className="mt-2 flex justify-between text-slate-600"><span>{shippingSettings.shipping_label || 'Pengiriman'}</span><span>{shipping ? currency(shipping) : 'Gratis'}</span></div><div className="mt-3 flex justify-between border-t border-slate-200 pt-3 text-base font-black"><span>Total</span><span>{currency(total)}</span></div></div>
                        <DialogFooter><Button type="button" variant="outline" onClick={() => setCheckout(false)}>Kembali</Button><Button disabled={form.processing || !paymentMethods.length} className="bg-blue-600 hover:bg-blue-700">{form.processing ? 'Memproses...' : 'Buat pesanan'}</Button></DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
            <ProductDetailDialog product={selectedProduct} onClose={() => setSelectedProduct(null)} onAdd={add} />
            <FloatingChatWidget />
            <SitePreferencesBanner />
        </div>
    );
}

function StorefrontNavbar({ auth, count, mobileMenuOpen, setMobileMenuOpen, cartOpen, setCartOpen, cart, setCart, changeQuantity, subtotal, shippingSettings, onCheckout, site }) {
    const isCustomer = auth.roles.includes('customer');
    const canOpenDashboard = auth.permissions.includes('dashboard.view');
    const closeMobileMenu = () => setMobileMenuOpen(false);

    return (
        <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/95 shadow-[0_1px_0_rgba(15,23,42,.03)] backdrop-blur-xl">
            <div className="mx-auto flex h-16 max-w-7xl items-center gap-2 px-3 sm:h-[72px] sm:gap-3 sm:px-6 lg:px-8">
                <Link href={route('storefront')} className="flex shrink-0 items-center gap-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                    <BrandLogo />
                    <span className="hidden max-w-40 truncate text-xl font-black tracking-tight text-slate-950 min-[360px]:block">{site.brand_name}</span>
                </Link>

                <nav className="ml-8 hidden items-center gap-1 lg:flex" aria-label="Navigasi utama">
                    {site.navbar_links.filter((link) => link.is_active).map((link, index) => <a key={`${link.url}-${index}`} href={link.url} className="rounded-xl px-4 py-2.5 text-sm font-bold text-slate-600 transition hover:bg-slate-100 hover:text-blue-700">{link.label}</a>)}
                </nav>

                <div className="ml-auto flex min-w-0 items-center gap-1.5 sm:gap-2">
                    <LanguageSwitcher compact className="hidden min-[430px]:inline-flex" />
                    {auth.user ? (
                        <>
                            {isCustomer && <div className="hidden items-center gap-1 md:flex">
                                <Link href={route('customer.chat.index')} className="grid size-10 place-items-center rounded-xl text-slate-600 transition hover:bg-blue-50 hover:text-blue-700" aria-label="Chat dengan admin" title="Chat dengan admin"><MessageCircle className="size-[18px]" /></Link>
                                <Link href={route('customer.orders.index')} className="flex h-10 items-center gap-2 rounded-xl px-3 text-sm font-bold text-slate-700 transition hover:bg-blue-50 hover:text-blue-700"><ReceiptText className="size-[18px]" /><span className="hidden xl:inline">Pesanan saya</span></Link>
                            </div>}
                            {canOpenDashboard && <Link href={route('dashboard')} className="hidden h-10 items-center gap-2 rounded-xl px-3 text-sm font-bold text-slate-700 transition hover:bg-slate-100 lg:flex"><LayoutDashboard className="size-[18px]" /> Dashboard</Link>}
                            <DesktopAccountMenu user={auth.user} isCustomer={isCustomer} canOpenDashboard={canOpenDashboard} />
                        </>
                    ) : (
                        <div className="hidden items-center gap-2 lg:flex">
                            <Link href={route('login')} className="rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-100">Masuk</Link>
                            <Button asChild className="h-10 rounded-xl bg-blue-600 px-4 hover:bg-blue-700"><Link href={route('register')}>Daftar</Link></Button>
                        </div>
                    )}

                    <CartSheet
                        open={cartOpen}
                        onOpenChange={setCartOpen}
                        count={count}
                        cart={cart}
                        setCart={setCart}
                        changeQuantity={changeQuantity}
                        subtotal={subtotal}
                        shippingSettings={shippingSettings}
                        auth={auth}
                        onCheckout={onCheckout}
                    />

                    <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                        <SheetTrigger asChild>
                            <button type="button" className="grid size-10 place-items-center rounded-xl border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50 lg:hidden" aria-label="Buka menu"><Menu className="size-5" /></button>
                        </SheetTrigger>
                        <SheetContent className="flex w-[88vw] max-w-sm flex-col p-0">
                            <SheetHeader className="border-b border-slate-100 px-5 py-5 text-left">
                                <SheetTitle className="flex items-center gap-3"><BrandLogo /> Menu {site.brand_name}</SheetTitle>
                                <SheetDescription>Navigasi belanja dan akun Anda.</SheetDescription>
                            </SheetHeader>

                            <div className="flex-1 overflow-y-auto px-4 py-5">
                                <div className="mb-5"><LanguageSwitcher className="w-full justify-center" /></div>
                                {auth.user && <div className="mb-5 flex items-center gap-3 rounded-2xl bg-slate-950 p-4 text-white">
                                    <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-blue-600 text-sm font-black">{auth.user.name.slice(0, 2).toUpperCase()}</span>
                                    <div className="min-w-0"><p className="truncate text-sm font-extrabold">{auth.user.name}</p><p className="truncate text-xs text-slate-400">{auth.user.email}</p></div>
                                </div>}

                                <p className="mb-2 px-3 text-[11px] font-black uppercase tracking-[.16em] text-slate-400">Belanja</p>
                                <nav className="space-y-1" aria-label="Navigasi mobile">
                                    {site.navbar_links.filter((link) => link.is_active).map((link, index) => <a key={`${link.url}-${index}`} href={link.url} onClick={closeMobileMenu} className="flex min-h-12 items-center gap-3 rounded-xl px-3 text-sm font-bold text-slate-700 hover:bg-slate-100"><ArrowRight className="size-5 text-blue-600" /> {link.label}</a>)}
                                </nav>

                                {auth.user ? <>
                                    <p className="mb-2 mt-6 px-3 text-[11px] font-black uppercase tracking-[.16em] text-slate-400">Akun saya</p>
                                    <nav className="space-y-1">
                                        {isCustomer && <>
                                            <Link href={route('customer.orders.index')} onClick={closeMobileMenu} className="flex min-h-12 items-center gap-3 rounded-xl px-3 text-sm font-bold text-slate-700 hover:bg-slate-100"><ReceiptText className="size-5 text-blue-600" /> Pesanan saya</Link>
                                            <Link href={route('customer.chat.index')} onClick={closeMobileMenu} className="flex min-h-12 items-center gap-3 rounded-xl px-3 text-sm font-bold text-slate-700 hover:bg-slate-100"><MessageCircle className="size-5 text-blue-600" /> Chat dengan admin</Link>
                                        </>}
                                        <Link href={route('profile.edit')} onClick={closeMobileMenu} className="flex min-h-12 items-center gap-3 rounded-xl px-3 text-sm font-bold text-slate-700 hover:bg-slate-100"><UserRound className="size-5 text-blue-600" /> Profil & alamat</Link>
                                        {canOpenDashboard && <Link href={route('dashboard')} onClick={closeMobileMenu} className="flex min-h-12 items-center gap-3 rounded-xl px-3 text-sm font-bold text-slate-700 hover:bg-slate-100"><LayoutDashboard className="size-5 text-blue-600" /> Dashboard</Link>}
                                    </nav>
                                </> : <div className="mt-7 grid grid-cols-2 gap-3">
                                    <Button asChild variant="outline" className="h-11 rounded-xl"><Link href={route('login')} onClick={closeMobileMenu}><LogIn /> Masuk</Link></Button>
                                    <Button asChild className="h-11 rounded-xl bg-blue-600 hover:bg-blue-700"><Link href={route('register')} onClick={closeMobileMenu}><UserPlus /> Daftar</Link></Button>
                                </div>}
                            </div>

                            {auth.user && <div className="border-t border-slate-100 p-4"><button type="button" onClick={() => router.post(route('logout'))} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-red-50 text-sm font-bold text-red-700 hover:bg-red-100"><LogOut className="size-4" /> Keluar dari akun</button></div>}
                        </SheetContent>
                    </Sheet>
                </div>
            </div>
        </header>
    );
}

function DesktopAccountMenu({ user, isCustomer, canOpenDashboard }) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button type="button" className="hidden h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white py-1 pl-1 pr-2 text-left shadow-sm transition hover:border-slate-300 sm:flex">
                    <span className="grid size-8 place-items-center rounded-lg bg-blue-600 text-xs font-black text-white">{user.name.slice(0, 2).toUpperCase()}</span>
                    <span className="hidden max-w-24 truncate text-sm font-bold text-slate-800 xl:block">{user.name.split(' ')[0]}</span>
                    <ChevronDown className="size-4 text-slate-400" />
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 rounded-2xl p-2 shadow-xl">
                <DropdownMenuLabel className="px-3 py-2">
                    <span className="block truncate text-sm font-extrabold text-slate-900">{user.name}</span>
                    <span className="mt-0.5 block truncate text-xs font-medium text-slate-500">{user.email}</span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {isCustomer && <>
                    <DropdownMenuItem asChild className="rounded-xl"><Link href={route('customer.orders.index')}><ReceiptText /> Pesanan saya</Link></DropdownMenuItem>
                    <DropdownMenuItem asChild className="rounded-xl"><Link href={route('customer.chat.index')}><MessageCircle /> Chat dengan admin</Link></DropdownMenuItem>
                </>}
                <DropdownMenuItem asChild className="rounded-xl"><Link href={route('profile.edit')}><UserRound /> Profil & alamat</Link></DropdownMenuItem>
                {canOpenDashboard && <DropdownMenuItem asChild className="rounded-xl"><Link href={route('dashboard')}><LayoutDashboard /> Dashboard</Link></DropdownMenuItem>}
                <DropdownMenuSeparator />
                <DropdownMenuItem className="rounded-xl text-red-600 focus:bg-red-50 focus:text-red-700" onSelect={() => router.post(route('logout'))}><LogOut /> Keluar</DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

function CartSheet({ open, onOpenChange, count, cart, setCart, changeQuantity, subtotal, shippingSettings, auth, onCheckout }) {
    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetTrigger asChild>
                <Button className="relative h-10 rounded-xl bg-slate-950 px-3 hover:bg-slate-800 xl:px-4">
                    <ShoppingBag /> <span className="hidden xl:inline">Keranjang</span>
                    {count > 0 && <span className="absolute -right-1.5 -top-1.5 grid size-5 place-items-center rounded-full bg-blue-600 text-[10px] font-black text-white ring-2 ring-white xl:static xl:ml-1 xl:ring-0">{count}</span>}
                </Button>
            </SheetTrigger>
            <SheetContent className="flex w-full flex-col sm:max-w-md">
                <SheetHeader><SheetTitle>Keranjang belanja</SheetTitle><SheetDescription>{count ? `${count} item siap dipesan` : 'Belum ada produk dipilih'}</SheetDescription></SheetHeader>
                <div className="flex-1 space-y-3 overflow-y-auto px-4">
                    {cart.map((item) => <div key={item.id} className="flex gap-3 rounded-xl border border-slate-100 p-3">
                        {item.image ? <img src={item.image} alt={item.name} className="size-16 rounded-lg object-cover" /> : <span className="grid size-16 shrink-0 place-items-center rounded-lg bg-slate-100"><Package className="size-5 text-slate-400" /></span>}
                        <div className="min-w-0 flex-1"><p className="truncate text-sm font-bold">{item.name}</p><p className="mt-1 text-sm font-black text-blue-600">{currency(item.price)}</p><div className="mt-2 flex items-center gap-2"><button type="button" onClick={() => changeQuantity(item.id, -1)} className="grid size-8 place-items-center rounded-lg border border-slate-200 hover:bg-slate-50" aria-label={`Kurangi ${item.name}`}><Minus className="size-3" /></button><span className="min-w-5 text-center text-sm font-bold">{item.quantity}</span><button type="button" onClick={() => changeQuantity(item.id, 1)} className="grid size-8 place-items-center rounded-lg border border-slate-200 hover:bg-slate-50" aria-label={`Tambah ${item.name}`}><Plus className="size-3" /></button><button type="button" onClick={() => setCart((current) => current.filter((product) => product.id !== item.id))} className="ml-auto grid size-8 place-items-center rounded-lg text-red-500 hover:bg-red-50" aria-label={`Hapus ${item.name}`}><Trash2 className="size-4" /></button></div></div>
                    </div>)}
                    {!cart.length && <div className="grid place-items-center py-20 text-center"><span className="grid size-16 place-items-center rounded-2xl bg-slate-100 text-slate-400"><ShoppingBag /></span><p className="mt-4 font-bold">Keranjang masih kosong</p><p className="mt-1 text-sm text-slate-500">Pilih produk favorit Anda.</p></div>}
                </div>
                {cart.length > 0 && <div className="border-t border-slate-100 p-4"><div className="flex justify-between text-sm text-slate-600"><span>Subtotal</span><span className="font-bold text-slate-950">{currency(subtotal)}</span></div><p className="mt-2 text-xs text-slate-500">{shippingSettings.free_shipping_threshold === null ? `Ongkir ${currency(shippingSettings.shipping_cost)} per pesanan.` : `Gratis ongkir untuk belanja minimal ${currency(shippingSettings.free_shipping_threshold)}.`}</p>{auth.user ? <Button onClick={() => { onOpenChange(false); onCheckout(); }} className="mt-4 h-11 w-full rounded-xl bg-blue-600 hover:bg-blue-700">Lanjut checkout <ArrowRight /></Button> : <Button asChild className="mt-4 h-11 w-full rounded-xl bg-blue-600 hover:bg-blue-700"><Link href={route('login')}>Masuk untuk checkout <ArrowRight /></Link></Button>}{!auth.user && <p className="mt-3 text-center text-xs font-medium text-slate-500">Belum punya akun? <Link href={route('register')} className="font-bold text-blue-600">Daftar sekarang</Link></p>}</div>}
            </SheetContent>
        </Sheet>
    );
}

function StorefrontFooter({ site }) {
    const links = site.footer_links.filter((link) => link.is_active);

    return (
        <footer className="border-t border-slate-800 bg-slate-950 text-slate-300">
            <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-[1fr_auto] md:items-start lg:px-8">
                <div className="max-w-xl">
                    <Link href={route('storefront')} className="inline-flex items-center gap-3"><BrandLogo /><span className="text-xl font-black tracking-tight text-white">{site.brand_name}</span></Link>
                    {site.footer_description && <p className="mt-4 text-sm leading-6 text-slate-400">{site.footer_description}</p>}
                </div>
                {links.length > 0 && <nav className="flex flex-wrap gap-x-6 gap-y-3 md:max-w-md md:justify-end" aria-label="Navigasi footer">{links.map((link, index) => <a key={`${link.url}-${index}`} href={link.url} className="text-sm font-bold text-slate-300 transition hover:text-blue-400">{link.label}</a>)}</nav>}
            </div>
            <div className="border-t border-white/10">
                <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-5 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
                    <div>{site.footer_copyright || `© ${new Date().getFullYear()} ${site.brand_name}.`}</div>
                    <div className="flex flex-wrap items-center gap-4 font-semibold text-slate-400">
                        <Link href={route('privacy-policy')} className="transition hover:text-white">Kebijakan Privasi</Link>
                        <span>·</span>
                        <Link href={route('cookie-policy')} className="transition hover:text-white">Kebijakan Cookie</Link>
                        <span>·</span>
                        <button type="button" onClick={() => window.dispatchEvent(new CustomEvent('open-cookie-settings'))} className="transition hover:text-white">Pengaturan Cookie</button>
                    </div>
                </div>
            </div>
        </footer>
    );
}

function HeroCarousel({ heroes, activeIndex, activeHero, onChange }) {
    const previous = () => onChange((activeIndex - 1 + heroes.length) % heroes.length);
    const next = () => onChange((activeIndex + 1) % heroes.length);

    return (
        <section className="relative min-h-[520px] overflow-hidden border-b border-slate-200 bg-[#0b1220]">
            {activeHero.image && <img key={activeHero.id} src={activeHero.image} alt="" className="absolute inset-0 h-full w-full animate-in fade-in duration-700 object-cover" />}
            <div className={`absolute inset-0 ${activeHero.image ? 'bg-gradient-to-r from-slate-950 via-slate-950/75 to-slate-950/20' : 'bg-[#0b1220]'}`} />
            <div className="absolute -right-20 -top-24 size-[420px] rounded-full bg-blue-600/25 blur-3xl" />
            <div className="absolute bottom-0 left-1/3 size-64 rounded-full bg-blue-500/15 blur-3xl" />

            <div className="relative mx-auto grid min-h-[520px] max-w-7xl gap-10 px-4 py-16 sm:px-6 md:py-24 lg:grid-cols-[1.1fr_.9fr] lg:px-8">
                <div key={`content-${activeHero.id}`} className="animate-in fade-in slide-in-from-bottom-3 duration-500">
                    {activeHero.eyebrow && <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-slate-950/30 px-3 py-1.5 text-xs font-bold text-blue-300 backdrop-blur"><ShieldCheck className="size-4" /> {activeHero.eyebrow}</span>}
                    <h1 className="mt-6 max-w-2xl text-4xl font-black leading-[1.06] tracking-[-.04em] text-white drop-shadow-sm sm:text-6xl">{activeHero.title}</h1>
                    {activeHero.description && <p className="mt-5 max-w-xl text-base leading-7 text-slate-200 sm:text-lg">{activeHero.description}</p>}
                    {activeHero.cta_label && activeHero.cta_url && <a href={activeHero.cta_url} className="mt-8 inline-flex h-12 items-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-black text-white shadow-lg shadow-blue-600/25 transition hover:bg-blue-700">{activeHero.cta_label} <ArrowRight className="size-4" /></a>}
                </div>
                <div id="benefit" className="grid content-end gap-3 sm:grid-cols-2 lg:pt-16">
                    <Benefit icon={Truck} title="Pengiriman cepat" text="Diproses langsung dari stok tersedia." />
                    <Benefit icon={ShieldCheck} title="Belanja aman" text="Ringkasan total transparan sebelum checkout." />
                </div>
            </div>

            {heroes.length > 1 && <>
                <div className="absolute bottom-6 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full border border-white/10 bg-slate-950/35 px-3 py-2 backdrop-blur">
                    {heroes.map((hero, index) => <button key={hero.id} type="button" onClick={() => onChange(index)} className={`h-2 rounded-full transition-all ${index === activeIndex ? 'w-7 bg-blue-500' : 'w-2 bg-white/50 hover:bg-white'}`} aria-label={`Tampilkan banner ${index + 1}`} />)}
                </div>
                <button type="button" onClick={previous} className="absolute left-3 top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-full border border-white/15 bg-slate-950/35 text-white backdrop-blur transition hover:bg-slate-950/60 sm:left-6" aria-label="Banner sebelumnya"><ChevronLeft /></button>
                <button type="button" onClick={next} className="absolute right-3 top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-full border border-white/15 bg-slate-950/35 text-white backdrop-blur transition hover:bg-slate-950/60 sm:right-6" aria-label="Banner berikutnya"><ChevronRight /></button>
            </>}
        </section>
    );
}

function Benefit({ icon: Icon, title, text }) { return <div className="rounded-2xl border border-white/10 bg-white/[.06] p-5 backdrop-blur"><span className="grid size-10 place-items-center rounded-xl bg-blue-600 text-white shadow-xs"><Icon className="size-5" /></span><p className="mt-4 font-extrabold text-white">{title}</p><p className="mt-1 text-sm leading-6 text-slate-400">{text}</p></div>; }
function Field({ label, error, children }) { return <label className="block"><span className="mb-1.5 block text-sm font-bold text-slate-700">{label}</span>{children}{error && <span className="mt-1 block text-xs text-red-600">{error}</span>}</label>; }

function PaymentDetails({ details }) {
    return <div className="mt-2 rounded-xl border border-blue-100 bg-blue-50 p-3 text-sm text-blue-950">
        {details.bank_name && <p><span className="text-blue-600">Bank:</span> <strong>{details.bank_name}</strong></p>}
        {details.account_number && <p><span className="text-blue-600">Nomor rekening:</span> <strong>{details.account_number}</strong></p>}
        {details.account_name && <p><span className="text-blue-600">Atas nama:</span> <strong>{details.account_name}</strong></p>}
        {details.instructions && <p className="mt-2 whitespace-pre-line text-xs leading-5 text-blue-800">{details.instructions}</p>}
    </div>;
}

function loadCart(products) {
    if (typeof window === 'undefined') return [];

    try {
        const savedItems = JSON.parse(window.localStorage.getItem(CART_STORAGE_KEY) || '[]');
        if (!Array.isArray(savedItems)) return [];

        return savedItems.flatMap((savedItem) => {
            const product = products.find((item) => item.id === Number(savedItem.id));
            if (!product || product.stock < 1) return [];

            return [{
                ...product,
                quantity: Math.max(1, Math.min(Number(savedItem.quantity) || 1, product.stock)),
            }];
        });
    } catch {
        window.localStorage.removeItem(CART_STORAGE_KEY);
        return [];
    }
}
