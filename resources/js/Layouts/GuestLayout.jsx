import BrandLogo from '@/Components/BrandLogo';
import { Link, usePage } from '@inertiajs/react';

export default function GuestLayout({ children }) {
    const { site } = usePage().props;

    return (
        <div className="flex min-h-screen flex-col items-center bg-slate-100 px-4 pt-6 sm:justify-center sm:pt-0">
            <div>
                <Link href={route('storefront')} className="flex flex-col items-center gap-3">
                    <BrandLogo className="size-20 rounded-3xl shadow-lg" iconClassName="size-9" imageClassName="p-2" />
                    <span className="text-xl font-black tracking-tight text-slate-950">{site.brand_name}</span>
                </Link>
            </div>

            <div className="mt-6 w-full overflow-hidden rounded-2xl border border-slate-200 bg-white px-6 py-6 shadow-xl shadow-slate-200/60 sm:max-w-md">
                {children}
            </div>
        </div>
    );
}
