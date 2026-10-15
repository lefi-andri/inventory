import { Badge } from '@/Components/ui/badge';
import { Button } from '@/Components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/Components/ui/dialog';
import SearchSelect from '@/Components/SearchSelect';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { currency, shortDate, statusLabel } from '@/lib/format';
import { Head, useForm, usePage } from '@inertiajs/react';
import { Eye, PackageCheck, ReceiptText } from 'lucide-react';
import { useState } from 'react';

const statusTone = (status) => ({ paid: 'border-emerald-200 bg-emerald-50 text-emerald-700', completed: 'border-emerald-200 bg-emerald-50 text-emerald-700', pending: 'border-amber-200 bg-amber-50 text-amber-700', new: 'border-violet-200 bg-violet-50 text-violet-700', processing: 'border-blue-200 bg-blue-50 text-blue-700', shipped: 'border-cyan-200 bg-cyan-50 text-cyan-700', cancelled: 'border-red-200 bg-red-50 text-red-700', failed: 'border-red-200 bg-red-50 text-red-700', refunded: 'border-slate-200 bg-slate-50 text-slate-600' }[status] || '');
const orderTransitions = { new: ['new', 'processing', 'cancelled'], processing: ['processing', 'shipped', 'cancelled'], shipped: ['shipped', 'completed'], completed: ['completed'], cancelled: ['cancelled'] };
const paymentOptions = ['pending', 'paid', 'failed', 'refunded'].map((status) => ({ value: status, label: statusLabel[status] }));

export default function OrdersIndex({ orders }) {
    const canUpdate = usePage().props.auth.permissions.includes('orders.update');
    const [selected, setSelected] = useState(null);
    const form = useForm({ status: 'new', payment_status: 'pending' });
    const openOrder = (order) => { setSelected(order); form.setData({ status: order.status, payment_status: order.payment_status }); form.clearErrors(); };
    const submit = (event) => { event.preventDefault(); form.patch(route('orders.update', selected.id), { onSuccess: () => setSelected(null) }); };
    const awaiting = orders.filter((order) => ['new', 'processing'].includes(order.status)).length;
    const paid = orders.filter((order) => order.payment_status === 'paid').reduce((sum, order) => sum + order.total, 0);

    return <AuthenticatedLayout title="Pesanan" eyebrow="Order management">
        <Head title="Pesanan" />
        <section className="mb-6 grid gap-4 sm:grid-cols-3"><Summary label="Semua pesanan" value={orders.length} icon={ReceiptText} /><Summary label="Perlu diproses" value={awaiting} icon={PackageCheck} /><Summary label="Nilai transaksi lunas" value={currency(paid)} icon={ReceiptText} /></section>
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-5 py-4 sm:px-6"><h2 className="text-lg font-extrabold">Daftar pesanan</h2><p className="mt-1 text-sm text-slate-500">Pantau pembayaran dan progres pengiriman.</p></div>
            <div className="overflow-x-auto"><table className="w-full min-w-[900px] text-left"><thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500"><tr><th className="px-6 py-3 font-bold">Nomor</th><th className="px-4 py-3 font-bold">Pelanggan</th><th className="px-4 py-3 font-bold">Item</th><th className="px-4 py-3 font-bold">Status</th><th className="px-4 py-3 text-right font-bold">Total</th><th className="px-6 py-3 text-right font-bold">Detail</th></tr></thead><tbody className="divide-y divide-slate-100">{orders.map((order) => <tr key={order.id} className="hover:bg-slate-50/70"><td className="px-6 py-4"><p className="text-sm font-extrabold">{order.order_number}</p><p className="mt-1 text-xs text-slate-500">{shortDate(order.created_at)}</p></td><td className="px-4 py-4"><p className="text-sm font-bold">{order.customer_name}</p><p className="text-xs text-slate-500">{order.customer_email}</p></td><td className="px-4 py-4 text-sm font-semibold">{order.items.reduce((sum, item) => sum + item.quantity, 0)} item</td><td className="px-4 py-4"><div className="flex flex-wrap gap-1.5"><Badge variant="outline" className={statusTone(order.status)}>{statusLabel[order.status]}</Badge><Badge variant="outline" className={statusTone(order.payment_status)}>{statusLabel[order.payment_status]}</Badge></div></td><td className="px-4 py-4 text-right text-sm font-black">{currency(order.total)}</td><td className="px-6 py-4 text-right"><Button variant="outline" size="icon-sm" onClick={() => openOrder(order)} aria-label="Detail pesanan"><Eye /></Button></td></tr>)}{!orders.length && <tr><td colSpan="6" className="px-6 py-16 text-center text-sm text-slate-500">Belum ada pesanan masuk.</td></tr>}</tbody></table></div>
        </div>

        <Dialog open={!!selected} onOpenChange={(value) => !value && setSelected(null)}>
            {selected && <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
                <DialogHeader><DialogTitle>{selected.order_number}</DialogTitle><DialogDescription>Dibuat {shortDate(selected.created_at)} oleh {selected.customer_name}</DialogDescription></DialogHeader>
                <div className="grid gap-4 rounded-xl bg-slate-50 p-4 text-sm sm:grid-cols-2">
                    <div><p className="text-xs font-bold uppercase tracking-wider text-slate-500">Kontak</p><p className="mt-1 font-semibold">{selected.customer_email}</p><p className="text-slate-600">{selected.customer_phone || 'Tanpa nomor telepon'}</p></div>
                    <div><p className="text-xs font-bold uppercase tracking-wider text-slate-500">Alamat pengiriman</p><p className="mt-1 font-semibold">{selected.shipping_address}</p><p className="mt-1 text-xs text-slate-500">{selected.shipping_method || 'Pengiriman reguler'}</p></div>
                </div>
                <PaymentInformation order={selected} />
                <div className="space-y-2">{selected.items.map((item) => <div key={item.id} className="flex items-center justify-between rounded-xl border border-slate-100 p-3"><div><p className="text-sm font-bold">{item.product_name}</p><p className="text-xs text-slate-500">{item.sku} · {item.quantity} × {currency(item.price)}</p></div><p className="text-sm font-black">{currency(item.subtotal)}</p></div>)}</div>
                <div className="ml-auto w-full max-w-xs space-y-2 border-t border-slate-100 pt-4 text-sm"><div className="flex justify-between text-slate-600"><span>Subtotal</span><span>{currency(selected.subtotal)}</span></div>{selected.discount_amount > 0 && <div className="flex justify-between font-semibold text-emerald-700"><span>Diskon {selected.promotion_code}</span><span>-{currency(selected.discount_amount)}</span></div>}<div className="flex justify-between text-slate-600"><span>{selected.shipping_method || 'Pengiriman'}</span><span>{selected.shipping_cost ? currency(selected.shipping_cost) : 'Gratis'}</span></div><div className="flex justify-between text-base font-black"><span>Total</span><span>{currency(selected.total)}</span></div></div>
                {canUpdate ? <form onSubmit={submit} className="space-y-4 border-t border-slate-100 pt-4"><div className="grid gap-4 sm:grid-cols-2"><label><span className="mb-1.5 block text-sm font-bold">Status pesanan</span><SearchSelect options={(orderTransitions[selected.status] || [selected.status]).map((status) => ({ value: status, label: statusLabel[status] || status }))} value={form.data.status} onChange={(value) => form.setData('status', value)} placeholder="Cari status..." aria-label="Status pesanan" />{form.errors.status && <span className="mt-1 block text-xs text-red-600">{form.errors.status}</span>}</label><label><span className="mb-1.5 block text-sm font-bold">Status pembayaran</span><SearchSelect options={paymentOptions} value={form.data.payment_status} onChange={(value) => form.setData('payment_status', value)} placeholder="Cari status pembayaran..." aria-label="Status pembayaran" />{form.errors.payment_status && <span className="mt-1 block text-xs text-red-600">{form.errors.payment_status}</span>}</label></div>{form.data.status === 'cancelled' && selected.status !== 'cancelled' && <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">Membatalkan pesanan akan mengembalikan seluruh item ke stok.</p>}<DialogFooter><Button type="button" variant="outline" onClick={() => setSelected(null)}>Tutup</Button><Button disabled={form.processing} className="bg-blue-600 hover:bg-blue-700">Perbarui status</Button></DialogFooter></form> : <DialogFooter><Button variant="outline" onClick={() => setSelected(null)}>Tutup</Button></DialogFooter>}
            </DialogContent>}
        </Dialog>
    </AuthenticatedLayout>;
}

function PaymentInformation({ order }) {
    const details = order.payment_details || {};
    return <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4 text-sm">
        <p className="text-xs font-bold uppercase tracking-wider text-emerald-700">Metode pembayaran</p>
        <p className="mt-1 font-extrabold text-emerald-950">{details.label || (order.payment_method === 'cod' ? 'Bayar di tempat (COD)' : order.payment_method === 'bank_transfer' ? 'Transfer bank' : 'Belum tercatat')}</p>
        {details.bank_name && <p className="mt-2 text-emerald-900">{details.bank_name} · {details.account_number} · a.n. {details.account_name}</p>}
        {details.instructions && <p className="mt-2 whitespace-pre-line text-xs leading-5 text-emerald-800">{details.instructions}</p>}
    </div>;
}

function Summary({ label, value, icon: Icon }) { return <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><span className="grid size-11 place-items-center rounded-xl bg-blue-50 text-blue-600"><Icon className="size-5" /></span><div><p className="text-sm font-semibold text-slate-500">{label}</p><p className="mt-1 text-2xl font-black tracking-tight">{value}</p></div></div>; }
