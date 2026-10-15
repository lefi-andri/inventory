import { Button } from '@/Components/ui/button';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm } from '@inertiajs/react';
import { ArrowDown, ArrowUp, ImagePlus, Link2, Plus, Save, ShoppingBag, Trash2, Upload } from 'lucide-react';
import { useEffect, useState } from 'react';

const newLink = () => ({ label: '', url: '', is_active: true });

export default function SiteSettingsEdit({ settings }) {
    const [logoPreview, setLogoPreview] = useState(settings.logo || '');
    const form = useForm({
        brand_name: settings.brand_name,
        logo: null,
        remove_logo: false,
        navbar_links: settings.navbar_links || [],
        footer_description: settings.footer_description || '',
        footer_copyright: settings.footer_copyright || '',
        footer_links: settings.footer_links || [],
    });

    useEffect(() => () => {
        if (logoPreview?.startsWith('blob:')) URL.revokeObjectURL(logoPreview);
    }, [logoPreview]);

    useEffect(() => {
        if (!form.data.logo && !form.data.remove_logo) {
            setLogoPreview(settings.logo || '');
        }
    }, [settings.logo]);

    const chooseLogo = (event) => {
        const logo = event.target.files?.[0] || null;
        form.setData((data) => ({ ...data, logo, remove_logo: false }));
        if (logo) setLogoPreview(URL.createObjectURL(logo));
    };

    const removeLogo = () => {
        form.setData((data) => ({ ...data, logo: null, remove_logo: true }));
        setLogoPreview('');
    };

    const updateLink = (field, index, key, value) => {
        form.setData(field, form.data[field].map((link, currentIndex) => currentIndex === index ? { ...link, [key]: value } : link));
    };

    const addLink = (field) => form.setData(field, [...form.data[field], newLink()]);
    const deleteLink = (field, index) => form.setData(field, form.data[field].filter((_, currentIndex) => currentIndex !== index));
    const moveLink = (field, index, direction) => {
        const destination = index + direction;
        if (destination < 0 || destination >= form.data[field].length) return;
        const links = [...form.data[field]];
        [links[index], links[destination]] = [links[destination], links[index]];
        form.setData(field, links);
    };

    const submit = (event) => {
        event.preventDefault();
        form.transform((data) => ({ ...data, _method: 'patch' }))
            .post(route('admin.site-settings.update'), {
                forceFormData: true,
                preserveScroll: true,
                onSuccess: () => form.reset('logo', 'remove_logo'),
            });
    };

    return (
        <AuthenticatedLayout title="Navbar, Footer & Logo" eyebrow="Identitas dan navigasi situs">
            <Head title="Pengaturan Tampilan Situs" />
            <form onSubmit={submit} className="space-y-6">
                <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                    <div className="border-b border-slate-100 pb-5"><h2 className="text-lg font-extrabold">Identitas brand</h2><p className="mt-1 text-sm text-slate-500">Logo dan nama ini otomatis digunakan di storefront, halaman autentikasi, akun customer, dan dashboard admin.</p></div>
                    <div className="mt-6 grid gap-6 lg:grid-cols-[220px_1fr]">
                        <div>
                            <span className="mb-2 block text-sm font-bold text-slate-700">Logo</span>
                            <div className="grid aspect-square max-w-[220px] place-items-center overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-5">
                                <PreviewLogo src={logoPreview} className="size-24 rounded-3xl" iconClassName="size-10" />
                            </div>
                            <div className="mt-3 flex flex-wrap gap-2">
                                <Button type="button" variant="outline" asChild className="cursor-pointer rounded-xl"><label><Upload /> Pilih logo<input type="file" accept="image/jpeg,image/png,image/webp" onChange={chooseLogo} className="sr-only" /></label></Button>
                                {(logoPreview || settings.logo) && <Button type="button" variant="outline" onClick={removeLogo} className="rounded-xl text-red-600"><Trash2 /> Hapus</Button>}
                            </div>
                            {form.errors.logo && <p className="mt-2 text-xs font-semibold text-red-600">{form.errors.logo}</p>}
                            <p className="mt-2 text-xs leading-5 text-slate-500">PNG atau WebP transparan direkomendasikan. Maksimal 4 MB.</p>
                        </div>
                        <div className="space-y-5">
                            <Field label="Nama brand" error={form.errors.brand_name}><input value={form.data.brand_name} onChange={(event) => form.setData('brand_name', event.target.value)} className="app-field" placeholder="Nama toko" required /></Field>
                            <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5"><p className="text-xs font-black uppercase tracking-[.16em] text-blue-600">Preview sederhana</p><div className="mt-4 flex items-center gap-3"><PreviewLogo src={logoPreview} /><span className="text-xl font-black tracking-tight">{form.data.brand_name || 'Nama brand'}</span></div></div>
                        </div>
                    </div>
                </section>

                <LinkSection
                    title="Menu navbar"
                    description="Tautan aktif ditampilkan berurutan di navbar desktop dan menu mobile storefront. Gunakan #produk untuk menuju bagian produk."
                    field="navbar_links"
                    links={form.data.navbar_links}
                    errors={form.errors}
                    onAdd={addLink}
                    onUpdate={updateLink}
                    onDelete={deleteLink}
                    onMove={moveLink}
                />

                <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                    <div className="border-b border-slate-100 pb-5"><h2 className="text-lg font-extrabold">Konten footer</h2><p className="mt-1 text-sm text-slate-500">Atur deskripsi singkat, teks hak cipta, dan tautan tambahan pada bagian bawah storefront.</p></div>
                    <div className="mt-6 grid gap-5 lg:grid-cols-2"><Field label="Deskripsi footer" error={form.errors.footer_description}><textarea rows="3" value={form.data.footer_description} onChange={(event) => form.setData('footer_description', event.target.value)} className="app-field resize-none" /></Field><Field label="Teks hak cipta" error={form.errors.footer_copyright}><textarea rows="3" value={form.data.footer_copyright} onChange={(event) => form.setData('footer_copyright', event.target.value)} className="app-field resize-none" placeholder="© 2026 Nama Toko" /></Field></div>
                    <div className="mt-6 border-t border-slate-100 pt-6">
                        <LinkEditor field="footer_links" links={form.data.footer_links} errors={form.errors} onAdd={addLink} onUpdate={updateLink} onDelete={deleteLink} onMove={moveLink} emptyText="Belum ada tautan footer." />
                    </div>
                </section>

                <div className="sticky bottom-4 z-10 flex justify-end rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-xl backdrop-blur"><Button disabled={form.processing} className="h-11 rounded-xl bg-blue-600 px-6 hover:bg-blue-700"><Save /> {form.processing ? 'Menyimpan...' : 'Simpan perubahan'}</Button></div>
            </form>
        </AuthenticatedLayout>
    );
}

function LinkSection({ title, description, ...props }) {
    return <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"><div className="border-b border-slate-100 pb-5"><h2 className="text-lg font-extrabold">{title}</h2><p className="mt-1 text-sm text-slate-500">{description}</p></div><div className="mt-6"><LinkEditor {...props} /></div></section>;
}

function LinkEditor({ field, links, errors, onAdd, onUpdate, onDelete, onMove, emptyText = 'Belum ada menu navbar.' }) {
    return (
        <div>
            <div className="flex items-center justify-between gap-3"><div><h3 className="font-extrabold">Daftar tautan</h3><p className="mt-1 text-xs text-slate-500">Urutan dari atas ke bawah mengikuti tampilan situs.</p></div><Button type="button" variant="outline" onClick={() => onAdd(field)} className="rounded-xl"><Plus /> Tambah tautan</Button></div>
            <div className="mt-4 space-y-3">
                {links.map((link, index) => <div key={`${field}-${index}`} className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 md:grid-cols-[1fr_1.4fr_auto] md:items-start">
                    <Field label="Label" error={errors[`${field}.${index}.label`]}><input value={link.label} onChange={(event) => onUpdate(field, index, 'label', event.target.value)} className="app-field bg-white" placeholder="Tentang kami" required /></Field>
                    <Field label="Tautan" error={errors[`${field}.${index}.url`]}><div className="relative"><Link2 className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" /><input value={link.url} onChange={(event) => onUpdate(field, index, 'url', event.target.value)} className="app-field bg-white pl-9" placeholder="#produk atau https://..." required /></div></Field>
                    <div className="flex items-center gap-1 md:pt-7"><label className="mr-2 flex items-center gap-2 text-xs font-bold text-slate-600"><input type="checkbox" checked={link.is_active} onChange={(event) => onUpdate(field, index, 'is_active', event.target.checked)} className="app-checkbox" /> Aktif</label><Button type="button" variant="outline" size="icon-sm" onClick={() => onMove(field, index, -1)} disabled={index === 0} aria-label="Naikkan"><ArrowUp /></Button><Button type="button" variant="outline" size="icon-sm" onClick={() => onMove(field, index, 1)} disabled={index === links.length - 1} aria-label="Turunkan"><ArrowDown /></Button><Button type="button" variant="outline" size="icon-sm" onClick={() => onDelete(field, index)} className="text-red-600" aria-label="Hapus"><Trash2 /></Button></div>
                </div>)}
                {!links.length && <div className="rounded-2xl border border-dashed border-slate-300 px-5 py-10 text-center text-sm text-slate-500"><ImagePlus className="mx-auto mb-2 size-6 text-slate-300" />{emptyText}</div>}
            </div>
            {errors[field] && <p className="mt-2 text-xs font-semibold text-red-600">{errors[field]}</p>}
        </div>
    );
}

function Field({ label, error, children }) {
    return <label className="block"><span className="mb-1.5 block text-sm font-bold text-slate-700">{label}</span>{children}{error && <span className="mt-1 block text-xs font-semibold text-red-600">{error}</span>}</label>;
}

function PreviewLogo({ src, className = 'size-10 rounded-xl', iconClassName = 'size-5' }) {
    return <span className={`grid shrink-0 place-items-center overflow-hidden bg-blue-600 text-white ${className}`}>{src ? <img src={src} alt="Preview logo" className="h-full w-full bg-white object-contain p-1" /> : <ShoppingBag className={iconClassName} />}</span>;
}
