import { Button } from '@/Components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/Components/ui/dialog';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/Components/ui/sheet';
import { currency } from '@/lib/format';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { ArrowRight, CheckCircle2, Minus, Package, Plus, Search, ShieldCheck, ShoppingBag, Trash2, Truck, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

const CART_STORAGE_KEY = 'stokara.cart.v1';

export default function Storefront({ products, categories }) {
    const { auth, flash } = usePage().props;
    const [cart, setCart] = useState(() => loadCart(products));
    const [category, setCategory] = useState('all');
    const [query, setQuery] = useState('');
    const [checkout, setCheckout] = useState(false);
    const [cartOpen, setCartOpen] = useState(false);
    const form = useForm({ customer_phone: '', shipping_address: '', notes: '', items: [] });
    const filtered = useMemo(() => products.filter((product) => (category === 'all' || product.category === category) && product.name.toLowerCase().includes(query.toLowerCase())), [products, category, query]);
    const count = cart.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const shipping = subtotal >= 500000 ? 0 : 25000;

    useEffect(() => {
        if (cart.length === 0) {
            window.localStorage.removeItem(CART_STORAGE_KEY);
            return;
        }

        window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(
            cart.map(({ id, quantity }) => ({ id, quantity })),
        ));
    }, [cart]);

    const add = (product) => setCart((current) => {
        const existing = current.find((item) => item.id === product.id);
        if (existing) return current.map((item) => item.id === product.id ? { ...item, quantity: Math.min(item.quantity + 1, item.stock) } : item);
        return [...current, { ...product, quantity: 1 }];
    });
    const changeQuantity = (id, delta) => setCart((current) => current.map((item) => item.id === id ? { ...item, quantity: Math.max(1, Math.min(item.quantity + delta, item.stock)) } : item));
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
            },
        });
    };

    return (
        <div className="min-h-screen bg-[#f7f8fb] text-slate-950">
            <Head title="Stokara Shop" />
            <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl"><div className="mx-auto flex h-20 max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8"><Link href="/" className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-blue-600 text-white"><ShoppingBag className="size-5" /></span><span className="text-xl font-black tracking-tight">stokara</span></Link><nav className="ml-8 hidden items-center gap-7 text-sm font-bold text-slate-600 md:flex"><a href="#produk" className="hover:text-blue-600">Produk</a><a href="#benefit" className="hover:text-blue-600">Layanan</a></nav><div className="ml-auto flex items-center gap-2">{auth.user ? <>{auth.permissions.includes('dashboard.view') ? <Link href={route('dashboard')} className="hidden rounded-xl px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-100 sm:block">Dashboard</Link> : <span className="hidden text-sm font-bold text-slate-700 sm:block">Halo, {auth.user.name.split(' ')[0]}</span>}<button onClick={() => router.post(route('logout'))} className="hidden rounded-xl px-3 py-2 text-sm font-bold text-slate-500 hover:bg-slate-100 sm:block">Keluar</button></> : <><Link href={route('login')} className="hidden rounded-xl px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-100 sm:block">Masuk</Link><Link href={route('register')} className="hidden rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-100 sm:block">Daftar</Link></>}<Sheet open={cartOpen} onOpenChange={setCartOpen}><SheetTrigger asChild><Button className="relative h-10 rounded-xl bg-slate-950 px-4 hover:bg-slate-800"><ShoppingBag /> Keranjang {count > 0 && <span className="ml-1 grid size-5 place-items-center rounded-full bg-lime-300 text-[11px] font-black text-slate-950">{count}</span>}</Button></SheetTrigger><SheetContent className="flex w-full flex-col sm:max-w-md"><SheetHeader><SheetTitle>Keranjang belanja</SheetTitle><SheetDescription>{count ? `${count} item siap dipesan` : 'Belum ada produk dipilih'}</SheetDescription></SheetHeader><div className="flex-1 space-y-3 overflow-y-auto px-4">{cart.map((item) => <div key={item.id} className="flex gap-3 rounded-xl border border-slate-100 p-3">{item.image ? <img src={item.image} alt="" className="size-16 rounded-lg object-cover" /> : <span className="grid size-16 shrink-0 place-items-center rounded-lg bg-slate-100"><Package className="size-5 text-slate-400" /></span>}<div className="min-w-0 flex-1"><p className="truncate text-sm font-bold">{item.name}</p><p className="mt-1 text-sm font-black text-blue-600">{currency(item.price)}</p><div className="mt-2 flex items-center gap-2"><button onClick={() => changeQuantity(item.id, -1)} className="grid size-7 place-items-center rounded-lg border border-slate-200"><Minus className="size-3" /></button><span className="min-w-5 text-center text-sm font-bold">{item.quantity}</span><button onClick={() => changeQuantity(item.id, 1)} className="grid size-7 place-items-center rounded-lg border border-slate-200"><Plus className="size-3" /></button><button onClick={() => setCart((current) => current.filter((p) => p.id !== item.id))} className="ml-auto text-red-500" aria-label="Hapus"><Trash2 className="size-4" /></button></div></div></div>)}{!cart.length && <div className="grid place-items-center py-20 text-center"><span className="grid size-16 place-items-center rounded-2xl bg-slate-100 text-slate-400"><ShoppingBag /></span><p className="mt-4 font-bold">Keranjang masih kosong</p><p className="mt-1 text-sm text-slate-500">Pilih produk favorit Anda.</p></div>}</div>{cart.length > 0 && <div className="border-t border-slate-100 p-4"><div className="flex justify-between text-sm text-slate-600"><span>Subtotal</span><span className="font-bold text-slate-950">{currency(subtotal)}</span></div><p className="mt-2 text-xs text-slate-500">Gratis ongkir untuk belanja minimal Rp500.000.</p>{auth.user ? <Button onClick={() => setCheckout(true)} className="mt-4 h-11 w-full rounded-xl bg-blue-600 hover:bg-blue-700">Lanjut checkout <ArrowRight /></Button> : <Button asChild className="mt-4 h-11 w-full rounded-xl bg-blue-600 hover:bg-blue-700"><Link href={route('login')}>Masuk untuk checkout <ArrowRight /></Link></Button>} {!auth.user && <p className="mt-3 text-center text-xs font-medium text-slate-500">Belum punya akun? <Link href={route('register')} className="font-bold text-blue-600">Daftar sekarang</Link></p>}</div>}</SheetContent></Sheet></div></div></header>

            {flash?.success && <div className="fixed left-1/2 top-24 z-40 flex w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 items-center gap-3 rounded-2xl border border-emerald-200 bg-white p-4 shadow-2xl"><CheckCircle2 className="size-5 shrink-0 text-emerald-600" /><p className="flex-1 text-sm font-bold text-emerald-800">{flash.success}</p></div>}
            {flash?.error && <div className="fixed left-1/2 top-24 z-40 flex max-w-lg -translate-x-1/2 items-center gap-3 rounded-2xl border border-red-200 bg-white p-4 shadow-2xl"><X className="size-5 text-red-600" /><p className="text-sm font-bold text-red-800">{flash.error}</p></div>}

            <main>
                <section className="relative overflow-hidden border-b border-slate-200 bg-[#0b1220]"><div className="absolute -right-20 -top-24 size-[420px] rounded-full bg-blue-600/25 blur-3xl" /><div className="absolute bottom-0 left-1/3 size-64 rounded-full bg-lime-300/10 blur-3xl" /><div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 md:py-24 lg:grid-cols-[1.1fr_.9fr] lg:px-8"><div><span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[.06] px-3 py-1.5 text-xs font-bold text-lime-300"><ShieldCheck className="size-4" /> Pilihan rumah & gaya hidup</span><h1 className="mt-6 max-w-2xl text-4xl font-black leading-[1.06] tracking-[-.04em] text-white sm:text-6xl">Barang tepat untuk hari yang lebih tertata.</h1><p className="mt-5 max-w-xl text-base leading-7 text-slate-300 sm:text-lg">Koleksi fungsional, stok siap kirim, dan proses belanja yang ringkas.</p><a href="#produk" className="mt-8 inline-flex h-12 items-center gap-2 rounded-xl bg-lime-300 px-5 text-sm font-black text-slate-950 transition hover:bg-lime-200">Jelajahi produk <ArrowRight className="size-4" /></a></div><div id="benefit" className="grid content-end gap-3 sm:grid-cols-2 lg:pt-16"><Benefit icon={Truck} title="Pengiriman cepat" text="Diproses langsung dari stok tersedia." /><Benefit icon={ShieldCheck} title="Belanja aman" text="Ringkasan total transparan sebelum checkout." /></div></div></section>

                <section id="produk" className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20"><div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between"><div><p className="text-xs font-black uppercase tracking-[.2em] text-blue-600">Katalog</p><h2 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">Temukan pilihanmu</h2></div><div className="relative w-full md:w-72"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Cari produk..." className="h-11 w-full rounded-xl border-slate-200 bg-white pl-10 pr-4 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500" /></div></div><div className="mt-7 flex gap-2 overflow-x-auto pb-2"><button onClick={() => setCategory('all')} className={`shrink-0 rounded-full px-4 py-2 text-sm font-bold ${category === 'all' ? 'bg-slate-950 text-white' : 'border border-slate-200 bg-white text-slate-600'}`}>Semua</button>{categories.map((item) => <button key={item.id} onClick={() => setCategory(item.name)} className={`shrink-0 rounded-full px-4 py-2 text-sm font-bold ${category === item.name ? 'bg-slate-950 text-white' : 'border border-slate-200 bg-white text-slate-600'}`}>{item.name}</button>)}</div>
                    <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{filtered.map((product) => <article key={product.id} className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl"><div className="relative aspect-square overflow-hidden bg-gradient-to-br from-slate-100 to-slate-50">{product.image ? <img src={product.image} alt={product.name} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" /> : <div className="grid h-full place-items-center"><span className="grid size-20 place-items-center rounded-3xl bg-white text-blue-600 shadow-sm"><Package className="size-9" /></span></div>}<span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-xs font-bold text-slate-700 shadow-sm backdrop-blur">{product.category}</span></div><div className="p-4"><p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{product.sku}</p><h3 className="mt-1 text-lg font-extrabold leading-snug">{product.name}</h3><p className="mt-2 line-clamp-2 min-h-10 text-sm leading-5 text-slate-500">{product.description}</p><div className="mt-5 flex items-end justify-between gap-3"><div><p className="text-lg font-black text-blue-600">{currency(product.price)}</p><p className="text-xs text-slate-500">Stok {product.stock}</p></div><Button onClick={() => add(product)} size="icon" className="rounded-xl bg-slate-950 hover:bg-blue-600" aria-label={`Tambah ${product.name}`}><Plus /></Button></div></div></article>)}{!filtered.length && <div className="col-span-full py-20 text-center"><Package className="mx-auto size-10 text-slate-300" /><p className="mt-3 font-bold text-slate-600">Produk tidak ditemukan.</p></div>}</div>
                </section>
            </main>
            <footer className="border-t border-slate-200 bg-white"><div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-8 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8"><p className="font-bold text-slate-900">stokara</p><p>Produk fungsional untuk keseharian modern.</p></div></footer>

            <Dialog open={checkout} onOpenChange={setCheckout}><DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-xl"><DialogHeader><DialogTitle>Informasi pengiriman</DialogTitle><DialogDescription>Pesanan dibuat atas nama akun Anda dan langsung mengurangi stok.</DialogDescription></DialogHeader><form onSubmit={submit} className="space-y-4">{auth.user && <div className="rounded-xl border border-blue-100 bg-blue-50 p-4"><p className="text-xs font-bold uppercase tracking-wider text-blue-600">Akun pemesan</p><p className="mt-1 text-sm font-extrabold text-slate-900">{auth.user.name}</p><p className="text-sm text-slate-600">{auth.user.email}</p></div>}<Field label="Nomor telepon" error={form.errors.customer_phone}><input value={form.data.customer_phone} onChange={(e) => form.setData('customer_phone', e.target.value)} className="form-input" /></Field><Field label="Alamat lengkap" error={form.errors.shipping_address}><textarea value={form.data.shipping_address} onChange={(e) => form.setData('shipping_address', e.target.value)} rows="3" className="form-input resize-none" required /></Field><Field label="Catatan (opsional)" error={form.errors.notes}><textarea value={form.data.notes} onChange={(e) => form.setData('notes', e.target.value)} rows="2" className="form-input resize-none" /></Field>{form.errors.items && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">{form.errors.items}</p>}<div className="rounded-xl bg-slate-50 p-4 text-sm"><div className="flex justify-between text-slate-600"><span>Subtotal</span><span>{currency(subtotal)}</span></div><div className="mt-2 flex justify-between text-slate-600"><span>Pengiriman</span><span>{shipping ? currency(shipping) : 'Gratis'}</span></div><div className="mt-3 flex justify-between border-t border-slate-200 pt-3 text-base font-black"><span>Total</span><span>{currency(subtotal + shipping)}</span></div></div><DialogFooter><Button type="button" variant="outline" onClick={() => setCheckout(false)}>Kembali</Button><Button disabled={form.processing} className="bg-blue-600 hover:bg-blue-700">{form.processing ? 'Memproses...' : 'Buat pesanan'}</Button></DialogFooter></form></DialogContent></Dialog>
        </div>
    );
}

function Benefit({ icon: Icon, title, text }) { return <div className="rounded-2xl border border-white/10 bg-white/[.06] p-5 backdrop-blur"><span className="grid size-10 place-items-center rounded-xl bg-lime-300 text-slate-950"><Icon className="size-5" /></span><p className="mt-4 font-extrabold text-white">{title}</p><p className="mt-1 text-sm leading-6 text-slate-400">{text}</p></div>; }
function Field({ label, error, children }) { return <label className="block"><span className="mb-1.5 block text-sm font-bold text-slate-700">{label}</span>{children}{error && <span className="mt-1 block text-xs text-red-600">{error}</span>}</label>; }

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
