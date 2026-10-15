import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/Components/ui/alert-dialog';
import { Badge } from '@/Components/ui/badge';
import { Button } from '@/Components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/Components/ui/dialog';
import SearchSelect from '@/Components/SearchSelect';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { currency } from '@/lib/format';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import { Check, Copy, Globe2, ImagePlus, Images, LoaderCircle, PackageOpen, Pencil, Plus, Search, Star, Trash2, Upload, X } from 'lucide-react';
import { useEffect, useState } from 'react';

const initialForm = {
    category_id: '',
    name: '',
    sku: '',
    description: '',
    price: '',
    price_usd: '',
    cost: '',
    stock: 0,
    low_stock_threshold: 5,
    is_active: true,
    is_discontinued: false,
    images: [],
    deleted_media_ids: [],
    primary_media_id: null,
    translations: {
        id: { name: '', description: '' },
        en: { name: '', description: '' },
    },
};

export default function ProductsIndex({ products, categories, filters }) {
    const { auth, supportedLocales = [] } = usePage().props;
    const permissions = auth.permissions;
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [activeLang, setActiveLang] = useState('id');
    const [search, setSearch] = useState(filters.search || '');
    const [mediaModalProduct, setMediaModalProduct] = useState(null);
    const [mediaUploading, setMediaUploading] = useState(false);
    const [mediaUploadFiles, setMediaUploadFiles] = useState([]);
    const [selectedFilePreviews, setSelectedFilePreviews] = useState([]);

    const form = useForm(initialForm);
    const categoryOptions = [
        { value: '', label: 'Tanpa kategori' },
        ...categories.map((category) => ({ value: category.id, label: category.name })),
    ];

    useEffect(() => {
        if (mediaModalProduct) {
            const fresh = products.find((p) => p.id === mediaModalProduct.id);
            if (fresh) setMediaModalProduct(fresh);
        }
        if (editing) {
            const fresh = products.find((p) => p.id === editing.id);
            if (fresh) setEditing(fresh);
        }
    }, [products]);

    useEffect(() => {
        if (!form.data.images || form.data.images.length === 0) {
            setSelectedFilePreviews([]);
            return;
        }

        const previews = Array.from(form.data.images).map((file) => ({
            file,
            url: URL.createObjectURL(file),
            name: file.name,
            size: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
        }));

        setSelectedFilePreviews(previews);

        return () => {
            previews.forEach((p) => URL.revokeObjectURL(p.url));
        };
    }, [form.data.images]);

    const openCreate = () => {
        setEditing(null);
        setActiveLang('id');
        form.setData(initialForm);
        form.clearErrors();
        setModalOpen(true);
    };

    const openEdit = (product) => {
        setEditing(product);
        setActiveLang('id');
        const idName = product.translations?.id?.name || product.default_name || product.name || '';
        const idDesc = product.translations?.id?.description || product.description || '';
        const enName = product.translations?.en?.name || '';
        const enDesc = product.translations?.en?.description || '';

        form.setData({
            _method: 'patch',
            category_id: product.category_id || '',
            name: idName,
            sku: product.sku,
            description: idDesc,
            price: product.price,
            price_usd: product.price_usd !== null && product.price_usd !== undefined ? product.price_usd : '',
            cost: product.cost,
            stock: product.stock,
            low_stock_threshold: product.low_stock_threshold,
            is_active: product.is_active,
            is_discontinued: product.is_discontinued,
            images: [],
            deleted_media_ids: [],
            primary_media_id: null,
            translations: {
                id: { name: idName, description: idDesc },
                en: { name: enName, description: enDesc },
            },
        });
        form.clearErrors();
        setModalOpen(true);
    };

    const setTranslationField = (lang, field, value) => {
        form.setData((current) => {
            const nextTranslations = {
                ...current.translations,
                [lang]: {
                    ...(current.translations?.[lang] || {}),
                    [field]: value,
                },
            };

            const updates = {
                ...current,
                translations: nextTranslations,
            };

            if (lang === 'id') {
                updates[field] = value;
            }

            return updates;
        });
    };

    const copyFromIndonesian = () => {
        const idData = form.data.translations?.id || {};
        form.setData((current) => ({
            ...current,
            translations: {
                ...current.translations,
                en: {
                    name: idData.name || current.name || '',
                    description: idData.description || current.description || '',
                },
            },
        }));
    };

    const toggleMarkDeleteMedia = (mediaId) => {
        form.setData((current) => {
            const existing = current.deleted_media_ids || [];
            const isMarked = existing.includes(mediaId);
            return {
                ...current,
                deleted_media_ids: isMarked
                    ? existing.filter((id) => id !== mediaId)
                    : [...existing, mediaId],
                primary_media_id: current.primary_media_id === mediaId ? null : current.primary_media_id,
            };
        });
    };

    const removeSelectedNewFile = (index) => {
        const nextFiles = Array.from(form.data.images).filter((_, i) => i !== index);
        form.setData('images', nextFiles);
    };

    const submit = (event) => {
        event.preventDefault();
        if (editing) {
            form.post(route('products.update', editing.id), { forceFormData: true, onSuccess: () => setModalOpen(false) });
        } else {
            form.post(route('products.store'), { forceFormData: true, onSuccess: () => setModalOpen(false) });
        }
    };

    const runSearch = (event) => {
        event.preventDefault();
        router.get(route('products.index'), { search }, { preserveState: true, replace: true });
    };

    // Dedicated Media Manager Actions
    const handleStandaloneMediaUpload = (event) => {
        event.preventDefault();
        if (!mediaUploadFiles.length || !mediaModalProduct) return;
        setMediaUploading(true);
        router.post(route('products.media.store', mediaModalProduct.id), {
            images: mediaUploadFiles,
        }, {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                setMediaUploadFiles([]);
                setMediaUploading(false);
            },
            onError: () => setMediaUploading(false),
            onFinish: () => setMediaUploading(false),
        });
    };

    const handleDeleteMedia = (productId, mediaId) => {
        if (!confirm('Hapus gambar ini dari katalog?')) return;
        router.delete(route('products.media.destroy', [productId, mediaId]), {
            preserveScroll: true,
        });
    };

    const handleSetPrimaryMedia = (productId, mediaId) => {
        router.post(route('products.media.primary', [productId, mediaId]), {}, {
            preserveScroll: true,
        });
    };

    return (
        <AuthenticatedLayout title="Produk" eyebrow={`${products.length} item dalam katalog`} action={permissions.includes('products.create') && <Button onClick={openCreate} className="h-10 rounded-xl bg-blue-600 px-4 hover:bg-blue-700"><Plus /> Tambah produk</Button>}>
            <Head title="Produk" />
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="flex flex-col gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                    <div>
                        <h2 className="text-lg font-extrabold">Katalog produk</h2>
                        <p className="mt-1 text-sm text-slate-500">Kelola gambar produk, informasi multibahasa, harga, dan stok.</p>
                    </div>
                    <form onSubmit={runSearch} className="relative w-full sm:w-72">
                        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari nama atau SKU..." className="h-10 w-full rounded-xl border-slate-200 bg-slate-50 pl-10 pr-4 text-sm focus:border-blue-500 focus:ring-blue-500" />
                    </form>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full min-w-[900px] text-left">
                        <thead className="bg-slate-50/80 text-xs uppercase tracking-wider text-slate-500">
                            <tr>
                                <th className="px-6 py-3 font-bold">Produk</th>
                                <th className="px-4 py-3 font-bold">Kategori</th>
                                <th className="px-4 py-3 font-bold">Harga</th>
                                <th className="px-4 py-3 font-bold">Stok</th>
                                <th className="px-4 py-3 font-bold">Status</th>
                                <th className="px-6 py-3 text-right font-bold">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {products.map((product) => (
                                <tr key={product.id} className="group hover:bg-slate-50/70">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            {/* Thumbnail with quick media manager click */}
                                            <button
                                                type="button"
                                                onClick={() => setMediaModalProduct(product)}
                                                className="group/thumb relative size-13 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-100 transition hover:border-blue-500 hover:ring-2 hover:ring-blue-500/20"
                                                title="Klik untuk mengelola gambar produk"
                                                aria-label={`Kelola gambar ${product.name}`}
                                            >
                                                {product.image ? (
                                                    <img src={product.image} alt="" className={`h-full w-full object-cover ${product.is_discontinued ? 'grayscale opacity-60' : ''}`} />
                                                ) : (
                                                    <span className="grid h-full w-full place-items-center text-slate-400"><PackageOpen className="size-5" /></span>
                                                )}
                                                <span className="absolute inset-0 flex items-center justify-center bg-slate-950/45 text-white opacity-0 backdrop-blur-xs transition group-hover/thumb:opacity-100">
                                                    <Images className="size-4" />
                                                </span>
                                            </button>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <p className="font-bold text-slate-900">{product.name}</p>
                                                    <div className="flex items-center gap-1">
                                                        <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-black uppercase text-slate-600">ID</span>
                                                        {product.translations?.en?.name ? (
                                                            <span className="rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-black uppercase text-blue-600">EN</span>
                                                        ) : (
                                                            <span className="rounded border border-dashed border-slate-200 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-slate-400" title="Belum ada terjemahan English">EN</span>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="mt-1 flex items-center gap-2 text-xs font-semibold text-slate-500">
                                                    <span>{product.sku}</span>
                                                    <span>·</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => setMediaModalProduct(product)}
                                                        className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 hover:underline"
                                                    >
                                                        <Images className="size-3.5" />
                                                        {product.images_count} gambar
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-4 text-sm font-medium text-slate-600">{product.category || 'Tanpa kategori'}</td>
                                    <td className="px-4 py-4">
                                        <p className="text-sm font-extrabold text-slate-900">{currency(product.price, 'IDR')}</p>
                                        {product.price_usd !== null && product.price_usd !== undefined && (
                                            <p className="text-xs font-bold text-emerald-600">{currency(product.price_usd, 'USD')}</p>
                                        )}
                                        <p className="text-xs text-slate-400">Modal {currency(product.cost, 'IDR')}</p>
                                    </td>
                                    <td className="px-4 py-4">
                                        <span className={`text-sm font-black ${product.stock <= product.low_stock_threshold ? 'text-red-600' : 'text-slate-900'}`}>{product.stock}</span>
                                        <span className="ml-1 text-xs text-slate-500">unit</span>
                                    </td>
                                    <td className="px-4 py-4">
                                        <Badge variant="outline" className={product.is_discontinued ? 'border-amber-200 bg-amber-50 text-amber-700' : product.is_active ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-slate-50 text-slate-500'}>
                                            {product.is_discontinued ? 'Discontinue' : product.is_active ? 'Aktif' : 'Nonaktif'}
                                        </Badge>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex justify-end gap-2">
                                            {permissions.includes('products.update') && (
                                                <Button variant="outline" size="icon-sm" onClick={() => setMediaModalProduct(product)} title="Kelola gambar produk" aria-label="Kelola gambar produk">
                                                    <Images className="size-4 text-blue-600" />
                                                </Button>
                                            )}
                                            {permissions.includes('products.update') && (
                                                <Button variant="outline" size="icon-sm" onClick={() => openEdit(product)} title="Edit produk" aria-label="Edit produk"><Pencil /></Button>
                                            )}
                                            {permissions.includes('products.delete') && <DeleteProduct product={product} />}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {!products.length && (
                                <tr>
                                    <td colSpan="6" className="px-6 py-16 text-center">
                                        <PackageOpen className="mx-auto size-9 text-slate-300" />
                                        <p className="mt-3 text-sm font-semibold text-slate-600">Produk belum ditemukan.</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Dedicated Media Manager Dialog */}
            <Dialog open={!!mediaModalProduct} onOpenChange={(open) => !open && setMediaModalProduct(null)}>
                {mediaModalProduct && (
                    <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <Images className="size-5 text-blue-600" />
                                Kelola Gambar: {mediaModalProduct.name}
                            </DialogTitle>
                            <DialogDescription>
                                Atur foto katalog, tentukan gambar sampul utama, hapus foto usang, atau unggah foto tambahan.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-6">
                            {/* Current Images Gallery */}
                            <div>
                                <div className="mb-3 flex items-center justify-between">
                                    <h4 className="text-sm font-extrabold text-slate-900">
                                        Daftar Gambar ({mediaModalProduct.images?.length || 0})
                                    </h4>
                                    <span className="text-xs text-slate-500">
                                        Gambar dengan badge <strong>Utama</strong> akan menjadi foto sampul toko.
                                    </span>
                                </div>

                                {mediaModalProduct.images?.length > 0 ? (
                                    <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3">
                                        {mediaModalProduct.images.map((img) => (
                                            <div key={img.id} className={`group relative overflow-hidden rounded-2xl border-2 bg-slate-50 shadow-2xs transition ${img.is_primary ? 'border-blue-600 ring-2 ring-blue-500/20' : 'border-slate-200 hover:border-slate-300'}`}>
                                                <div className="aspect-square overflow-hidden bg-slate-100">
                                                    <img src={img.url} alt="" className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
                                                </div>

                                                {img.is_primary && (
                                                    <span className="absolute left-2.5 top-2.5 inline-flex items-center gap-1 rounded-full bg-blue-600 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-white shadow-md">
                                                        <Star className="size-3 fill-white" /> Utama
                                                    </span>
                                                )}

                                                <div className="p-2.5">
                                                    <p className="truncate text-xs font-bold text-slate-800">{img.file_name}</p>
                                                    <p className="text-[11px] text-slate-400">{img.size}</p>

                                                    <div className="mt-2.5 flex items-center gap-1.5 border-t border-slate-100 pt-2">
                                                        {!img.is_primary && (
                                                            <Button
                                                                type="button"
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => handleSetPrimaryMedia(mediaModalProduct.id, img.id)}
                                                                className="h-8 flex-1 text-xs font-bold hover:border-blue-500 hover:text-blue-600"
                                                            >
                                                                <Star className="size-3.5" /> Jadikan Utama
                                                            </Button>
                                                        )}
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            size="icon-sm"
                                                            onClick={() => handleDeleteMedia(mediaModalProduct.id, img.id)}
                                                            className="h-8 text-red-600 hover:border-red-300 hover:bg-red-50 hover:text-red-700"
                                                            title="Hapus gambar ini"
                                                            aria-label="Hapus gambar"
                                                        >
                                                            <Trash2 className="size-3.5" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="rounded-2xl border-2 border-dashed border-slate-200 py-12 text-center">
                                        <PackageOpen className="mx-auto size-10 text-slate-300" />
                                        <p className="mt-2 text-sm font-bold text-slate-700">Belum ada gambar</p>
                                        <p className="text-xs text-slate-500">Unggah gambar di bawah untuk memperkaya tampilan produk di toko.</p>
                                    </div>
                                )}
                            </div>

                            {/* Standalone Upload Box */}
                            <form onSubmit={handleStandaloneMediaUpload} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                                <h4 className="text-sm font-extrabold text-slate-900">Unggah Gambar Tambahan</h4>
                                <p className="mt-0.5 text-xs text-slate-500">Format: JPG, PNG, WebP (maks. 4 MB per foto)</p>

                                <label className="mt-3 flex cursor-pointer items-center justify-center gap-3 rounded-xl border-2 border-dashed border-slate-300 bg-white px-4 py-6 text-sm font-semibold text-slate-600 transition hover:border-blue-400 hover:bg-blue-50/50">
                                    <Upload className="size-5 text-blue-600" />
                                    {mediaUploadFiles.length ? `${mediaUploadFiles.length} foto baru dipilih` : 'Pilih file dari komputer...'}
                                    <input
                                        type="file"
                                        accept="image/jpeg,image/png,image/webp"
                                        multiple
                                        className="sr-only"
                                        onChange={(e) => setMediaUploadFiles(Array.from(e.target.files))}
                                    />
                                </label>

                                {mediaUploadFiles.length > 0 && (
                                    <div className="mt-3 flex items-center justify-between">
                                        <p className="text-xs font-semibold text-slate-600">
                                            {mediaUploadFiles.length} file siap diunggah
                                        </p>
                                        <div className="flex gap-2">
                                            <Button type="button" variant="outline" size="sm" onClick={() => setMediaUploadFiles([])}>
                                                Batal
                                            </Button>
                                            <Button type="submit" size="sm" disabled={mediaUploading} className="bg-blue-600 hover:bg-blue-700">
                                                {mediaUploading ? <LoaderCircle className="size-4 animate-spin" /> : <Upload className="size-4" />}
                                                Unggah Sekarang
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </form>
                        </div>

                        <DialogFooter className="mt-4">
                            <Button type="button" variant="outline" onClick={() => setMediaModalProduct(null)}>
                                Selesai
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                )}
            </Dialog>

            {/* Create & Edit Product Dialog */}
            <Dialog open={modalOpen} onOpenChange={setModalOpen}>
                <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>{editing ? 'Edit produk' : 'Tambah produk baru'}</DialogTitle>
                        <DialogDescription>
                            {editing ? 'Perbarui informasi katalog, gambar, dan multibahasa. Perubahan stok dilakukan dari menu Inventory.' : 'Isi informasi produk multibahasa dan unggah gambar produk.'}
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={submit} className="space-y-5">
                        {/* Language Selection Tabs */}
                        <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-3.5">
                            <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="grid size-7 place-items-center rounded-lg bg-blue-100 text-blue-600">
                                        <Globe2 className="size-4" />
                                    </span>
                                    <div>
                                        <p className="text-xs font-bold text-slate-800">Bahasa Konten Produk</p>
                                        <p className="text-[11px] text-slate-500">Pilih bahasa untuk mengisi nama & deskripsi</p>
                                    </div>
                                </div>
                                <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1 shadow-2xs">
                                    {supportedLocales.map((loc) => {
                                        const isSelected = activeLang === loc.value;
                                        const hasFilled = !!form.data.translations?.[loc.value]?.name?.trim();
                                        return (
                                            <button
                                                key={loc.value}
                                                type="button"
                                                onClick={() => setActiveLang(loc.value)}
                                                className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-black transition ${
                                                    isSelected
                                                        ? 'bg-blue-600 text-white shadow-xs'
                                                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                                                }`}
                                            >
                                                <span>{loc.short_label}</span>
                                                <span className={`text-[11px] font-medium ${isSelected ? 'text-blue-100' : 'text-slate-400'}`}>
                                                    · {loc.label}
                                                </span>
                                                {hasFilled && (
                                                    <span className={`size-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-blue-600'}`} />
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* Translatable Inputs */}
                        {activeLang === 'id' ? (
                            <div className="space-y-4">
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <Field label="Nama produk (Indonesia)" error={form.errors.name || form.errors['translations.id.name']}>
                                        <input
                                            value={form.data.translations?.id?.name ?? form.data.name}
                                            onChange={(e) => setTranslationField('id', 'name', e.target.value)}
                                            placeholder="Contoh: Aroma Diffuser Sora"
                                            className="app-field"
                                            required
                                        />
                                    </Field>
                                    <Field label="SKU" error={form.errors.sku}>
                                        <input
                                            value={form.data.sku}
                                            onChange={(e) => form.setData('sku', e.target.value.toUpperCase())}
                                            className="app-field"
                                            required
                                        />
                                    </Field>
                                </div>
                                <Field label="Deskripsi (Indonesia)" error={form.errors.description || form.errors['translations.id.description']}>
                                    <textarea
                                        value={form.data.translations?.id?.description ?? form.data.description}
                                        onChange={(e) => setTranslationField('id', 'description', e.target.value)}
                                        placeholder="Tulis deskripsi produk dalam Bahasa Indonesia..."
                                        rows="3"
                                        className="app-field resize-none"
                                    />
                                </Field>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between rounded-xl border border-blue-100 bg-blue-50/70 px-3.5 py-2.5 text-xs text-blue-900">
                                    <span>Konten English ditampilkan saat pengunjung memilih bahasa <strong>English (EN)</strong>.</span>
                                    <button
                                        type="button"
                                        onClick={copyFromIndonesian}
                                        className="inline-flex items-center gap-1.5 font-bold text-blue-700 hover:text-blue-900"
                                    >
                                        <Copy className="size-3.5" /> Salin dari ID
                                    </button>
                                </div>
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <Field label="Nama produk (English)" error={form.errors['translations.en.name']}>
                                        <input
                                            value={form.data.translations?.en?.name ?? ''}
                                            onChange={(e) => setTranslationField('en', 'name', e.target.value)}
                                            placeholder="Contoh: Sora Aroma Diffuser (opsional)"
                                            className="app-field"
                                        />
                                    </Field>
                                    <Field label="SKU" error={form.errors.sku}>
                                        <input
                                            value={form.data.sku}
                                            onChange={(e) => form.setData('sku', e.target.value.toUpperCase())}
                                            className="app-field"
                                            required
                                        />
                                    </Field>
                                </div>
                                <Field label="Deskripsi (English)" error={form.errors['translations.en.description']}>
                                    <textarea
                                        value={form.data.translations?.en?.description ?? ''}
                                        onChange={(e) => setTranslationField('en', 'description', e.target.value)}
                                        placeholder="Write product description in English (optional)..."
                                        rows="3"
                                        className="app-field resize-none"
                                    />
                                </Field>
                            </div>
                        )}

                        <Field label="Kategori" error={form.errors.category_id}>
                            <SearchSelect options={categoryOptions} value={form.data.category_id} onChange={(value) => form.setData('category_id', value)} placeholder="Cari kategori..." noOptionsMessage="Kategori tidak ditemukan" aria-label="Kategori produk" />
                        </Field>

                        <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 sm:p-5">
                            <div className="mb-3.5">
                                <span className="block text-sm font-extrabold text-slate-900">Penetapan Harga Produk (Multi-Mata Uang)</span>
                                <span className="text-xs text-slate-500">Tentukan harga jual produk dalam Rupiah (IDR) dan Dollar (USD). Storefront otomatis menampilkan harga sesuai mata uang toko yang aktif.</span>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <Field label="Harga jual Rupiah (IDR)" error={form.errors.price}>
                                    <div className="relative">
                                        <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">Rp</span>
                                        <input
                                            type="number"
                                            min="0"
                                            value={form.data.price}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                form.setData((prev) => {
                                                    const updates = { ...prev, price: val };
                                                    if (!prev.price_usd && val && Number(val) > 0) {
                                                        updates.price_usd = (Number(val) / 15000).toFixed(2);
                                                    }
                                                    return updates;
                                                });
                                            }}
                                            placeholder="150000"
                                            className="app-field pl-10 font-bold"
                                            required
                                        />
                                    </div>
                                    <span className="mt-1 block text-[11px] text-slate-400">Digunakan saat mata uang toko aktif dalam Rupiah (IDR).</span>
                                </Field>

                                <Field label="Harga jual Dollar (USD)" error={form.errors.price_usd}>
                                    <div className="relative">
                                        <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-emerald-600">$</span>
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={form.data.price_usd}
                                            onChange={(e) => form.setData('price_usd', e.target.value)}
                                            placeholder="10.00"
                                            className="app-field pl-8 font-bold"
                                        />
                                    </div>
                                    <span className="mt-1 block text-[11px] text-slate-400">Digunakan saat mata uang toko aktif dalam Dollar (USD).</span>
                                </Field>
                            </div>

                            <div className="mt-4 border-t border-slate-200/80 pt-3.5">
                                <Field label="Harga modal produk (IDR)" error={form.errors.cost}>
                                    <div className="relative">
                                        <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">Rp</span>
                                        <input
                                            type="number"
                                            min="0"
                                            value={form.data.cost}
                                            onChange={(e) => form.setData('cost', e.target.value)}
                                            placeholder="90000"
                                            className="app-field pl-10"
                                            required
                                        />
                                    </div>
                                    <span className="mt-1 block text-[11px] text-slate-400">Harga modal dasar perolehan untuk kalkulasi laba internal inventori.</span>
                                </Field>
                            </div>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            {!editing && (
                                <Field label="Stok awal" error={form.errors.stock}>
                                    <input type="number" min="0" value={form.data.stock} onChange={(e) => form.setData('stock', e.target.value)} className="app-field" required />
                                </Field>
                            )}
                            <Field label="Batas stok minimum" error={form.errors.low_stock_threshold}>
                                <input type="number" min="0" value={form.data.low_stock_threshold} onChange={(e) => form.setData('low_stock_threshold', e.target.value)} className="app-field" required />
                            </Field>
                        </div>

                        {/* Product Image Section */}
                        <div className="space-y-3">
                            <label className="block text-sm font-bold text-slate-700">
                                Gambar Produk
                            </label>

                            {/* Existing Images when Editing */}
                            {editing && editing.images?.length > 0 && (
                                <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5">
                                    <div className="mb-2.5 flex items-center justify-between">
                                        <p className="text-xs font-bold uppercase tracking-wider text-slate-600">
                                            Gambar Tersimpan ({editing.images.length})
                                        </p>
                                        <span className="text-[11px] text-slate-500">
                                            Klik tombol sampah untuk menandai hapus saat disimpan.
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                                        {editing.images.map((img) => {
                                            const isMarkedDelete = form.data.deleted_media_ids?.includes(img.id);
                                            const isPrimary = form.data.primary_media_id === img.id || (!form.data.primary_media_id && img.is_primary);

                                            return (
                                                <div key={img.id} className={`group relative overflow-hidden rounded-xl border-2 transition ${isMarkedDelete ? 'border-red-400 bg-red-50/50 opacity-60' : isPrimary ? 'border-blue-600 ring-2 ring-blue-500/20' : 'border-slate-200'}`}>
                                                    <div className="aspect-square overflow-hidden bg-slate-100">
                                                        <img src={img.url} alt="" className="h-full w-full object-cover" />
                                                    </div>

                                                    {isPrimary && !isMarkedDelete && (
                                                        <span className="absolute left-1.5 top-1.5 rounded-md bg-blue-600 px-1.5 py-0.5 text-[10px] font-black text-white shadow-xs">
                                                            Utama
                                                        </span>
                                                    )}

                                                    <button
                                                        type="button"
                                                        onClick={() => toggleMarkDeleteMedia(img.id)}
                                                        className={`absolute right-1.5 top-1.5 grid size-7 place-items-center rounded-lg shadow-sm transition ${isMarkedDelete ? 'bg-amber-600 text-white' : 'bg-red-600 text-white hover:bg-red-700'}`}
                                                        title={isMarkedDelete ? 'Batalkan hapus' : 'Tandai hapus'}
                                                    >
                                                        <Trash2 className="size-3.5" />
                                                    </button>

                                                    {!isMarkedDelete && !isPrimary && (
                                                        <button
                                                            type="button"
                                                            onClick={() => form.setData('primary_media_id', img.id)}
                                                            className="absolute bottom-1.5 inset-x-1.5 rounded-md bg-white/90 py-1 text-center text-[10px] font-extrabold text-slate-800 shadow-sm backdrop-blur-xs hover:bg-white"
                                                        >
                                                            Jadikan Utama
                                                        </button>
                                                    )}

                                                    {isMarkedDelete && (
                                                        <div className="absolute inset-0 grid place-items-center bg-red-950/50 p-2 text-center text-[11px] font-bold text-white">
                                                            Akan dihapus
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Previews of newly selected files */}
                            {selectedFilePreviews.length > 0 && (
                                <div className="rounded-xl border border-blue-200 bg-blue-50/40 p-3.5">
                                    <p className="mb-2.5 text-xs font-bold uppercase tracking-wider text-blue-900">
                                        Foto Baru Siap Diunggah ({selectedFilePreviews.length})
                                    </p>
                                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                                        {selectedFilePreviews.map((preview, idx) => (
                                            <div key={idx} className="relative aspect-square overflow-hidden rounded-xl border border-blue-300 bg-white shadow-2xs">
                                                <img src={preview.url} alt="" className="h-full w-full object-cover" />
                                                <button
                                                    type="button"
                                                    onClick={() => removeSelectedNewFile(idx)}
                                                    className="absolute right-1.5 top-1.5 grid size-6 place-items-center rounded-full bg-slate-900/80 text-white transition hover:bg-red-600"
                                                    title="Batalkan file ini"
                                                >
                                                    <X className="size-3.5" />
                                                </button>
                                                <span className="absolute bottom-1 inset-x-1 truncate rounded bg-slate-950/75 px-1 py-0.5 text-center text-[10px] text-white">
                                                    {preview.name}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* File Upload Trigger */}
                            <label className="flex cursor-pointer items-center justify-center gap-3 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm font-semibold text-slate-600 transition hover:border-blue-400 hover:bg-blue-50">
                                <ImagePlus className="size-5 text-blue-600" />
                                <span>{form.data.images.length ? `Pilih lagi / tambah foto...` : 'Pilih gambar produk (JPG, PNG, WebP · maks. 4 MB)'}</span>
                                <input
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp"
                                    multiple
                                    className="sr-only"
                                    onChange={(e) => {
                                        const newFiles = Array.from(e.target.files);
                                        const combined = [...(form.data.images || []), ...newFiles].slice(0, 8);
                                        form.setData('images', combined);
                                    }}
                                />
                            </label>
                            {form.errors.images && <p className="mt-1 text-xs text-red-600">{form.errors.images}</p>}
                        </div>

                        <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
                            <label className="flex items-center gap-3 text-sm font-semibold">
                                <input type="checkbox" checked={form.data.is_active} onChange={(e) => form.setData('is_active', e.target.checked)} className="app-checkbox" /> Produk aktif
                            </label>
                            <label className="flex items-start gap-3 text-sm font-semibold">
                                <input type="checkbox" checked={form.data.is_discontinued} onChange={(e) => form.setData('is_discontinued', e.target.checked)} className="app-checkbox mt-0.5" />
                                <span>
                                    <span className="block text-amber-800">Produk discontinue</span>
                                    <span className="mt-0.5 block text-xs font-normal leading-5 text-slate-500">Sembunyikan permanen dari storefront dan cegah customer melakukan pemesanan baru.</span>
                                </span>
                            </label>
                            {form.data.is_discontinued && <p className="rounded-lg bg-amber-100 px-3 py-2 text-xs font-semibold text-amber-900">Stok dan histori transaksi tetap tersimpan untuk audit.</p>}
                        </div>

                        {form.errors.is_discontinued && <p className="text-xs font-medium text-red-600">{form.errors.is_discontinued}</p>}

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Batal</Button>
                            <Button disabled={form.processing} className="bg-blue-600 hover:bg-blue-700">
                                {form.processing ? 'Menyimpan...' : 'Simpan produk'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </AuthenticatedLayout>
    );
}

function Field({ label, error, children }) {
    return (
        <label className="block">
            <span className="mb-1.5 block text-sm font-bold text-slate-700">{label}</span>
            {children}
            {error && <span className="mt-1 block text-xs font-medium text-red-600">{error}</span>}
        </label>
    );
}

function DeleteProduct({ product }) {
    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button variant="outline" size="icon-sm" className="text-red-600 hover:bg-red-50 hover:text-red-700" aria-label="Hapus produk">
                    <Trash2 />
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Hapus {product.name}?</AlertDialogTitle>
                    <AlertDialogDescription>Produk yang sudah memiliki riwayat stok akan dinonaktifkan agar audit tetap utuh.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Batal</AlertDialogCancel>
                    <AlertDialogAction onClick={() => router.delete(route('products.destroy', product.id))} className="bg-red-600 hover:bg-red-700">
                        Hapus produk
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
