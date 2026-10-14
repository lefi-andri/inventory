import { Link, usePage } from '@inertiajs/react';
import { AlertTriangle, ArrowRight } from 'lucide-react';

export default function ProfileCompletionNotice({ className = '' }) {
    const { auth } = usePage().props;
    const user = auth?.user;
    const isCustomer = auth?.roles?.includes('customer');
    const onProfilePage = route().current('profile.edit');
    const missingFields = [
        !user?.phone?.trim() && 'nomor telepon',
        !user?.shipping_address?.trim() && 'alamat pengiriman',
    ].filter(Boolean);

    if (!user || !isCustomer || missingFields.length === 0) {
        return null;
    }

    return (
        <div className={`rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-950 shadow-sm sm:flex sm:items-center sm:justify-between sm:gap-5 ${className}`} role="alert">
            <div className="flex items-start gap-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-amber-100 text-amber-700">
                    <AlertTriangle className="size-5" />
                </span>
                <div>
                    <p className="font-extrabold">Lengkapi data diri Anda</p>
                    <p className="mt-1 text-sm leading-6 text-amber-800">
                        Tambahkan {missingFields.join(' dan ')} agar proses checkout dan pengiriman lebih cepat.
                    </p>
                </div>
            </div>

            {!onProfilePage && (
                <Link href={route('profile.edit')} className="mt-3 inline-flex shrink-0 items-center gap-2 rounded-xl bg-amber-900 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-amber-800 sm:mt-0">
                    Lengkapi sekarang <ArrowRight className="size-4" />
                </Link>
            )}
        </div>
    );
}
