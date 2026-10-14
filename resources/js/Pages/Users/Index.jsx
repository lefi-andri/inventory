import { Badge } from '@/Components/ui/badge';
import { Button } from '@/Components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/Components/ui/dialog';
import SearchSelect from '@/Components/SearchSelect';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { shortDate } from '@/lib/format';
import { Head, useForm, usePage } from '@inertiajs/react';
import { Plus, ShieldCheck, UserRound, UsersRound } from 'lucide-react';
import { useState } from 'react';

const roleLabels = { admin: 'Administrator', 'inventory-manager': 'Inventory Manager', sales: 'Sales' };

export default function UsersIndex({ users, roles }) {
    const canManage = usePage().props.auth.permissions.includes('users.manage');
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const createForm = useForm({ name: '', email: '', password: '', role: 'sales' });
    const roleForm = useForm({ role: 'sales' });
    const roleOptions = roles.map((role) => ({ value: role, label: roleLabels[role] || role }));
    const submitCreate = (e) => { e.preventDefault(); createForm.post(route('users.store'), { onSuccess: () => { setOpen(false); createForm.reset(); } }); };
    const openRole = (user) => { setEditing(user); roleForm.setData('role', user.role || 'sales'); roleForm.clearErrors(); };
    const submitRole = (e) => { e.preventDefault(); roleForm.patch(route('users.update', editing.id), { onSuccess: () => setEditing(null) }); };

    return (
        <AuthenticatedLayout title="Tim & Role" eyebrow="Role-based access control" action={canManage && <Button onClick={() => setOpen(true)} className="h-10 rounded-xl bg-blue-600 hover:bg-blue-700"><Plus /> Tambah anggota</Button>}>
            <Head title="Tim & Role" />
            <section className="mb-6 grid gap-4 sm:grid-cols-3"><RoleCard icon={ShieldCheck} label="Administrator" detail="Akses penuh seluruh modul" count={users.filter((u) => u.role === 'admin').length} /><RoleCard icon={UsersRound} label="Inventory Manager" detail="Produk dan persediaan" count={users.filter((u) => u.role === 'inventory-manager').length} /><RoleCard icon={UserRound} label="Sales" detail="Pesanan dan pelanggan" count={users.filter((u) => u.role === 'sales').length} /></section>
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="border-b border-slate-100 px-5 py-4 sm:px-6"><h2 className="text-lg font-extrabold">Anggota tim</h2><p className="mt-1 text-sm text-slate-500">Hak akses dikelola dengan Spatie Laravel Permission.</p></div><div className="overflow-x-auto"><table className="w-full min-w-[700px] text-left"><thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500"><tr><th className="px-6 py-3 font-bold">Pengguna</th><th className="px-4 py-3 font-bold">Role</th><th className="px-4 py-3 font-bold">Bergabung</th><th className="px-6 py-3 text-right font-bold">Aksi</th></tr></thead><tbody className="divide-y divide-slate-100">{users.map((user) => <tr key={user.id}><td className="px-6 py-4"><div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-blue-50 text-sm font-black text-blue-600">{user.name.slice(0, 2).toUpperCase()}</span><div><p className="text-sm font-bold">{user.name}</p><p className="text-xs text-slate-500">{user.email}</p></div></div></td><td className="px-4 py-4"><Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-700">{roleLabels[user.role] || user.role || 'Tanpa role'}</Badge></td><td className="px-4 py-4 text-sm font-medium text-slate-600">{shortDate(user.created_at)}</td><td className="px-6 py-4 text-right">{canManage && <Button variant="outline" size="sm" onClick={() => openRole(user)}>Ubah role</Button>}</td></tr>)}</tbody></table></div></div>

            <Dialog open={open} onOpenChange={setOpen}><DialogContent><DialogHeader><DialogTitle>Tambah anggota tim</DialogTitle><DialogDescription>Akun baru akan langsung aktif dengan role yang dipilih.</DialogDescription></DialogHeader><form onSubmit={submitCreate} className="space-y-4"><Field label="Nama" error={createForm.errors.name}><input value={createForm.data.name} onChange={(e) => createForm.setData('name', e.target.value)} className="app-field" required /></Field><Field label="Email" error={createForm.errors.email}><input type="email" value={createForm.data.email} onChange={(e) => createForm.setData('email', e.target.value)} className="app-field" required /></Field><Field label="Password awal" error={createForm.errors.password}><input type="password" value={createForm.data.password} onChange={(e) => createForm.setData('password', e.target.value)} className="app-field" minLength="8" required /></Field><Field label="Role" error={createForm.errors.role}><SearchSelect options={roleOptions} value={createForm.data.role} onChange={(value) => createForm.setData('role', value)} placeholder="Cari role..." aria-label="Role anggota baru" /></Field><DialogFooter><Button type="button" variant="outline" onClick={() => setOpen(false)}>Batal</Button><Button disabled={createForm.processing} className="bg-blue-600 hover:bg-blue-700">Buat akun</Button></DialogFooter></form></DialogContent></Dialog>

            <Dialog open={!!editing} onOpenChange={(value) => !value && setEditing(null)}>{editing && <DialogContent><DialogHeader><DialogTitle>Ubah role {editing.name}</DialogTitle><DialogDescription>Perubahan berlaku pada permintaan berikutnya.</DialogDescription></DialogHeader><form onSubmit={submitRole} className="space-y-4"><Field label="Role" error={roleForm.errors.role}><SearchSelect options={roleOptions} value={roleForm.data.role} onChange={(value) => roleForm.setData('role', value)} placeholder="Cari role..." aria-label="Role pengguna" /></Field><DialogFooter><Button type="button" variant="outline" onClick={() => setEditing(null)}>Batal</Button><Button disabled={roleForm.processing} className="bg-blue-600 hover:bg-blue-700">Simpan role</Button></DialogFooter></form></DialogContent>}</Dialog>
        </AuthenticatedLayout>
    );
}

function RoleCard({ icon: Icon, label, detail, count }) { return <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><span className="grid size-11 place-items-center rounded-xl bg-blue-50 text-blue-600"><Icon className="size-5" /></span><div className="min-w-0 flex-1"><p className="font-extrabold">{label}</p><p className="truncate text-xs text-slate-500">{detail}</p></div><span className="text-2xl font-black">{count}</span></div>; }
function Field({ label, error, children }) { return <label className="block"><span className="mb-1.5 block text-sm font-bold text-slate-700">{label}</span>{children}{error && <span className="mt-1 block text-xs text-red-600">{error}</span>}</label>; }
