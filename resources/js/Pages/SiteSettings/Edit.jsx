import { Button } from '@/Components/ui/button';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm } from '@inertiajs/react';
import {
    ArrowDown, ArrowUp, ArrowUpRight, Check, Cookie, FileText, ImagePlus, Link2, Palette, Plus,
    RotateCcw, Save, ShieldCheck, ShoppingBag, Sparkles, Trash2, Upload
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { applyTheme, DEFAULT_THEME_COLOR, THEME_PRESETS } from '@/lib/theme';

const newLink = () => ({ label: '', url: '', is_active: true });

export default function SiteSettingsEdit({ settings, defaultTemplates }) {
    const [logoPreview, setLogoPreview] = useState(settings.logo || '');
    const [faviconPreview, setFaviconPreview] = useState(settings.favicon || '');
    const form = useForm({
        brand_name: settings.brand_name || '',
        theme_color: settings.theme_color || DEFAULT_THEME_COLOR,
        logo: null,
        remove_logo: false,
        favicon: null,
        remove_favicon: false,
        navbar_links: settings.navbar_links || [],
        footer_description: settings.footer_description || '',
        footer_copyright: settings.footer_copyright || '',
        footer_links: settings.footer_links || [],
        cookie_consent_enabled: settings.cookie_consent_enabled ?? true,
        cookie_consent_title: settings.cookie_consent_title || defaultTemplates?.cookie_consent_title || '',
        cookie_consent_message: settings.cookie_consent_message || defaultTemplates?.cookie_consent_message || '',
        privacy_policy_title: settings.privacy_policy_title || defaultTemplates?.privacy_policy_title || '',
        privacy_policy_content: settings.privacy_policy_content || defaultTemplates?.privacy_policy_content || '',
        cookie_policy_title: settings.cookie_policy_title || defaultTemplates?.cookie_policy_title || '',
        cookie_policy_content: settings.cookie_policy_content || defaultTemplates?.cookie_policy_content || '',
    });

    useEffect(() => () => {
        if (logoPreview?.startsWith('blob:')) URL.revokeObjectURL(logoPreview);
        if (faviconPreview?.startsWith('blob:')) URL.revokeObjectURL(faviconPreview);
    }, [logoPreview, faviconPreview]);

    useEffect(() => {
        if (!form.data.logo && !form.data.remove_logo) {
            setLogoPreview(settings.logo || '');
        }
    }, [settings.logo]);

    useEffect(() => {
        if (!form.data.favicon && !form.data.remove_favicon) {
            setFaviconPreview(settings.favicon || '');
        }
    }, [settings.favicon]);

    useEffect(() => {
        form.setData((prev) => ({
            ...prev,
            brand_name: settings.brand_name || '',
            theme_color: settings.theme_color || DEFAULT_THEME_COLOR,
            navbar_links: settings.navbar_links || [],
            footer_description: settings.footer_description || '',
            footer_copyright: settings.footer_copyright || '',
            footer_links: settings.footer_links || [],
            cookie_consent_enabled: settings.cookie_consent_enabled ?? true,
            cookie_consent_title: settings.cookie_consent_title || defaultTemplates?.cookie_consent_title || '',
            cookie_consent_message: settings.cookie_consent_message || defaultTemplates?.cookie_consent_message || '',
            privacy_policy_title: settings.privacy_policy_title || defaultTemplates?.privacy_policy_title || '',
            privacy_policy_content: settings.privacy_policy_content || defaultTemplates?.privacy_policy_content || '',
            cookie_policy_title: settings.cookie_policy_title || defaultTemplates?.cookie_policy_title || '',
            cookie_policy_content: settings.cookie_policy_content || defaultTemplates?.cookie_policy_content || '',
        }));
    }, [
        settings.brand_name,
        settings.theme_color,
        settings.navbar_links,
        settings.footer_description,
        settings.footer_copyright,
        settings.footer_links,
        settings.cookie_consent_enabled,
        settings.cookie_consent_title,
        settings.cookie_consent_message,
        settings.privacy_policy_title,
        settings.privacy_policy_content,
        settings.cookie_policy_title,
        settings.cookie_policy_content,
    ]);

    // Live preview theme color changes in real-time
    useEffect(() => {
        if (form.data.theme_color) {
            applyTheme(form.data.theme_color);
        }
    }, [form.data.theme_color]);

    // Revert to saved theme if unmounting without saving
    useEffect(() => {
        return () => {
            applyTheme(settings.theme_color || DEFAULT_THEME_COLOR);
        };
    }, [settings.theme_color]);

    const chooseLogo = (event) => {
        const logo = event.target.files?.[0] || null;
        form.setData((data) => ({ ...data, logo, remove_logo: false }));
        if (logo) setLogoPreview(URL.createObjectURL(logo));
    };

    const removeLogo = () => {
        form.setData((data) => ({ ...data, logo: null, remove_logo: true }));
        setLogoPreview('');
    };

    const chooseFavicon = (event) => {
        const favicon = event.target.files?.[0] || null;
        form.setData((data) => ({ ...data, favicon, remove_favicon: false }));
        if (favicon) setFaviconPreview(URL.createObjectURL(favicon));
    };

    const removeFavicon = () => {
        form.setData((data) => ({ ...data, favicon: null, remove_favicon: true }));
        setFaviconPreview('');
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
        const hasFiles = Boolean(form.data.logo || form.data.favicon);
        if (hasFiles) {
            form.transform((data) => ({ ...data, _method: 'patch' }));
            form.post(route('admin.site-settings.update'), {
                forceFormData: true,
                queryStringArrayFormat: 'indices',
                preserveScroll: true,
                onSuccess: () => form.reset('logo', 'remove_logo', 'favicon', 'remove_favicon'),
            });
        } else {
            form.transform((data) => {
                const { logo, favicon, ...rest } = data;
                return rest;
            });
            form.patch(route('admin.site-settings.update'), {
                preserveScroll: true,
                onSuccess: () => form.reset('logo', 'remove_logo', 'favicon', 'remove_favicon'),
            });
        }
    };

    return (
        <AuthenticatedLayout title="Navbar, Footer & Logo" eyebrow="Identitas dan navigasi situs">
            <Head title="Pengaturan Tampilan Situs" />
            <form onSubmit={submit} className="space-y-6">
                <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                    <div className="border-b border-slate-100 pb-5">
                        <h2 className="text-lg font-extrabold">Identitas brand & icon situs</h2>
                        <p className="mt-1 text-sm text-slate-500">Logo, favicon tab browser, dan nama brand digunakan di storefront, halaman autentikasi, akun customer, dan dashboard admin.</p>
                    </div>
                    <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-[200px_200px_1fr]">
                        <div>
                            <span className="mb-2 block text-sm font-bold text-slate-700">Logo Website</span>
                            <div className="grid aspect-square max-w-[200px] place-items-center overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                <PreviewLogo src={logoPreview} className="size-20 rounded-2xl" iconClassName="size-8" />
                            </div>
                            <div className="mt-3 flex flex-wrap gap-2">
                                <Button type="button" variant="outline" asChild className="cursor-pointer rounded-xl"><label><Upload /> Pilih logo<input type="file" accept="image/jpeg,image/png,image/webp" onChange={chooseLogo} className="sr-only" /></label></Button>
                                {(logoPreview || settings.logo) && <Button type="button" variant="outline" onClick={removeLogo} className="rounded-xl text-red-600"><Trash2 /> Hapus</Button>}
                            </div>
                            {form.errors.logo && <p className="mt-2 text-xs font-semibold text-red-600">{form.errors.logo}</p>}
                            <p className="mt-2 text-xs leading-5 text-slate-500">PNG atau WebP transparan direkomendasikan. Maksimal 4 MB.</p>
                        </div>

                        <div>
                            <span className="mb-2 block text-sm font-bold text-slate-700">Favicon Browser</span>
                            <div className="grid aspect-square max-w-[200px] place-items-center overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                {faviconPreview ? (
                                    <img src={faviconPreview} alt="Favicon preview" className="size-14 rounded-xl object-contain shadow-sm" />
                                ) : (
                                    <div className="grid size-14 place-items-center rounded-xl border border-dashed border-slate-300 bg-white text-slate-400">
                                        <ShoppingBag className="size-6" />
                                    </div>
                                )}
                            </div>
                            <div className="mt-3 flex flex-wrap gap-2">
                                <Button type="button" variant="outline" asChild className="cursor-pointer rounded-xl"><label><Upload /> Pilih favicon<input type="file" accept="image/x-icon,image/png,image/svg+xml,image/webp,image/jpeg,.ico,.png,.svg" onChange={chooseFavicon} className="sr-only" /></label></Button>
                                {(faviconPreview || settings.favicon) && <Button type="button" variant="outline" onClick={removeFavicon} className="rounded-xl text-red-600"><Trash2 /> Hapus</Button>}
                            </div>
                            {form.errors.favicon && <p className="mt-2 text-xs font-semibold text-red-600">{form.errors.favicon}</p>}
                            <p className="mt-2 text-xs leading-5 text-slate-500">ICO, PNG, atau SVG (rasio 1:1, misal 32x32 atau 64x64 px). Maksimal 2 MB.</p>
                        </div>

                        <div className="space-y-4">
                            <Field label="Nama brand" error={form.errors.brand_name}><input value={form.data.brand_name} onChange={(event) => form.setData('brand_name', event.target.value)} className="app-field" placeholder="Nama toko" required /></Field>

                            {/* Browser tab mockup preview */}
                            <div className="rounded-2xl border border-slate-200 bg-slate-100/80 p-4">
                                <p className="text-[11px] font-black uppercase tracking-[.16em] text-slate-500">Preview tab browser</p>
                                <div className="mt-2.5 flex items-center gap-2">
                                    <div className="flex gap-1">
                                        <div className="size-2 rounded-full bg-red-400" />
                                        <div className="size-2 rounded-full bg-amber-400" />
                                        <div className="size-2 rounded-full bg-emerald-400" />
                                    </div>
                                    <div className="flex max-w-[280px] items-center gap-2 rounded-lg bg-white px-3 py-1.5 shadow-sm text-xs font-semibold text-slate-800 border border-slate-200/60">
                                        {faviconPreview ? (
                                            <img src={faviconPreview} alt="" className="size-4 shrink-0 rounded object-contain" />
                                        ) : (
                                            <ShoppingBag className="size-4 shrink-0 text-blue-600" />
                                        )}
                                        <span className="truncate">{form.data.brand_name || 'Stokara'} - Toko</span>
                                    </div>
                                </div>
                            </div>

                            {/* Brand header preview */}
                            <div className="rounded-2xl border border-blue-100 bg-blue-50/70 p-4">
                                <p className="text-[11px] font-black uppercase tracking-[.16em] text-blue-600">Preview header brand</p>
                                <div className="mt-2 flex items-center gap-3">
                                    <PreviewLogo src={logoPreview} />
                                    <span className="text-lg font-black tracking-tight text-slate-900">{form.data.brand_name || 'Nama brand'}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <ThemeColorSection
                    themeColor={form.data.theme_color}
                    onChange={(color) => {
                        form.setData('theme_color', color);
                        applyTheme(color);
                    }}
                    error={form.errors.theme_color}
                    presets={settings.theme_presets || THEME_PRESETS}
                />

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

                {/* Section: Cookie Consent & Kebijakan Data Pribadi */}
                <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                    <div className="border-b border-slate-100 pb-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="grid size-8 place-items-center rounded-xl bg-blue-50 text-blue-600">
                                    <ShieldCheck className="size-4" />
                                </span>
                                <h2 className="text-lg font-extrabold text-slate-900">Perlindungan Data & Cookie Consent</h2>
                            </div>
                            <p className="mt-1 text-sm text-slate-500">
                                Atur banner persetujuan cookie serta teks hukum Kebijakan Privasi dan Kebijakan Cookie untuk kepatuhan regulasi (UU PDP & GDPR).
                            </p>
                        </div>

                        <div className="flex items-center gap-2">
                            <a
                                href={route('privacy-policy')}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
                            >
                                <span>Lihat Privasi</span>
                                <ArrowUpRight className="size-3.5 text-slate-400" />
                            </a>
                            <a
                                href={route('cookie-policy')}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
                            >
                                <span>Lihat Cookie</span>
                                <ArrowUpRight className="size-3.5 text-slate-400" />
                            </a>
                        </div>
                    </div>

                    {/* Cookie Banner Settings */}
                    <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5 space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <span className="grid size-9 place-items-center rounded-xl bg-white text-blue-600 shadow-xs">
                                    <Cookie className="size-4" />
                                </span>
                                <div>
                                    <span className="font-extrabold text-slate-900 text-sm">Banner Persetujuan Cookie (Consent Banner)</span>
                                    <p className="text-xs text-slate-500">Tampilkan banner melayang di bawah layar saat pengunjung membuka situs.</p>
                                </div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={form.data.cookie_consent_enabled}
                                    onChange={(e) => form.setData('cookie_consent_enabled', e.target.checked)}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                        </div>

                        {form.data.cookie_consent_enabled && (
                            <div className="grid gap-4 sm:grid-cols-2 pt-2 border-t border-slate-200/80">
                                <Field label="Judul Banner Cookie" error={form.errors.cookie_consent_title}>
                                    <input
                                        value={form.data.cookie_consent_title}
                                        onChange={(e) => form.setData('cookie_consent_title', e.target.value)}
                                        className="app-field"
                                        placeholder="Persetujuan Privasi & Cookie"
                                    />
                                </Field>
                                <div className="sm:col-span-2">
                                    <div className="flex items-center justify-between mb-1.5">
                                        <span className="text-sm font-bold text-slate-700">Pesan Banner Cookie</span>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => form.setData('cookie_consent_message', defaultTemplates?.cookie_consent_message || '')}
                                            className="text-xs font-semibold text-blue-600 hover:text-blue-700 h-auto p-0"
                                        >
                                            <RotateCcw className="size-3 mr-1" />
                                            Gunakan Pesan Standar
                                        </Button>
                                    </div>
                                    <textarea
                                        rows="2"
                                        value={form.data.cookie_consent_message}
                                        onChange={(e) => form.setData('cookie_consent_message', e.target.value)}
                                        className="app-field resize-none text-xs leading-5"
                                    />
                                    {form.errors.cookie_consent_message && <p className="mt-1 text-xs text-red-600">{form.errors.cookie_consent_message}</p>}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Kebijakan Privasi Editor */}
                    <div className="mt-6 space-y-3 rounded-2xl border border-slate-200 p-5">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 pb-3">
                            <div>
                                <h3 className="font-extrabold text-slate-900 flex items-center gap-2 text-base">
                                    <FileText className="size-4 text-blue-600" />
                                    Halaman Kebijakan Privasi (Privacy Policy)
                                </h3>
                                <p className="text-xs text-slate-500">Mencakup penjelasan hak subjek data, dasar hukum UU PDP, serta kontak pengendali data.</p>
                            </div>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    form.setData((prev) => ({
                                        ...prev,
                                        privacy_policy_title: defaultTemplates?.privacy_policy_title || 'Kebijakan Privasi',
                                        privacy_policy_content: defaultTemplates?.privacy_policy_content || '',
                                    }));
                                }}
                                className="rounded-xl text-xs font-bold text-blue-600 hover:bg-blue-50"
                            >
                                <RotateCcw className="size-3.5 mr-1.5" />
                                Muat Template Standar UU PDP
                            </Button>
                        </div>

                        <Field label="Judul Halaman" error={form.errors.privacy_policy_title}>
                            <input
                                value={form.data.privacy_policy_title}
                                onChange={(e) => form.setData('privacy_policy_title', e.target.value)}
                                className="app-field font-bold"
                                placeholder="Kebijakan Privasi"
                            />
                        </Field>

                        <Field label="Konten Kebijakan Privasi (Markdown didukung)" error={form.errors.privacy_policy_content}>
                            <textarea
                                rows="12"
                                value={form.data.privacy_policy_content}
                                onChange={(e) => form.setData('privacy_policy_content', e.target.value)}
                                className="app-field font-mono text-xs leading-6 resize-y"
                                placeholder="Isi teks kebijakan privasi..."
                            />
                        </Field>
                    </div>

                    {/* Kebijakan Cookie Editor */}
                    <div className="mt-6 space-y-3 rounded-2xl border border-slate-200 p-5">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 pb-3">
                            <div>
                                <h3 className="font-extrabold text-slate-900 flex items-center gap-2 text-base">
                                    <Cookie className="size-4 text-blue-600" />
                                    Halaman Kebijakan Cookie (Cookie Policy)
                                </h3>
                                <p className="text-xs text-slate-500">Mencakup rincian cookie esensial, preferensi fungsional, dan opsi pengelolaan peramban.</p>
                            </div>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    form.setData((prev) => ({
                                        ...prev,
                                        cookie_policy_title: defaultTemplates?.cookie_policy_title || 'Kebijakan Cookie',
                                        cookie_policy_content: defaultTemplates?.cookie_policy_content || '',
                                    }));
                                }}
                                className="rounded-xl text-xs font-bold text-blue-600 hover:bg-blue-50"
                            >
                                <RotateCcw className="size-3.5 mr-1.5" />
                                Muat Template Standar Cookie
                            </Button>
                        </div>

                        <Field label="Judul Halaman" error={form.errors.cookie_policy_title}>
                            <input
                                value={form.data.cookie_policy_title}
                                onChange={(e) => form.setData('cookie_policy_title', e.target.value)}
                                className="app-field font-bold"
                                placeholder="Kebijakan Cookie"
                            />
                        </Field>

                        <Field label="Konten Kebijakan Cookie (Markdown didukung)" error={form.errors.cookie_policy_content}>
                            <textarea
                                rows="12"
                                value={form.data.cookie_policy_content}
                                onChange={(e) => form.setData('cookie_policy_content', e.target.value)}
                                className="app-field font-mono text-xs leading-6 resize-y"
                                placeholder="Isi teks kebijakan cookie..."
                            />
                        </Field>
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

function ThemeColorSection({ themeColor, onChange, error, presets = THEME_PRESETS }) {
    const [customColor, setCustomColor] = useState(themeColor || DEFAULT_THEME_COLOR);

    useEffect(() => {
        setCustomColor(themeColor || DEFAULT_THEME_COLOR);
    }, [themeColor]);

    const handleCustomChange = (e) => {
        const value = e.target.value;
        setCustomColor(value);
        if (/^#([a-f0-9]{6}|[a-f0-9]{3})$/i.test(value)) {
            onChange(value);
        }
    };

    const handleColorPickerChange = (e) => {
        const value = e.target.value;
        setCustomColor(value);
        onChange(value);
    };

    const handleReset = () => {
        onChange(DEFAULT_THEME_COLOR);
    };

    const isCustom = !presets.some((p) => p.color.toLowerCase() === (themeColor || '').toLowerCase());

    return (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="border-b border-slate-100 pb-5">
                <div className="flex items-start gap-3">
                    <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-600">
                        <Palette className="size-5" />
                    </span>
                    <div>
                        <h2 className="text-lg font-extrabold text-slate-950">Nuansa Warna Website</h2>
                        <p className="mt-1 text-sm text-slate-500">
                            Pilih skema warna utama untuk menentukan nuansa visual website. Warna ini otomatis diterapkan ke seluruh komponen: tombol, badge, link, aksen input, storefront, hingga dashboard admin.
                        </p>
                    </div>
                </div>
            </div>

            <div className="mt-6 space-y-6">
                <div>
                    <span className="mb-3 block text-xs font-black uppercase tracking-[.16em] text-slate-400">
                        Pilihan Palet Siap Pakai
                    </span>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                        {presets.map((preset) => {
                            const isSelected = (themeColor || '').toLowerCase() === preset.color.toLowerCase();
                            return (
                                <button
                                    key={preset.id}
                                    type="button"
                                    onClick={() => onChange(preset.color)}
                                    className={`group relative flex flex-col items-start gap-2.5 rounded-2xl border p-4 text-left transition-all ${
                                        isSelected
                                            ? 'border-blue-600 bg-blue-50/50 shadow-sm ring-2 ring-blue-600/30'
                                            : 'border-slate-200 bg-slate-50/60 hover:border-slate-300 hover:bg-slate-100/70'
                                    }`}
                                >
                                    <div className="flex w-full items-center justify-between">
                                        <span
                                            className="size-7 rounded-full shadow-md ring-2 ring-white"
                                            style={{ backgroundColor: preset.color }}
                                        />
                                        {isSelected && (
                                            <span className="grid size-5 place-items-center rounded-full bg-blue-600 text-white shadow-xs">
                                                <Check className="size-3 stroke-[3]" />
                                            </span>
                                        )}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-extrabold text-slate-900">{preset.name}</p>
                                        <p className="mt-0.5 line-clamp-2 text-[11px] leading-4 text-slate-500">{preset.description}</p>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <span className="block text-sm font-extrabold text-slate-900">Warna Kustom Sendiri</span>
                            <p className="mt-0.5 text-xs text-slate-500">
                                Gunakan pemilih warna (*color picker*) atau masukkan kode HEX warna brand Anda secara bebas.
                            </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-3">
                            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xs">
                                <label className="relative flex cursor-pointer items-center">
                                    <input
                                        type="color"
                                        value={/^#([a-f0-9]{6})$/i.test(customColor) ? customColor : DEFAULT_THEME_COLOR}
                                        onChange={handleColorPickerChange}
                                        className="size-8 cursor-pointer appearance-none rounded-lg border-0 bg-transparent p-0"
                                    />
                                </label>
                                <input
                                    type="text"
                                    value={customColor}
                                    onChange={handleCustomChange}
                                    placeholder="#2563eb"
                                    maxLength={7}
                                    className="h-8 w-24 border-0 p-1 font-mono text-xs font-bold uppercase text-slate-800 outline-none focus:ring-0"
                                />
                            </div>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleReset}
                                className="h-11 rounded-xl text-xs font-bold"
                                title="Kembalikan ke warna bawaan (Biru Safir)"
                            >
                                <RotateCcw className="size-3.5" /> Reset Default
                            </Button>
                        </div>
                    </div>
                    {isCustom && (
                        <p className="mt-3 text-xs font-semibold text-blue-600">
                            ✨ Warna kustom aktif: <span className="font-mono">{themeColor}</span>
                        </p>
                    )}
                    {error && <p className="mt-2 text-xs font-semibold text-red-600">{error}</p>}
                </div>

                <div>
                    <span className="mb-2.5 block text-xs font-black uppercase tracking-[.16em] text-slate-400">
                        Pratinjau Komponen Langsung (Live Preview)
                    </span>
                    <div className="grid gap-4 rounded-2xl border border-blue-100 bg-blue-50/60 p-5 sm:grid-cols-2 lg:grid-cols-4 lg:items-center">
                        <div className="space-y-1.5">
                            <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">Tombol Aksi</span>
                            <div className="flex flex-wrap gap-2">
                                <Button type="button" className="rounded-xl bg-blue-600 text-white shadow-sm hover:bg-blue-700">
                                    Tombol Utama
                                </Button>
                                <Button type="button" variant="outline" className="rounded-xl border-blue-600 text-blue-600 hover:bg-blue-50">
                                    Sekunder
                                </Button>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">Badge & Label</span>
                            <div className="flex flex-wrap gap-2">
                                <span className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700">
                                    <Sparkles className="size-3 text-blue-600" /> Diskon 20%
                                </span>
                                <span className="inline-flex items-center rounded-lg bg-blue-600 px-2.5 py-1 text-xs font-extrabold text-white">
                                    Aktif
                                </span>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">Fokus Input</span>
                            <input
                                type="text"
                                readOnly
                                value="Aksen border input aktif"
                                className="h-10 w-full rounded-xl border border-blue-500 bg-white px-3 text-xs font-medium text-slate-700 shadow-xs ring-2 ring-blue-500/20 outline-none"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">Tautan & Ikon</span>
                            <div className="flex items-center gap-3">
                                <span className="grid size-9 place-items-center rounded-xl bg-blue-600 text-white shadow-xs">
                                    <ShoppingBag className="size-4" />
                                </span>
                                <span className="text-sm font-black text-blue-600 underline decoration-2 underline-offset-4 cursor-pointer">
                                    Katalog Belanja
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
