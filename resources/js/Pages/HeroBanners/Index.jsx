import { Badge } from '@/Components/ui/badge';
import { Button } from '@/Components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/Components/ui/dialog';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router, useForm } from '@inertiajs/react';
import { ImagePlus, Images, Pencil, Plus, Trash2, Upload } from 'lucide-react';
import { useEffect, useState } from 'react';

const emptyBanner = {
    eyebrow: '',
    title: '',
    description: '',
    cta_label: 'Lihat produk',
    cta_url: '#produk',
    sort_order: 0,
    is_active: true,
    image: null,
};

export default function HeroBannersIndex({ banners }) {
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [preview, setPreview] = useState('');
    const form = useForm(emptyBanner);

    useEffect(() => () => {
        if (preview?.startsWith('blob:')) URL.revokeObjectURL(preview);
    }, [preview]);

    const openCreate = () => {
        setEditing(null);
        setPreview('');
        form.setData({ ...emptyBanner, sort_order: banners.length });
        form.clearErrors();
        setOpen(true);
    };

    const openEdit = (banner) => {
        setEditing(banner);
        setPreview(banner.image);
        form.setData({
            eyebrow: banner.eyebrow || '',
            title: banner.title,
            description: banner.description || '',
            cta_label: banner.cta_label || '',
            cta_url: banner.cta_url || '',
            sort_order: banner.sort_order,
            is_active: banner.is_active,
            image: null,
        });
        form.clearErrors();
        setOpen(true);
    };

    const selectImage = (event) => {
        const image = event.target.files?.[0] || null;
        form.setData('image', image);
        if (image) setPreview(URL.createObjectURL(image));
    };

    const submit = (event) => {
        event.preventDefault();
        const options = {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => setOpen(false),
        };

        if (editing) {
            form.transform((data) => ({ ...data, _method: 'patch' }));
            form.post(route('admin.hero-banners.update', editing.id), options);
            return;
        }

        form.post(route('admin.hero-banners.store'), options);
    };

    return (
        <AuthenticatedLayout
            title="Hero Banner"
            eyebrow="Tampilan storefront"
            action={<Button onClick={openCreate} className="rounded-xl bg-blue-600 hover:bg-blue-700"><Plus /> Tambah banner</Button>}
        >
            <Head title="Hero Banner" />

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                <div className="flex flex-col gap-2 border-b border-slate-100 pb-5 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <h2 className="font-extrabold text-slate-950">Banner storefront</h2>
                        <p className="mt-1 text-sm text-slate-500">Banner aktif tampil sebagai carousel berdasarkan urutan terkecil.</p>
                    </div>
                    <p className="text-sm font-semibold text-slate-500">{banners.filter((banner) => banner.is_active).length} aktif dari {banners.length} banner</p>
                </div>

                {banners.length ? (
                    <div className="mt-6 grid gap-5 xl:grid-cols-2">
                        {banners.map((banner) => (
                            <article key={banner.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                                <div className="relative aspect-[16/7] overflow-hidden bg-slate-900">
                                    <img src={banner.image} alt={banner.title} className="h-full w-full object-cover" />
                                    <div className="absolute inset-0 bg-gradient-to-r from-slate-950/80 via-slate-950/35 to-transparent" />
                                    <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                                        {banner.eyebrow && <p className="text-xs font-black uppercase tracking-[.16em] text-blue-300">{banner.eyebrow}</p>}
                                        <h3 className="mt-1 line-clamp-2 text-xl font-black tracking-tight">{banner.title}</h3>
                                    </div>
                                    <span className="absolute right-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-xs font-black text-slate-800 shadow-sm">Urutan {banner.sort_order}</span>
                                </div>
                                <div className="flex items-center gap-3 p-4">
                                    <Badge variant="outline" className={banner.is_active ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-white text-slate-500'}>{banner.is_active ? 'Aktif' : 'Nonaktif'}</Badge>
                                    <p className="min-w-0 flex-1 truncate text-xs font-semibold text-slate-500">{banner.cta_label ? `${banner.cta_label} → ${banner.cta_url}` : 'Tanpa tombol CTA'}</p>
                                    <Button variant="outline" size="icon-sm" onClick={() => openEdit(banner)} aria-label={`Edit ${banner.title}`}><Pencil /></Button>
                                    <Button variant="outline" size="icon-sm" className="text-red-600" onClick={() => window.confirm(`Hapus banner “${banner.title}”?`) && router.delete(route('admin.hero-banners.destroy', banner.id), { preserveScroll: true })} aria-label={`Hapus ${banner.title}`}><Trash2 /></Button>
                                </div>
                            </article>
                        ))}
                    </div>
                ) : (
                    <div className="grid place-items-center py-20 text-center">
                        <span className="grid size-16 place-items-center rounded-2xl bg-blue-50 text-blue-600"><Images className="size-7" /></span>
                        <h3 className="mt-4 font-extrabold">Belum ada hero banner</h3>
                        <p className="mt-1 max-w-sm text-sm text-slate-500">Storefront masih menggunakan hero bawaan. Tambahkan banner pertama untuk menggantinya.</p>
                        <Button onClick={openCreate} className="mt-5 rounded-xl bg-blue-600 hover:bg-blue-700"><ImagePlus /> Tambah banner</Button>
                    </div>
                )}
            </section>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>{editing ? 'Ubah hero banner' : 'Tambah hero banner'}</DialogTitle>
                        <DialogDescription>Gunakan gambar lebar, idealnya rasio 16:7 atau 1920 × 840 piksel.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={submit} className="space-y-4">
                        <Field label={editing ? 'Gambar banner (opsional jika tidak diganti)' : 'Gambar banner'} error={form.errors.image}>
                            <label className="group relative block cursor-pointer overflow-hidden rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 transition hover:border-blue-300">
                                {preview ? <img src={preview} alt="Preview banner" className="aspect-[16/7] w-full object-cover" /> : <span className="grid aspect-[16/7] place-items-center text-center text-sm font-semibold text-slate-500"><span><Upload className="mx-auto mb-2 size-7 text-slate-400" />Klik untuk memilih gambar</span></span>}
                                <span className="absolute inset-x-0 bottom-0 bg-slate-950/70 px-4 py-2 text-center text-xs font-bold text-white opacity-0 transition group-hover:opacity-100">Pilih gambar JPG, PNG, atau WebP · maksimal 8 MB</span>
                                <input type="file" accept="image/jpeg,image/png,image/webp" onChange={selectImage} className="sr-only" required={!editing} />
                            </label>
                        </Field>
                        <div className="grid gap-4 sm:grid-cols-[1fr_140px]">
                            <Field label="Label kecil (opsional)" error={form.errors.eyebrow}><input value={form.data.eyebrow} onChange={(event) => form.setData('eyebrow', event.target.value)} className="app-field" placeholder="Koleksi terbaru" /></Field>
                            <Field label="Urutan" error={form.errors.sort_order}><input type="number" min="0" value={form.data.sort_order} onChange={(event) => form.setData('sort_order', event.target.value)} className="app-field" required /></Field>
                        </div>
                        <Field label="Judul" error={form.errors.title}><input value={form.data.title} onChange={(event) => form.setData('title', event.target.value)} className="app-field" placeholder="Temukan kebutuhan terbaikmu" required /></Field>
                        <Field label="Deskripsi (opsional)" error={form.errors.description}><textarea rows="3" value={form.data.description} onChange={(event) => form.setData('description', event.target.value)} className="app-field resize-none" placeholder="Deskripsi singkat yang tampil di bawah judul." /></Field>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <Field label="Label tombol (opsional)" error={form.errors.cta_label}><input value={form.data.cta_label} onChange={(event) => form.setData('cta_label', event.target.value)} className="app-field" placeholder="Belanja sekarang" /></Field>
                            <Field label="Tautan tombol" error={form.errors.cta_url}><input value={form.data.cta_url} onChange={(event) => form.setData('cta_url', event.target.value)} className="app-field" placeholder="#produk atau https://..." /></Field>
                        </div>
                        <label className="flex items-center gap-3 rounded-xl bg-slate-50 p-3 text-sm font-bold text-slate-700"><input type="checkbox" checked={form.data.is_active} onChange={(event) => form.setData('is_active', event.target.checked)} className="app-checkbox" /> Tampilkan banner di storefront</label>
                        <DialogFooter><Button type="button" variant="outline" onClick={() => setOpen(false)}>Batal</Button><Button disabled={form.processing} className="bg-blue-600 hover:bg-blue-700">{form.processing ? 'Menyimpan...' : 'Simpan banner'}</Button></DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </AuthenticatedLayout>
    );
}

function Field({ label, error, children }) {
    return <label className="block"><span className="mb-1.5 block text-sm font-bold text-slate-700">{label}</span>{children}{error && <span className="mt-1 block text-xs font-semibold text-red-600">{error}</span>}</label>;
}
