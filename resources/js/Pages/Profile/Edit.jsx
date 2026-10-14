import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import CustomerAccountLayout from '@/Layouts/CustomerAccountLayout';
import { Head, usePage } from '@inertiajs/react';
import DeleteUserForm from './Partials/DeleteUserForm';
import UpdatePasswordForm from './Partials/UpdatePasswordForm';
import UpdateProfileInformationForm from './Partials/UpdateProfileInformationForm';

export default function Edit({ mustVerifyEmail, status }) {
    const { auth } = usePage().props;
    const isCustomer = auth.roles.includes('customer');
    const forms = <div className="grid gap-6 xl:grid-cols-2">
        <div className="border border-slate-200 bg-white p-5 shadow-sm sm:rounded-2xl sm:p-8 xl:row-span-2">
            <UpdateProfileInformationForm
                mustVerifyEmail={mustVerifyEmail}
                status={status}
            />
        </div>

        <div className="border border-slate-200 bg-white p-5 shadow-sm sm:rounded-2xl sm:p-8">
            <UpdatePasswordForm />
        </div>

        <div className="border border-red-100 bg-white p-5 shadow-sm sm:rounded-2xl sm:p-8">
            <DeleteUserForm />
        </div>
    </div>;

    if (isCustomer) {
        return <CustomerAccountLayout title="Profil Saya" description="Kelola identitas, alamat pengiriman, catatan checkout, dan keamanan akun Anda.">
            <Head title="Profil Saya" />
            {forms}
        </CustomerAccountLayout>;
    }

    return <AuthenticatedLayout title="Profil akun" eyebrow="Pengaturan akun">
        <Head title="Profil akun" />
        {forms}
    </AuthenticatedLayout>;
}
