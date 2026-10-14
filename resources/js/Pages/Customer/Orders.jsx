import BrandLogo from '@/Components/BrandLogo';
import FloatingChatWidget from '@/Components/FloatingChatWidget';
import ProductDetailDialog from '@/Components/ProductDetailDialog';
import ProfileCompletionNotice from '@/Components/ProfileCompletionNotice';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/Components/ui/alert-dialog';
import { Badge } from '@/Components/ui/badge';
import { Button } from '@/Components/ui/button';
import { currency, shortDate, statusLabel } from '@/lib/format';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { ArrowLeft, CheckCircle2, ChevronDown, MessageCircle, Package, ReceiptText, ShoppingBag, Truck, UserRound } from 'lucide-react';
import { useState } from 'react';

const statusTone = (status) => ({
    paid: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    completed: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    pending: 'border-amber-200 bg-amber-50 text-amber-700',
    new: 'border-violet-200 bg-violet-50 text-violet-700',
    processing: 'border-blue-200 bg-blue-50 text-blue-700',
    shipped: 'border-cyan-200 bg-cyan-50 text-cyan-700',
    cancelled: 'border-red-200 bg-red-50 text-red-700',
    failed: 'border-red-200 bg-red-50 text-red-700',
    refunded: 'border-slate-200 bg-slate-50 text-slate-600',
}[status] || '');

export default function CustomerOrders({ orders }) {
    const { auth, errors, flash, site } = usePage().props;
    const [expanded, setExpanded] = useState(orders[0]?.id || null);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [confirmingOrder, setConfirmingOrder] = useState(null);
    const [confirming, setConfirming] = useState(false);
    const totalItems = orders.reduce(
        (total, order) => total + order.items.reduce((sum, item) => sum + item.quantity, 0),
        0,
    );
    const totalPaid = orders
        .filter((order) => order.payment_status === 'paid' && order.status !== 'cancelled')
        .reduce((total, order) => total + order.total, 0);

    const confirmReceived = (event) => {
        event.preventDefault();
        if (!confirmingOrder) return;

        router.patch(route('customer.orders.received', confirmingOrder.id), {}, {
            preserveScroll: true,
            onStart: () => setConfirming(true),
            onSuccess: () => setConfirmingOrder(null),
            onFinish: () => setConfirming(false),
        });
    };

    return (
        <div className="min-h-screen bg-[#f7f8fb] text-slate-950">
            <Head title="Pesanan Saya" />

            <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
                <div className="mx-auto flex h-20 max-w-6xl items-center gap-3 px-4 sm:px-6 lg:px-8">
                    <Link href={route('storefront')} className="flex items-center gap-3">
                        <BrandLogo />
                        <span className="max-w-40 truncate text-xl font-black tracking-tight">{site.brand_name}</span>
                    </Link>
                    <div className="ml-auto flex items-center gap-2">
                        <Link href={route('customer.chat.index')} className="flex h-10 items-center gap-2 rounded-xl px-3 text-sm font-bold text-slate-600 hover:bg-blue-50 hover:text-blue-700"><MessageCircle className="size-4" /><span className="hidden sm:inline">Chat</span></Link>
                        <Link href={route('profile.edit')} className="flex h-10 items-center gap-2 rounded-xl px-3 text-sm font-bold text-slate-600 hover:bg-blue-50 hover:text-blue-700"><UserRound className="size-4" /><span className="hidden sm:inline">Profil</span></Link>
                        <button type="button" onClick={() => router.post(route('logout'))} className="rounded-xl px-3 py-2 text-sm font-bold text-slate-500 hover:bg-slate-100">Keluar</button>
                    </div>
                </div>
            </header>

            {flash?.success && <div className="fixed left-1/2 top-24 z-40 flex w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 items-center gap-3 rounded-2xl border border-emerald-200 bg-white p-4 shadow-2xl"><CheckCircle2 className="size-5 shrink-0 text-emerald-600" /><p className="flex-1 text-sm font-bold text-emerald-800">{flash.success}</p></div>}

            <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
                <ProfileCompletionNotice className="mb-6" />
                <Link href={route('storefront')} className="inline-flex items-center gap-2 text-sm font-bold text-blue-600 hover:text-blue-700"><ArrowLeft className="size-4" /> Kembali ke toko</Link>
                <div className="mt-6"><p className="text-xs font-black uppercase tracking-[.2em] text-blue-600">Akun pelanggan</p><h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">Pesanan Saya</h1><p className="mt-2 text-slate-500">Lihat barang yang pernah dibeli dan perkembangan setiap pesanan.</p></div>

                <section className="mt-7 grid gap-4 sm:grid-cols-3">
                    <Summary label="Total pesanan" value={orders.length} icon={ReceiptText} />
                    <Summary label="Barang dibeli" value={`${totalItems} unit`} icon={Package} />
                    <Summary label="Total transaksi aktif" value={currency(totalPaid)} icon={ShoppingBag} />
                </section>

                <section className="mt-7 space-y-4">
                    {orders.map((order) => {
                        const isExpanded = expanded === order.id;
                        const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);

                        return <article key={order.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                            <button type="button" onClick={() => setExpanded(isExpanded ? null : order.id)} className="flex w-full items-center gap-4 p-5 text-left sm:p-6">
                                <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-600"><ReceiptText className="size-5" /></span>
                                <span className="min-w-0 flex-1"><span className="block font-extrabold">{order.order_number}</span><span className="mt-1 block text-xs text-slate-500">{shortDate(order.created_at)} · {itemCount} barang</span></span>
                                <span className="hidden flex-wrap justify-end gap-1.5 sm:flex"><Badge variant="outline" className={statusTone(order.status)}>{statusLabel[order.status]}</Badge><Badge variant="outline" className={statusTone(order.payment_status)}>{statusLabel[order.payment_status]}</Badge></span>
                                <span className="text-right"><span className="block text-sm font-black">{currency(order.total)}</span><ChevronDown className={`ml-auto mt-1 size-4 text-slate-400 transition ${isExpanded ? 'rotate-180' : ''}`} /></span>
                            </button>

                            {isExpanded && <div className="border-t border-slate-100 px-5 py-5 sm:px-6">
                                <div className="mb-4 flex flex-wrap gap-1.5 sm:hidden"><Badge variant="outline" className={statusTone(order.status)}>{statusLabel[order.status]}</Badge><Badge variant="outline" className={statusTone(order.payment_status)}>{statusLabel[order.payment_status]}</Badge></div>
                                <div className="space-y-3">{order.items.map((item) => <button key={item.id} type="button" disabled={!item.product} onClick={() => item.product && setSelectedProduct(item.product)} className={`flex w-full items-center gap-3 rounded-xl border border-slate-100 p-3 text-left ${item.product ? 'transition hover:border-blue-200 hover:bg-blue-50/40' : 'cursor-default'}`}>
                                    {item.product?.image ? <img src={item.product.image} alt="" className="size-14 rounded-xl object-cover" /> : <span className="grid size-14 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-400"><Package className="size-5" /></span>}
                                    <span className="min-w-0 flex-1"><span className="block truncate text-sm font-bold">{item.product_name}</span><span className="mt-1 block text-xs text-slate-500">{item.sku} · {item.quantity} × {currency(item.price)}</span>{item.product && <span className="mt-1 block text-xs font-bold text-blue-600">Lihat detail produk</span>}</span>
                                    <span className="text-sm font-black">{currency(item.subtotal)}</span>
                                </button>)}</div>
                                <div className="mt-5 grid gap-4 rounded-xl bg-slate-50 p-4 text-sm md:grid-cols-[1fr_auto]">
                                    <div><p className="text-xs font-bold uppercase tracking-wider text-slate-500">Dikirim ke</p><p className="mt-1 font-semibold text-slate-800">{order.shipping_address}</p>{order.notes && <p className="mt-2 text-slate-500">Catatan: {order.notes}</p>}</div>
                                    <div className="min-w-52 space-y-1.5"><TotalRow label="Subtotal" value={order.subtotal} />{order.discount_amount > 0 && <div className="flex justify-between gap-6 font-semibold text-emerald-700"><span>Diskon {order.promotion_code}</span><span>-{currency(order.discount_amount)}</span></div>}<TotalRow label="Pengiriman" value={order.shipping_cost} /><div className="flex justify-between gap-6 border-t border-slate-200 pt-2 font-black"><span>Total</span><span>{currency(order.total)}</span></div></div>
                                </div>

                                {order.status === 'shipped' && <div className="mt-4 flex flex-col gap-4 rounded-xl border border-cyan-200 bg-cyan-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                                    <div className="flex items-start gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white text-cyan-700 shadow-sm"><Truck className="size-5" /></span><div><p className="font-extrabold text-cyan-950">Pesanan sedang dikirim</p><p className="mt-1 text-sm text-cyan-800">Konfirmasikan setelah seluruh barang sudah Anda terima.</p></div></div>
                                    <Button type="button" onClick={() => setConfirmingOrder(order)} className="bg-cyan-700 hover:bg-cyan-800"><CheckCircle2 /> Konfirmasi diterima</Button>
                                </div>}

                                {order.status === 'completed' && order.received_at && <p className="mt-4 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800"><CheckCircle2 className="size-4" /> Barang diterima pada {shortDate(order.received_at)}</p>}
                            </div>}
                        </article>;
                    })}

                    {!orders.length && <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center"><span className="mx-auto grid size-16 place-items-center rounded-2xl bg-slate-100 text-slate-400"><ShoppingBag className="size-7" /></span><h2 className="mt-4 text-lg font-extrabold">Belum ada pesanan</h2><p className="mt-1 text-sm text-slate-500">Barang yang Anda beli akan tampil di halaman ini.</p><Link href={route('storefront')} className="mt-5 inline-flex rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-700">Mulai belanja</Link></div>}
                </section>
            </main>

            <AlertDialog open={!!confirmingOrder} onOpenChange={(open) => !open && !confirming && setConfirmingOrder(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Konfirmasi barang sudah diterima?</AlertDialogTitle>
                        <AlertDialogDescription>Pesanan {confirmingOrder?.order_number} akan ditandai selesai. Pastikan seluruh barang sudah diterima dalam kondisi sesuai.</AlertDialogDescription>
                    </AlertDialogHeader>
                    {errors?.order && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">{errors.order}</p>}
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={confirming}>Belum</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmReceived} disabled={confirming} className="bg-emerald-600 hover:bg-emerald-700">{confirming ? 'Memproses...' : 'Ya, barang diterima'}</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <ProductDetailDialog product={selectedProduct} onClose={() => setSelectedProduct(null)} />
            <FloatingChatWidget />
        </div>
    );
}

function Summary({ label, value, icon: Icon }) {
    return <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><span className="grid size-11 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-600"><Icon className="size-5" /></span><div className="min-w-0"><p className="text-sm font-semibold text-slate-500">{label}</p><p className="mt-1 truncate text-xl font-black">{value}</p></div></div>;
}

function TotalRow({ label, value }) {
    return <div className="flex justify-between gap-6 text-slate-600"><span>{label}</span><span>{currency(value)}</span></div>;
}
