import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/Components/ui/alert-dialog';
import { Badge } from '@/Components/ui/badge';
import { Button } from '@/Components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/Components/ui/dialog';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { currency } from '@/lib/format';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import { ImagePlus, PackageOpen, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { useState } from 'react';

const initialForm = { category_id: '', name: '', sku: '', description: '', price: '', cost: '', stock: 0, low_stock_threshold: 5, is_active: true, images: [] };

export default function ProductsIndex({ products, categories, filters }) {
    const permissions = usePage().props.auth.permissions;
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [search, setSearch] = useState(filters.search || '');
    const form = useForm(initialForm);

    const openCreate = () => { setEditing(null); form.reset(); form.clearErrors(); setModalOpen(true); };
    const openEdit = (product) => {
        setEditing(product);
        form.setData({ _method: 'patch', category_id: product.category_id || '', name: product.name, sku: product.sku, description: product.description || '', price: product.price, cost: product.cost, stock: product.stock, low_stock_threshold: product.low_stock_threshold, is_active: product.is_active, images: [] });
        form.clearErrors(); setModalOpen(true);
    };
    const submit = (event) => {
        event.preventDefault();
        if (editing) {
            form.post(route('products.update', editing.id), { forceFormData: true, onSuccess: () => setModalOpen(false) });
        } else {
            form.post(route('products.store'), { forceFormData: true, onSuccess: () => setModalOpen(false) });
        }
    };
    const runSearch = (event) => { event.preventDefault(); router.get(route('products.index'), { search }, { preserveState: true, replace: true }); };

    return (
        <AuthenticatedLayout title="Produk" eyebrow={`${products.length} item dalam katalog`} action={permissions.includes('products.create') && <Button onClick={openCreate} className="h-10 rounded-xl bg-blue-600 px-4 hover:bg-blue-700"><Plus /> Tambah produk</Button>}>
            <Head title="Produk" />
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="flex flex-col gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                    <div><h2 className="text-lg font-extrabold">Katalog produk</h2><p className="mt-1 text-sm text-slate-500">Kelola harga, status, gambar, dan batas stok.</p></div>
                    <form onSubmit={runSearch} className="relative w-full sm:w-72"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari nama atau SKU..." className="h-10 w-full rounded-xl border-slate-200 bg-slate-50 pl-10 pr-4 text-sm focus:border-blue-500 focus:ring-blue-500" /></form>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full min-w-[900px] text-left"><thead className="bg-slate-50/80 text-xs uppercase tracking-wider text-slate-500"><tr><th className="px-6 py-3 font-bold">Produk</th><th className="px-4 py-3 font-bold">Kategori</th><th className="px-4 py-3 font-bold">Harga</th><th className="px-4 py-3 font-bold">Stok</th><th className="px-4 py-3 font-bold">Status</th><th className="px-6 py-3 text-right font-bold">Aksi</th></tr></thead>
                        <tbody className="divide-y divide-slate-100">{products.map((product) => <tr key={product.id} className="group hover:bg-slate-50/70"><td className="px-6 py-4"><div className="flex items-center gap-3">{product.image ? <img src={product.image} alt="" className="size-12 rounded-xl object-cover" /> : <span className="grid size-12 place-items-center rounded-xl bg-slate-100 text-slate-400"><PackageOpen className="size-5" /></span>}<div><p className="font-bold text-slate-900">{product.name}</p><p className="mt-1 text-xs font-semibold text-slate-500">{product.sku} · {product.images_count} gambar</p></div></div></td><td className="px-4 py-4 text-sm font-medium text-slate-600">{product.category || 'Tanpa kategori'}</td><td className="px-4 py-4"><p className="text-sm font-extrabold">{currency(product.price)}</p><p className="text-xs text-slate-500">Modal {currency(product.cost)}</p></td><td className="px-4 py-4"><span className={`text-sm font-black ${product.stock <= product.low_stock_threshold ? 'text-red-600' : 'text-slate-900'}`}>{product.stock}</span><span className="ml-1 text-xs text-slate-500">unit</span></td><td className="px-4 py-4"><Badge variant="outline" className={product.is_active ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-slate-50 text-slate-500'}>{product.is_active ? 'Aktif' : 'Nonaktif'}</Badge></td><td className="px-6 py-4"><div className="flex justify-end gap-2">{permissions.includes('products.update') && <Button variant="outline" size="icon-sm" onClick={() => openEdit(product)} aria-label="Edit produk"><Pencil /></Button>}{permissions.includes('products.delete') && <DeleteProduct product={product} />}</div></td></tr>)}
                        {!products.length && <tr><td colSpan="6" className="px-6 py-16 text-center"><PackageOpen className="mx-auto size-9 text-slate-300" /><p className="mt-3 text-sm font-semibold text-slate-600">Produk belum ditemukan.</p></td></tr>}</tbody>
                    </table>
                </div>
            </div>

            <Dialog open={modalOpen} onOpenChange={setModalOpen}>
                <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
                    <DialogHeader><DialogTitle>{editing ? 'Edit produk' : 'Tambah produk baru'}</DialogTitle><DialogDescription>{editing ? 'Perbarui informasi katalog. Perubahan stok dilakukan dari menu Inventory.' : 'Isi informasi produk dan unggah hingga empat gambar.'}</DialogDescription></DialogHeader>
                    <form onSubmit={submit} className="space-y-5">
                        <div className="grid gap-4 sm:grid-cols-2"><Field label="Nama produk" error={form.errors.name}><input value={form.data.name} onChange={(e) => form.setData('name', e.target.value)} className="form-input" required /></Field><Field label="SKU" error={form.errors.sku}><input value={form.data.sku} onChange={(e) => form.setData('sku', e.target.value.toUpperCase())} className="form-input" required /></Field></div>
                        <Field label="Kategori" error={form.errors.category_id}><select value={form.data.category_id} onChange={(e) => form.setData('category_id', e.target.value)} className="form-input"><option value="">Tanpa kategori</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></Field>
                        <Field label="Deskripsi" error={form.errors.description}><textarea value={form.data.description} onChange={(e) => form.setData('description', e.target.value)} rows="3" className="form-input resize-none" /></Field>
                        <div className="grid gap-4 sm:grid-cols-2"><Field label="Harga jual" error={form.errors.price}><input type="number" min="0" value={form.data.price} onChange={(e) => form.setData('price', e.target.value)} className="form-input" required /></Field><Field label="Harga modal" error={form.errors.cost}><input type="number" min="0" value={form.data.cost} onChange={(e) => form.setData('cost', e.target.value)} className="form-input" required /></Field></div>
                        <div className="grid gap-4 sm:grid-cols-2">{!editing && <Field label="Stok awal" error={form.errors.stock}><input type="number" min="0" value={form.data.stock} onChange={(e) => form.setData('stock', e.target.value)} className="form-input" required /></Field>}<Field label="Batas stok minimum" error={form.errors.low_stock_threshold}><input type="number" min="0" value={form.data.low_stock_threshold} onChange={(e) => form.setData('low_stock_threshold', e.target.value)} className="form-input" required /></Field></div>
                        <Field label="Gambar produk (JPG, PNG, WebP · maks. 4 MB)"><label className="flex cursor-pointer items-center justify-center gap-3 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 px-4 py-7 text-sm font-semibold text-slate-600 transition hover:border-blue-300 hover:bg-blue-50"><ImagePlus className="size-5 text-blue-600" />{form.data.images.length ? `${form.data.images.length} file dipilih` : 'Pilih gambar produk'}<input type="file" accept="image/jpeg,image/png,image/webp" multiple className="sr-only" onChange={(e) => form.setData('images', Array.from(e.target.files).slice(0, 4))} /></label>{form.errors.images && <p className="mt-1 text-xs text-red-600">{form.errors.images}</p>}</Field>
                        <label className="flex items-center gap-3 text-sm font-semibold"><input type="checkbox" checked={form.data.is_active} onChange={(e) => form.setData('is_active', e.target.checked)} className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" /> Tampilkan produk di storefront</label>
                        <DialogFooter><Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Batal</Button><Button disabled={form.processing} className="bg-blue-600 hover:bg-blue-700">{form.processing ? 'Menyimpan...' : 'Simpan produk'}</Button></DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </AuthenticatedLayout>
    );
}

function Field({ label, error, children }) { return <label className="block"><span className="mb-1.5 block text-sm font-bold text-slate-700">{label}</span>{children}{error && <span className="mt-1 block text-xs font-medium text-red-600">{error}</span>}</label>; }

function DeleteProduct({ product }) {
    return <AlertDialog><AlertDialogTrigger asChild><Button variant="outline" size="icon-sm" className="text-red-600 hover:bg-red-50 hover:text-red-700" aria-label="Hapus produk"><Trash2 /></Button></AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Hapus {product.name}?</AlertDialogTitle><AlertDialogDescription>Produk yang sudah memiliki riwayat stok akan dinonaktifkan agar audit tetap utuh.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Batal</AlertDialogCancel><AlertDialogAction onClick={() => router.delete(route('products.destroy', product.id))} className="bg-red-600 hover:bg-red-700">Hapus produk</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>;
}
