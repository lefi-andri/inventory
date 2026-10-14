import { Badge } from '@/Components/ui/badge';
import { Button } from '@/Components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/Components/ui/dialog';
import SearchSelect from '@/Components/SearchSelect';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { shortDate, statusLabel } from '@/lib/format';
import { Head, useForm, usePage } from '@inertiajs/react';
import { ArrowDownRight, ArrowUpRight, Boxes, PackageCheck, Plus, Search } from 'lucide-react';
import { useState } from 'react';

const movementOptions = [
    { value: 'purchase', label: 'Pembelian dari pemasok (+)' },
    { value: 'return', label: 'Retur pelanggan (+)' },
    { value: 'damaged', label: 'Barang rusak / hilang (-)' },
    { value: 'adjustment', label: 'Koreksi hasil stok opname (+/-)' },
];

const directionOptions = [
    { value: 'all', label: 'Semua arah' },
    { value: 'in', label: 'Stok masuk' },
    { value: 'out', label: 'Stok keluar' },
];

export default function InventoryIndex({ products, movements }) {
    const canAdjust = usePage().props.auth.permissions.includes('inventory.adjust');
    const [open, setOpen] = useState(false);
    const [historySearch, setHistorySearch] = useState('');
    const [historyType, setHistoryType] = useState('all');
    const [historyDirection, setHistoryDirection] = useState('all');
    const form = useForm({ product_id: '', type: 'purchase', quantity: '', reference: '', notes: '' });
    const submit = (e) => { e.preventDefault(); form.post(route('inventory.store'), { onSuccess: () => { setOpen(false); form.reset(); } }); };
    const totalStock = products.reduce((sum, product) => sum + product.stock, 0);
    const lowStock = products.filter((product) => product.stock <= product.threshold).length;
    const selectedProduct = products.find((product) => String(product.id) === String(form.data.product_id));
    const enteredQuantity = Number(form.data.quantity);
    const signedQuantity = form.data.type === 'damaged' ? -enteredQuantity : enteredQuantity;
    const projectedStock = selectedProduct && enteredQuantity
        ? selectedProduct.stock + signedQuantity
        : null;
    const isAdjustment = form.data.type === 'adjustment';
    const productOptions = products.map((product) => ({
        value: product.id,
        label: `${product.name} — ${product.sku} — stok ${product.stock}`,
    }));
    const historyTypeOptions = [
        { value: 'all', label: 'Semua tipe' },
        ...[...new Set(movements.map((movement) => movement.type))].map((type) => ({
            value: type,
            label: statusLabel[type] || type,
        })),
    ];
    const normalizedSearch = historySearch.trim().toLowerCase();
    const filteredMovements = movements.filter((movement) => {
        const matchesSearch = !normalizedSearch || [movement.product, movement.sku, movement.reference, movement.user, movement.notes]
            .filter(Boolean)
            .some((value) => String(value).toLowerCase().includes(normalizedSearch));
        const matchesType = historyType === 'all' || movement.type === historyType;
        const matchesDirection = historyDirection === 'all'
            || (historyDirection === 'in' && movement.quantity > 0)
            || (historyDirection === 'out' && movement.quantity < 0);

        return matchesSearch && matchesType && matchesDirection;
    });

    return (
        <AuthenticatedLayout title="Inventory" eyebrow="Kontrol persediaan" action={canAdjust && <Button onClick={() => setOpen(true)} className="h-10 rounded-xl bg-blue-600 hover:bg-blue-700"><Plus /> Tambah / kurangi stok</Button>}>
            <Head title="Inventory" />
            <section className="grid gap-4 sm:grid-cols-3">
                <Metric label="Total unit tersedia" value={totalStock} icon={Boxes} tone="blue" />
                <Metric label="SKU aktif" value={products.length} icon={PackageCheck} tone="slate" />
                <Metric label="Perlu restock" value={lowStock} icon={ArrowDownRight} tone="lime" />
            </section>

            <section className="mt-6 grid gap-6 xl:grid-cols-[.85fr_1.4fr]">
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                    <h2 className="text-lg font-extrabold">Posisi stok</h2><p className="mt-1 text-sm text-slate-500">Status terkini per produk.</p>
                    <div className="mt-5 space-y-3">{products.map((product) => { const low = product.stock <= product.threshold; return <div key={product.id} className="flex items-center gap-3 rounded-xl border border-slate-100 p-3.5"><span className={`grid size-10 place-items-center rounded-xl ${low ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}><Boxes className="size-5" /></span><div className="min-w-0 flex-1"><p className="truncate text-sm font-bold">{product.name}</p><p className="text-xs text-slate-500">{product.sku} · {product.category}</p></div><div className="text-right"><p className={`text-base font-black ${low ? 'text-red-600' : ''}`}>{product.stock}</p><p className="text-[11px] text-slate-500">min. {product.threshold}</p></div></div>; })}</div>
                </div>

                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <div className="border-b border-slate-100 px-5 py-4 sm:px-6"><div className="flex flex-col gap-4"><div><div className="flex items-center gap-2"><h2 className="text-lg font-extrabold">Riwayat pergerakan</h2><Badge variant="secondary">{filteredMovements.length} dari {movements.length}</Badge></div><p className="mt-1 text-sm text-slate-500">Audit masuk dan keluar barang.</p></div><div className="grid gap-2 md:grid-cols-[minmax(220px,1fr)_180px_160px]"><div className="relative"><Search className="pointer-events-none absolute left-3 top-1/2 z-10 size-4 -translate-y-1/2 text-slate-400" /><input type="search" value={historySearch} onChange={(event) => setHistorySearch(event.target.value)} className="app-field pl-10" placeholder="Cari produk, SKU, referensi..." aria-label="Cari riwayat pergerakan" /></div><SearchSelect options={historyTypeOptions} value={historyType} onChange={setHistoryType} placeholder="Semua tipe" aria-label="Filter tipe pergerakan" /><SearchSelect options={directionOptions} value={historyDirection} onChange={setHistoryDirection} placeholder="Semua arah" aria-label="Filter arah stok" /></div></div></div>
                    <div className="overflow-x-auto"><table className="w-full min-w-[720px] text-left"><thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500"><tr><th className="px-6 py-3 font-bold">Produk</th><th className="px-4 py-3 font-bold">Tipe</th><th className="px-4 py-3 font-bold">Perubahan</th><th className="px-4 py-3 font-bold">Stok akhir</th><th className="px-6 py-3 text-right font-bold">Referensi</th></tr></thead><tbody className="divide-y divide-slate-100">{filteredMovements.map((movement) => <tr key={movement.id}><td className="px-6 py-4"><p className="text-sm font-bold">{movement.product}</p><p className="text-xs text-slate-500">{movement.sku} · {shortDate(movement.created_at)}</p></td><td className="px-4 py-4"><Badge variant="outline">{statusLabel[movement.type] || movement.type}</Badge></td><td className="px-4 py-4"><span className={`inline-flex items-center gap-1 text-sm font-black ${movement.quantity > 0 ? 'text-emerald-600' : 'text-red-600'}`}>{movement.quantity > 0 ? <ArrowUpRight className="size-4" /> : <ArrowDownRight className="size-4" />}{movement.quantity > 0 ? '+' : ''}{movement.quantity}</span></td><td className="px-4 py-4 text-sm font-bold">{movement.after_stock}</td><td className="px-6 py-4 text-right"><p className="text-sm font-semibold">{movement.reference || '—'}</p><p className="text-xs text-slate-500">oleh {movement.user}</p></td></tr>)}{!filteredMovements.length && <tr><td colSpan="5" className="px-6 py-14 text-center text-sm text-slate-500">{movements.length ? 'Tidak ada riwayat yang cocok dengan filter.' : 'Belum ada pergerakan stok.'}</td></tr>}</tbody></table></div>
                </div>
            </section>

            <Dialog open={open} onOpenChange={setOpen}><DialogContent><DialogHeader><DialogTitle>Tambah atau kurangi stok</DialogTitle><DialogDescription>Pilih alasan pergerakan. Sistem menentukan arah stok untuk pembelian, retur pelanggan, dan barang rusak.</DialogDescription></DialogHeader><form onSubmit={submit} className="space-y-4"><Field label="Produk" error={form.errors.product_id}><SearchSelect options={productOptions} value={form.data.product_id} onChange={(value) => form.setData('product_id', value)} placeholder="Cari nama atau SKU produk..." noOptionsMessage="Produk tidak ditemukan" required aria-label="Cari produk" /></Field><div className="grid gap-4 sm:grid-cols-2"><Field label="Alasan pergerakan" error={form.errors.type}><SearchSelect options={movementOptions} value={form.data.type} onChange={(value) => { form.setData('type', value); form.setData('quantity', ''); }} placeholder="Pilih alasan" aria-label="Alasan pergerakan" /></Field><Field label={isAdjustment ? 'Selisih stok (+ / -)' : 'Jumlah unit'} error={form.errors.quantity}><input type="number" min={isAdjustment ? undefined : 1} value={form.data.quantity} onChange={(e) => form.setData('quantity', e.target.value)} className="app-field" placeholder={isAdjustment ? 'Contoh: 3 atau -2' : 'Contoh: 10'} required /></Field></div>{selectedProduct && projectedStock !== null && <div className={`rounded-xl border px-4 py-3 text-sm ${projectedStock < 0 ? 'border-red-200 bg-red-50 text-red-700' : 'border-blue-100 bg-blue-50 text-blue-800'}`}><span className="font-semibold">Perkiraan stok:</span> {selectedProduct.stock} {signedQuantity >= 0 ? '+' : '−'} {Math.abs(signedQuantity)} = <span className="font-black">{projectedStock} unit</span></div>}<Field label="Nomor referensi" error={form.errors.reference}><input value={form.data.reference} onChange={(e) => form.setData('reference', e.target.value)} className="app-field" placeholder="Contoh: PO-2026-001 (opsional)" /></Field><Field label="Catatan" error={form.errors.notes}><textarea value={form.data.notes} onChange={(e) => form.setData('notes', e.target.value)} className="app-field resize-none" rows="3" placeholder="Jelaskan sumber atau alasan perubahan stok" required /></Field><DialogFooter><Button type="button" variant="outline" onClick={() => setOpen(false)}>Batal</Button><Button disabled={form.processing || !form.data.product_id || projectedStock < 0} className="bg-blue-600 hover:bg-blue-700">Simpan pergerakan</Button></DialogFooter></form></DialogContent></Dialog>
        </AuthenticatedLayout>
    );
}

function Metric({ label, value, icon: Icon, tone }) { const colors = { blue: 'bg-blue-600 text-white', slate: 'bg-white text-slate-950', lime: 'bg-[#d9ff78] text-slate-950' }; return <div className={`flex items-center justify-between rounded-2xl border border-slate-200 p-5 shadow-sm ${colors[tone]}`}><div><p className={`text-sm font-semibold ${tone === 'blue' ? 'text-blue-100' : 'text-slate-500'}`}>{label}</p><p className="mt-2 text-3xl font-black">{value}</p></div><span className={`grid size-11 place-items-center rounded-xl ${tone === 'blue' ? 'bg-white/15' : 'bg-slate-950/[.06]'}`}><Icon className="size-5" /></span></div>; }
function Field({ label, error, children }) { return <label className="block"><span className="mb-1.5 block text-sm font-bold text-slate-700">{label}</span>{children}{error && <span className="mt-1 block text-xs text-red-600">{error}</span>}</label>; }
