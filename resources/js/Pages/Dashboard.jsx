import { Badge } from '@/Components/ui/badge';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { currency, shortDate, statusLabel } from '@/lib/format';
import { Head, Link, usePage } from '@inertiajs/react';
import {
    AlertTriangle,
    ArrowDownRight,
    ArrowRight,
    ArrowUpRight,
    Bell,
    Boxes,
    CheckCircle2,
    Clock,
    ExternalLink,
    MessageCircle,
    Package,
    ReceiptText,
    ShoppingBag,
    WalletCards,
} from 'lucide-react';

const statCards = [
    { key: 'revenue', label: 'Pendapatan lunas', icon: WalletCards, format: currency, color: 'bg-blue-600 text-white' },
    { key: 'orders', label: 'Total pesanan', icon: ReceiptText, color: 'bg-white text-slate-950' },
    { key: 'products', label: 'Produk tercatat', icon: Package, color: 'bg-white text-slate-950' },
    { key: 'low_stock', label: 'Stok perlu perhatian', icon: AlertTriangle, color: 'bg-[#d9ff78] text-slate-950' },
];

const badgeClass = (status) => ({
    paid: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    pending: 'bg-amber-50 text-amber-700 border-amber-200',
    processing: 'bg-blue-50 text-blue-700 border-blue-200',
    new: 'bg-violet-50 text-violet-700 border-violet-200',
    completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
}[status] || 'bg-slate-50 text-slate-600');

export default function Dashboard({ stats, lowStock, recentOrders, recentMovements, adminNotifications }) {
    const { auth } = usePage().props;
    const notifications = adminNotifications || {
        summary: { new_orders_count: 0, unread_chats_count: 0, total_count: 0 },
        new_orders: [],
        unread_conversations: [],
    };

    const summary = notifications.summary || { new_orders_count: 0, unread_chats_count: 0, total_count: 0 };
    const hasIncomingActivity = summary.total_count > 0;
    const isAdmin = auth?.roles?.includes('admin');

    return (
        <AuthenticatedLayout title="Pusat Kendali" eyebrow="Ringkasan hari ini">
            <Head title="Dashboard" />

            {/* Real-time Notification Alert Banner */}
            {isAdmin && hasIncomingActivity && (
                <section aria-label="Notifikasi Penting" className="mb-6 overflow-hidden rounded-2xl border border-blue-200 bg-gradient-to-r from-blue-50 via-indigo-50/50 to-white p-5 shadow-sm">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-start gap-3.5">
                            <span className="relative grid size-11 shrink-0 place-items-center rounded-2xl bg-blue-600 text-white shadow-md">
                                <Bell className="size-5" />
                                <span className="absolute -top-1 -right-1 size-3.5 animate-ping rounded-full bg-red-400" />
                                <span className="absolute -top-1 -right-1 size-3.5 rounded-full bg-red-500 border-2 border-white" />
                            </span>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h2 className="text-base font-black text-slate-900">Notifikasi Aktivitas Masuk</h2>
                                    <span className="rounded-full bg-blue-600 px-2.5 py-0.5 text-xs font-black text-white">
                                        {summary.total_count} Perlu Perhatian
                                    </span>
                                </div>
                                <p className="mt-1 text-sm text-slate-600">
                                    {summary.new_orders_count > 0 && summary.unread_chats_count > 0 ? (
                                        <>
                                            Terdapat <strong>{summary.new_orders_count} pesanan baru</strong> yang menunggu diproses dan <strong>{summary.unread_chats_count} pesan chat</strong> dari pelanggan.
                                        </>
                                    ) : summary.new_orders_count > 0 ? (
                                        <>
                                            Terdapat <strong>{summary.new_orders_count} pesanan baru</strong> yang baru masuk dan siap diproses tim.
                                        </>
                                    ) : (
                                        <>
                                            Terdapat <strong>{summary.unread_chats_count} pesan chat pelanggan</strong> baru yang belum dibaca.
                                        </>
                                    )}
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2.5 sm:shrink-0">
                            {summary.new_orders_count > 0 && (
                                <Link
                                    href={route('orders.index')}
                                    className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-extrabold text-white shadow-sm hover:bg-emerald-700 transition"
                                >
                                    <ShoppingBag className="size-4" /> Proses Pesanan ({summary.new_orders_count})
                                </Link>
                            )}
                            {summary.unread_chats_count > 0 && (
                                <Link
                                    href={route('admin.chats.index')}
                                    className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-xs font-extrabold text-white shadow-sm hover:bg-violet-700 transition"
                                >
                                    <MessageCircle className="size-4" /> Buka Chat ({summary.unread_chats_count})
                                </Link>
                            )}
                        </div>
                    </div>
                </section>
            )}

            {/* Overview Stat Cards */}
            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {statCards.map(({ key, label, icon: Icon, format, color }) => (
                    <div key={key} className={`relative overflow-hidden rounded-2xl border border-slate-200/80 p-5 shadow-sm ${color}`}>
                        <div className="flex items-start justify-between">
                            <div>
                                <p className={`text-sm font-semibold ${key === 'revenue' ? 'text-blue-100' : 'text-slate-500'}`}>{label}</p>
                                <p className="mt-3 text-3xl font-black tracking-tight">{format ? format(stats[key]) : stats[key]}</p>
                            </div>
                            <span className={`grid size-10 place-items-center rounded-xl ${key === 'revenue' ? 'bg-white/15' : 'bg-slate-950/[.06]'}`}>
                                <Icon className="size-5" />
                            </span>
                        </div>
                        <p className={`mt-4 text-xs font-medium ${key === 'revenue' ? 'text-blue-100' : 'text-slate-500'}`}>
                            {key === 'low_stock' ? 'Segera lakukan restock' : 'Diperbarui otomatis'}
                        </p>
                    </div>
                ))}
            </section>

            {/* Dedicated Incoming Activity (Orders & Customer Chats) Section */}
            {isAdmin && (
                <section className="mt-6 grid gap-6 lg:grid-cols-2">
                    {/* Panel 1: Incoming Orders Needing Processing */}
                    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 sm:px-6">
                            <div className="flex items-center gap-2.5">
                                <span className="grid size-9 place-items-center rounded-xl bg-emerald-50 text-emerald-600">
                                    <ShoppingBag className="size-4" />
                                </span>
                                <div>
                                    <h2 className="text-base font-black text-slate-900">Pesanan Masuk</h2>
                                    <p className="text-xs text-slate-500">Status baru menunggu diproses</p>
                                </div>
                            </div>
                            <Link href={route('orders.index')} className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700">
                                Semua Pesanan <ArrowRight className="size-3.5" />
                            </Link>
                        </div>

                        <div className="divide-y divide-slate-100">
                            {notifications.new_orders?.map((order) => (
                                <div key={order.id} className="flex items-center justify-between gap-4 p-4 hover:bg-slate-50/70 transition">
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2">
                                            <p className="truncate text-sm font-black text-slate-900">{order.order_number}</p>
                                            <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700 text-[10px] font-bold px-1.5 py-0">
                                                Baru
                                            </Badge>
                                        </div>
                                        <p className="mt-0.5 truncate text-xs text-slate-600">
                                            {order.customer_name} {order.customer_phone && `(${order.customer_phone})`}
                                        </p>
                                        <p className="mt-1 flex items-center gap-1 text-[11px] text-slate-400">
                                            <Clock className="size-3" /> {order.time_ago || 'Baru saja'}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-black text-slate-900">{currency(order.total)}</p>
                                        <Link
                                            href={route('orders.index')}
                                            className="mt-1 inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700"
                                        >
                                            Proses <ExternalLink className="size-3" />
                                        </Link>
                                    </div>
                                </div>
                            ))}

                            {(!notifications.new_orders || notifications.new_orders.length === 0) && (
                                <div className="p-8 text-center">
                                    <span className="mx-auto grid size-11 place-items-center rounded-2xl bg-slate-50 text-slate-400">
                                        <CheckCircle2 className="size-5 text-emerald-500" />
                                    </span>
                                    <p className="mt-2 text-sm font-bold text-slate-700">Tidak ada pesanan tertunda</p>
                                    <p className="mt-0.5 text-xs text-slate-400">Semua pesanan yang masuk telah diproses.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Panel 2: Customer Chats with Unread Messages */}
                    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 sm:px-6">
                            <div className="flex items-center gap-2.5">
                                <span className="grid size-9 place-items-center rounded-xl bg-violet-50 text-violet-600">
                                    <MessageCircle className="size-4" />
                                </span>
                                <div>
                                    <h2 className="text-base font-black text-slate-900">Chat Pelanggan Masuk</h2>
                                    <p className="text-xs text-slate-500">Pesan belum dibaca dari customer</p>
                                </div>
                            </div>
                            <Link href={route('admin.chats.index')} className="flex items-center gap-1 text-xs font-bold text-violet-600 hover:text-violet-700">
                                Buka Inbox <ArrowRight className="size-3.5" />
                            </Link>
                        </div>

                        <div className="divide-y divide-slate-100">
                            {notifications.unread_conversations?.map((conv) => (
                                <Link
                                    key={conv.id}
                                    href={route('admin.chats.index', conv.id)}
                                    className="flex items-center justify-between gap-4 p-4 hover:bg-slate-50/70 transition"
                                >
                                    <div className="flex items-center gap-3 min-w-0 flex-1">
                                        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-violet-100 text-violet-700 font-black text-xs">
                                            {conv.customer_name?.slice(0, 2).toUpperCase() || 'CU'}
                                        </span>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2">
                                                <p className="truncate text-sm font-black text-slate-900">{conv.customer_name}</p>
                                                <span className="rounded-full bg-violet-600 px-2 py-0.2 text-[10px] font-black text-white">
                                                    {conv.unread_count} pesan baru
                                                </span>
                                            </div>
                                            <p className="mt-0.5 truncate text-xs text-slate-600">
                                                {conv.preview || 'Mengirim lampiran berkas'}
                                            </p>
                                            <p className="mt-1 flex items-center gap-1 text-[11px] text-slate-400">
                                                <Clock className="size-3" /> {conv.time_ago || 'Baru saja'}
                                            </p>
                                        </div>
                                    </div>

                                    <span className="inline-flex shrink-0 items-center gap-1 rounded-xl bg-violet-50 px-3 py-1.5 text-xs font-bold text-violet-700 hover:bg-violet-100 transition">
                                        Balas <ArrowRight className="size-3.5" />
                                    </span>
                                </Link>
                            ))}

                            {(!notifications.unread_conversations || notifications.unread_conversations.length === 0) && (
                                <div className="p-8 text-center">
                                    <span className="mx-auto grid size-11 place-items-center rounded-2xl bg-slate-50 text-slate-400">
                                        <CheckCircle2 className="size-5 text-emerald-500" />
                                    </span>
                                    <p className="mt-2 text-sm font-bold text-slate-700">Semua chat telah dibaca</p>
                                    <p className="mt-0.5 text-xs text-slate-400">Tidak ada pesan pelanggan yang belum ditinjau.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </section>
            )}

            {/* Recent Orders and Low Stock Tables */}
            <section className="mt-6 grid gap-6 xl:grid-cols-[1.55fr_1fr]">
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 sm:px-6">
                        <div>
                            <h2 className="text-lg font-extrabold">Semua riwayat pesanan</h2>
                            <p className="mt-1 text-sm text-slate-500">Transaksi terakhir di platform.</p>
                        </div>
                        <Link href={route('orders.index')} className="text-sm font-bold text-blue-600 hover:text-blue-700">Lihat semua</Link>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[680px] text-left">
                            <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                                <tr>
                                    <th className="px-6 py-3 font-bold">Nomor</th>
                                    <th className="px-4 py-3 font-bold">Pelanggan</th>
                                    <th className="px-4 py-3 font-bold">Status</th>
                                    <th className="px-4 py-3 text-right font-bold">Total</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {recentOrders.map((order) => (
                                    <tr key={order.id} className="hover:bg-slate-50/70">
                                        <td className="px-6 py-4">
                                            <p className="text-sm font-extrabold text-slate-900">{order.order_number}</p>
                                            <p className="mt-1 text-xs text-slate-500">{shortDate(order.created_at)}</p>
                                        </td>
                                        <td className="px-4 py-4 text-sm font-semibold">{order.customer_name}</td>
                                        <td className="px-4 py-4">
                                            <div className="flex flex-wrap gap-1.5">
                                                <Badge variant="outline" className={badgeClass(order.status)}>{statusLabel[order.status]}</Badge>
                                                <Badge variant="outline" className={badgeClass(order.payment_status)}>{statusLabel[order.payment_status]}</Badge>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 text-right text-sm font-extrabold">{currency(order.total)}</td>
                                    </tr>
                                ))}
                                {!recentOrders.length && <tr><td colSpan="4" className="px-6 py-12 text-center text-sm text-slate-500">Belum ada pesanan.</td></tr>}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                    <div className="flex items-start justify-between">
                        <div>
                            <h2 className="text-lg font-extrabold">Stok menipis</h2>
                            <p className="mt-1 text-sm text-slate-500">Di bawah batas minimum.</p>
                        </div>
                        <span className="grid size-10 place-items-center rounded-xl bg-amber-50 text-amber-600">
                            <AlertTriangle className="size-5" />
                        </span>
                    </div>
                    <div className="mt-5 space-y-3">
                        {lowStock.map((product) => (
                            <div key={product.id} className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/70 p-3">
                                <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-white text-slate-500 shadow-sm">
                                    <Boxes className="size-5" />
                                </span>
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-bold">{product.name}</p>
                                    <p className="text-xs text-slate-500">{product.sku} · Min. {product.threshold}</p>
                                </div>
                                <span className="rounded-lg bg-red-50 px-2.5 py-1 text-sm font-black text-red-600">{product.stock}</span>
                            </div>
                        ))}
                        {!lowStock.length && <p className="py-8 text-center text-sm text-slate-500">Semua stok dalam kondisi aman.</p>}
                    </div>
                </div>
            </section>

            {/* Inventory Movements */}
            <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-extrabold">Aktivitas inventory</h2>
                        <p className="mt-1 text-sm text-slate-500">Jejak perubahan stok paling baru.</p>
                    </div>
                    <Link href={route('inventory.index')} className="text-sm font-bold text-blue-600">Buka inventory</Link>
                </div>
                <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {recentMovements.map((movement) => (
                        <div key={movement.id} className="flex items-center gap-3 rounded-xl border border-slate-100 p-3.5">
                            <span className={`grid size-9 place-items-center rounded-lg ${movement.quantity > 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                                {movement.quantity > 0 ? <ArrowUpRight className="size-4" /> : <ArrowDownRight className="size-4" />}
                            </span>
                            <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-bold">{movement.product}</p>
                                <p className="text-xs text-slate-500">{statusLabel[movement.type]} · stok {movement.after_stock}</p>
                            </div>
                            <span className={`text-sm font-black ${movement.quantity > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                {movement.quantity > 0 ? '+' : ''}{movement.quantity}
                            </span>
                        </div>
                    ))}
                </div>
            </section>
        </AuthenticatedLayout>
    );
}
