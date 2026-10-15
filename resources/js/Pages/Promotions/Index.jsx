import { Badge } from '@/Components/ui/badge';
import { Button } from '@/Components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/Components/ui/dialog';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { currency, shortDate } from '@/lib/format';
import { Head, router, useForm } from '@inertiajs/react';
import { CreditCard, Pencil, Plus, Settings2, TicketPercent, Trash2, Truck } from 'lucide-react';
import { useState } from 'react';

const emptyPromotion = { kind: 'coupon', code: '', description: '', discount_type: 'fixed', value: '', min_order: 0, max_discount: '', usage_limit: '', starts_at: '', ends_at: '', is_active: true };

export default function PromotionsIndex({ promotions, shippingSettings }) {
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const form = useForm(emptyPromotion);
    const shipping = useForm({
        shipping_label: shippingSettings.shipping_label || 'Pengiriman reguler',
        shipping_cost: Number(shippingSettings.shipping_cost),
        free_shipping_threshold: shippingSettings.free_shipping_threshold === null ? '' : Number(shippingSettings.free_shipping_threshold),
    });
    const payment = useForm({
        bank_transfer_enabled: Boolean(shippingSettings.bank_transfer_enabled),
        bank_name: shippingSettings.bank_name || '',
        bank_account_number: shippingSettings.bank_account_number || '',
        bank_account_name: shippingSettings.bank_account_name || '',
        cod_enabled: Boolean(shippingSettings.cod_enabled),
        payment_instructions: shippingSettings.payment_instructions || '',
    });

    const create = () => { setEditing(null); form.setData(emptyPromotion); form.clearErrors(); setOpen(true); };
    const edit = (promotion) => {
        setEditing(promotion);
        form.setData({
            kind: promotion.kind, code: promotion.code, description: promotion.description || '', discount_type: promotion.discount_type,
            value: Number(promotion.value), min_order: Number(promotion.min_order), max_discount: promotion.max_discount === null ? '' : Number(promotion.max_discount),
            usage_limit: promotion.usage_limit ?? '', starts_at: promotion.starts_at?.slice(0, 16) || '', ends_at: promotion.ends_at?.slice(0, 16) || '', is_active: promotion.is_active,
        });
        form.clearErrors(); setOpen(true);
    };
    const submit = (event) => {
        event.preventDefault();
        const options = { onSuccess: () => setOpen(false), preserveScroll: true };
        editing ? form.patch(route('admin.promotions.update', editing.id), options) : form.post(route('admin.promotions.store'), options);
    };

    return (
        <AuthenticatedLayout title="Promo, Ongkir & Pembayaran" eyebrow="Pengaturan penjualan" action={<Button onClick={create} className="rounded-xl bg-blue-600 hover:bg-blue-700"><Plus /> Tambah promo</Button>}>
            <Head title="Promo, Ongkir & Pembayaran" />

            <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                <div className="flex items-start gap-3"><span className="grid size-11 place-items-center rounded-xl bg-blue-50 text-blue-600"><Truck /></span><div><h2 className="font-extrabold">Ongkos kirim manual</h2><p className="mt-1 text-sm text-slate-500">Nilai ini digunakan otomatis dan dihitung ulang oleh server saat checkout.</p></div></div>
                <form onSubmit={(event) => { event.preventDefault(); shipping.patch(route('admin.shipping-settings.update'), { preserveScroll: true }); }} className="mt-5 grid gap-4 md:grid-cols-3">
                    <Field label="Nama layanan pengiriman" error={shipping.errors.shipping_label}><input value={shipping.data.shipping_label} onChange={(event) => shipping.setData('shipping_label', event.target.value)} className="app-field" placeholder="Pengiriman reguler" required /></Field>
                    <Field label="Biaya ongkir" error={shipping.errors.shipping_cost}><input type="number" min="0" value={shipping.data.shipping_cost} onChange={(event) => shipping.setData('shipping_cost', event.target.value)} className="app-field" required /></Field>
                    <Field label="Gratis ongkir mulai (kosongkan untuk nonaktif)" error={shipping.errors.free_shipping_threshold}><input type="number" min="0" value={shipping.data.free_shipping_threshold} onChange={(event) => shipping.setData('free_shipping_threshold', event.target.value)} className="app-field" /></Field>
                    <div className="md:col-span-3 md:flex md:justify-end"><Button disabled={shipping.processing} className="h-11 rounded-xl bg-slate-900 px-5"><Settings2 /> Simpan ongkir</Button></div>
                </form>
            </section>

            <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                <div className="flex items-start gap-3"><span className="grid size-11 place-items-center rounded-xl bg-emerald-50 text-emerald-600"><CreditCard /></span><div><h2 className="font-extrabold">Informasi pembayaran</h2><p className="mt-1 text-sm text-slate-500">Metode aktif dan detail rekening akan ditampilkan saat checkout dan disalin ke pesanan.</p></div></div>
                <form onSubmit={(event) => { event.preventDefault(); payment.patch(route('admin.payment-settings.update'), { preserveScroll: true }); }} className="mt-5 space-y-4">
                    <div className="grid gap-3 sm:grid-cols-2">
                        <label className="flex items-center gap-3 rounded-xl border border-slate-200 p-4 text-sm font-bold"><input type="checkbox" checked={payment.data.bank_transfer_enabled} onChange={(event) => payment.setData('bank_transfer_enabled', event.target.checked)} className="app-checkbox" /> Aktifkan transfer bank</label>
                        <label className="flex items-center gap-3 rounded-xl border border-slate-200 p-4 text-sm font-bold"><input type="checkbox" checked={payment.data.cod_enabled} onChange={(event) => payment.setData('cod_enabled', event.target.checked)} className="app-checkbox" /> Aktifkan bayar di tempat (COD)</label>
                    </div>
                    {payment.errors.bank_transfer_enabled && <p className="text-xs font-semibold text-red-600">{payment.errors.bank_transfer_enabled}</p>}
                    <div className="grid gap-4 md:grid-cols-3">
                        <Field label="Nama bank" error={payment.errors.bank_name}><input value={payment.data.bank_name} onChange={(event) => payment.setData('bank_name', event.target.value)} className="app-field" placeholder="BCA" disabled={!payment.data.bank_transfer_enabled} /></Field>
                        <Field label="Nomor rekening" error={payment.errors.bank_account_number}><input value={payment.data.bank_account_number} onChange={(event) => payment.setData('bank_account_number', event.target.value)} className="app-field" placeholder="1234567890" disabled={!payment.data.bank_transfer_enabled} /></Field>
                        <Field label="Nama pemilik rekening" error={payment.errors.bank_account_name}><input value={payment.data.bank_account_name} onChange={(event) => payment.setData('bank_account_name', event.target.value)} className="app-field" placeholder="PT Stokara Indonesia" disabled={!payment.data.bank_transfer_enabled} /></Field>
                    </div>
                    <Field label="Instruksi pembayaran (opsional)" error={payment.errors.payment_instructions}><textarea value={payment.data.payment_instructions} onChange={(event) => payment.setData('payment_instructions', event.target.value)} className="app-field resize-none" rows="3" placeholder="Cantumkan nomor pesanan pada berita transfer." /></Field>
                    <div className="flex justify-end"><Button disabled={payment.processing} className="h-11 rounded-xl bg-slate-900 px-5"><Settings2 /> Simpan pembayaran</Button></div>
                </form>
            </section>

            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-100 px-5 py-4 sm:px-6"><h2 className="font-extrabold">Kupon & voucher</h2><p className="mt-1 text-sm text-slate-500">Atur potongan, periode aktif, dan batas penggunaan kode.</p></div>
                <div className="overflow-x-auto"><table className="w-full min-w-[920px] text-left"><thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500"><tr><th className="px-6 py-3">Kode</th><th className="px-4 py-3">Potongan</th><th className="px-4 py-3">Minimum</th><th className="px-4 py-3">Pemakaian</th><th className="px-4 py-3">Periode</th><th className="px-4 py-3">Status</th><th className="px-6 py-3 text-right">Aksi</th></tr></thead><tbody className="divide-y divide-slate-100">{promotions.map((promotion) => <tr key={promotion.id}><td className="px-6 py-4"><p className="font-black text-blue-700">{promotion.code}</p><p className="mt-1 text-xs capitalize text-slate-500">{promotion.kind === 'coupon' ? 'Kupon' : 'Voucher'} · {promotion.description || 'Tanpa deskripsi'}</p></td><td className="px-4 py-4 font-bold">{promotion.discount_type === 'percentage' ? `${Number(promotion.value)}%` : currency(promotion.value)}{promotion.max_discount && <p className="text-xs font-normal text-slate-500">Maks. {currency(promotion.max_discount)}</p>}</td><td className="px-4 py-4 text-sm">{currency(promotion.min_order)}</td><td className="px-4 py-4 text-sm">{promotion.used_count} / {promotion.usage_limit ?? '∞'}</td><td className="px-4 py-4 text-xs text-slate-500">{promotion.starts_at ? shortDate(promotion.starts_at) : 'Sekarang'} – {promotion.ends_at ? shortDate(promotion.ends_at) : 'Tanpa batas'}</td><td className="px-4 py-4"><Badge variant="outline" className={promotion.is_active ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-slate-50 text-slate-500'}>{promotion.is_active ? 'Aktif' : 'Nonaktif'}</Badge></td><td className="px-6 py-4"><div className="flex justify-end gap-2"><Button variant="outline" size="icon-sm" onClick={() => edit(promotion)}><Pencil /></Button><Button variant="outline" size="icon-sm" onClick={() => window.confirm(`Hapus kode ${promotion.code}?`) && router.delete(route('admin.promotions.destroy', promotion.id), { preserveScroll: true })} className="text-red-600"><Trash2 /></Button></div></td></tr>)}{!promotions.length && <tr><td colSpan="7" className="px-6 py-16 text-center text-sm text-slate-500"><TicketPercent className="mx-auto mb-3 size-8 text-slate-300" />Belum ada kupon atau voucher.</td></tr>}</tbody></table></div>
            </section>

            <Dialog open={open} onOpenChange={setOpen}><DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl"><DialogHeader><DialogTitle>{editing ? 'Edit promo' : 'Tambah promo'}</DialogTitle><DialogDescription>Buat kode diskon yang akan divalidasi saat checkout.</DialogDescription></DialogHeader><form onSubmit={submit} className="space-y-4"><div className="grid gap-4 sm:grid-cols-2"><Field label="Jenis" error={form.errors.kind}><select value={form.data.kind} onChange={(e) => form.setData('kind', e.target.value)} className="app-field"><option value="coupon">Kupon</option><option value="voucher">Voucher</option></select></Field><Field label="Kode" error={form.errors.code}><input value={form.data.code} onChange={(e) => form.setData('code', e.target.value.toUpperCase())} className="app-field uppercase" placeholder="HEMAT20" required /></Field></div><Field label="Deskripsi" error={form.errors.description}><input value={form.data.description} onChange={(e) => form.setData('description', e.target.value)} className="app-field" /></Field><div className="grid gap-4 sm:grid-cols-2"><Field label="Tipe diskon" error={form.errors.discount_type}><select value={form.data.discount_type} onChange={(e) => form.setData('discount_type', e.target.value)} className="app-field"><option value="fixed">Nominal rupiah</option><option value="percentage">Persentase</option></select></Field><Field label={form.data.discount_type === 'percentage' ? 'Persentase (%)' : 'Nilai diskon'} error={form.errors.value}><input type="number" min="1" max={form.data.discount_type === 'percentage' ? 100 : undefined} value={form.data.value} onChange={(e) => form.setData('value', e.target.value)} className="app-field" required /></Field></div><div className="grid gap-4 sm:grid-cols-2"><Field label="Minimum belanja" error={form.errors.min_order}><input type="number" min="0" value={form.data.min_order} onChange={(e) => form.setData('min_order', e.target.value)} className="app-field" required /></Field><Field label="Maksimum diskon (opsional)" error={form.errors.max_discount}><input type="number" min="1" value={form.data.max_discount} onChange={(e) => form.setData('max_discount', e.target.value)} className="app-field" /></Field></div><div className="grid gap-4 sm:grid-cols-3"><Field label="Batas penggunaan" error={form.errors.usage_limit}><input type="number" min="1" value={form.data.usage_limit} onChange={(e) => form.setData('usage_limit', e.target.value)} className="app-field" /></Field><Field label="Mulai" error={form.errors.starts_at}><input type="datetime-local" value={form.data.starts_at} onChange={(e) => form.setData('starts_at', e.target.value)} className="app-field" /></Field><Field label="Berakhir" error={form.errors.ends_at}><input type="datetime-local" value={form.data.ends_at} onChange={(e) => form.setData('ends_at', e.target.value)} className="app-field" /></Field></div><label className="flex items-center gap-3 rounded-xl bg-slate-50 p-3 text-sm font-bold"><input type="checkbox" checked={form.data.is_active} onChange={(e) => form.setData('is_active', e.target.checked)} className="app-checkbox" /> Promo aktif</label><DialogFooter><Button type="button" variant="outline" onClick={() => setOpen(false)}>Batal</Button><Button disabled={form.processing} className="bg-blue-600 hover:bg-blue-700">Simpan promo</Button></DialogFooter></form></DialogContent></Dialog>
        </AuthenticatedLayout>
    );
}

function Field({ label, error, children }) { return <label className="block"><span className="mb-1.5 block text-sm font-bold text-slate-700">{label}</span>{children}{error && <span className="mt-1 block text-xs font-semibold text-red-600">{error}</span>}</label>; }
