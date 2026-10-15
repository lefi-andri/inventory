import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Transition } from '@headlessui/react';
import { Link, useForm, usePage } from '@inertiajs/react';
import { CheckCircle2 } from 'lucide-react';

export default function UpdateProfileInformation({
    mustVerifyEmail,
    status,
    className = '',
}) {
    const user = usePage().props.auth.user;

    const { data, setData, patch, errors, processing, recentlySuccessful } =
        useForm({
            name: user.name,
            email: user.email,
            phone: user.phone ?? '',
            shipping_address: user.shipping_address ?? '',
            checkout_notes: user.checkout_notes ?? '',
        });

    const submit = (e) => {
        e.preventDefault();

        patch(route('profile.update'));
    };

    return (
        <section className={className}>
            <header>
                <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                    Informasi profil dan pengiriman
                </h2>

                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    Perbarui data akun yang otomatis digunakan saat checkout.
                </p>

                {(recentlySuccessful || status === 'profile-updated') && (
                    <div className="mt-4 flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-900 shadow-xs animate-in fade-in duration-300">
                        <CheckCircle2 className="size-5 shrink-0 text-emerald-600" />
                        <div>
                            <p className="font-extrabold text-emerald-950">Berhasil diperbarui</p>
                            <p className="text-xs text-emerald-700">Informasi profil dan alamat pengiriman Anda telah berhasil disimpan.</p>
                        </div>
                    </div>
                )}
            </header>

            <form onSubmit={submit} className="mt-6 space-y-6">
                <div>
                    <InputLabel htmlFor="name" value="Nama lengkap" />

                    <TextInput
                        id="name"
                        className="mt-1 block w-full"
                        value={data.name}
                        onChange={(e) => setData('name', e.target.value)}
                        required
                        isFocused
                        autoComplete="name"
                    />

                    <InputError className="mt-2" message={errors.name} />
                </div>

                <div>
                    <InputLabel htmlFor="phone" value="Nomor telepon" />

                    <TextInput
                        id="phone"
                        type="tel"
                        className="mt-1 block w-full"
                        value={data.phone}
                        onChange={(e) => setData('phone', e.target.value)}
                        required
                        autoComplete="tel"
                    />

                    <InputError className="mt-2" message={errors.phone} />
                </div>

                <div>
                    <InputLabel htmlFor="shipping_address" value="Alamat lengkap" />

                    <textarea
                        id="shipping_address"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        value={data.shipping_address}
                        onChange={(e) => setData('shipping_address', e.target.value)}
                        rows="3"
                        required
                        autoComplete="street-address"
                    />

                    <InputError className="mt-2" message={errors.shipping_address} />
                </div>

                <div>
                    <InputLabel htmlFor="checkout_notes" value="Catatan checkout (opsional)" />

                    <textarea
                        id="checkout_notes"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        value={data.checkout_notes}
                        onChange={(e) => setData('checkout_notes', e.target.value)}
                        rows="2"
                        placeholder="Contoh: titipkan ke satpam"
                    />

                    <InputError className="mt-2" message={errors.checkout_notes} />
                </div>

                <div>
                    <InputLabel htmlFor="email" value="Email" />

                    <TextInput
                        id="email"
                        type="email"
                        className="mt-1 block w-full"
                        value={data.email}
                        onChange={(e) => setData('email', e.target.value)}
                        required
                        autoComplete="username"
                    />

                    <InputError className="mt-2" message={errors.email} />
                </div>

                {mustVerifyEmail && user.email_verified_at === null && (
                    <div>
                        <p className="mt-2 text-sm text-gray-800 dark:text-gray-200">
                            Alamat email Anda belum diverifikasi.{' '}
                            <Link
                                href={route('verification.send')}
                                method="post"
                                as="button"
                                className="rounded-md text-sm text-gray-600 underline hover:text-gray-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:text-gray-400 dark:hover:text-gray-100 dark:focus:ring-offset-gray-800"
                            >
                                Kirim ulang email verifikasi.
                            </Link>
                        </p>

                        {status === 'verification-link-sent' && (
                            <div className="mt-2 text-sm font-medium text-green-600 dark:text-green-400">
                                Tautan verifikasi baru sudah dikirim ke email Anda.
                            </div>
                        )}
                    </div>
                )}

                <div className="flex items-center gap-4">
                    <PrimaryButton disabled={processing}>
                        {processing ? 'Menyimpan...' : 'Simpan'}
                    </PrimaryButton>

                    <Transition
                        show={recentlySuccessful}
                        enter="transition ease-in-out duration-300"
                        enterFrom="opacity-0 translate-x-2"
                        leave="transition ease-in-out duration-300"
                        leaveTo="opacity-0"
                    >
                        <span className="flex items-center gap-1.5 text-sm font-bold text-emerald-600">
                            <CheckCircle2 className="size-4" />
                            Tersimpan.
                        </span>
                    </Transition>
                </div>
            </form>
        </section>
    );
}
