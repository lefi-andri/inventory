import { Badge } from '@/Components/ui/badge';
import { currency } from '@/lib/format';
import { Link, router, usePage } from '@inertiajs/react';
import axios from 'axios';
import {
    Bell,
    CheckCheck,
    CheckCircle2,
    Clock,
    ExternalLink,
    FileText,
    Image,
    MessageCircle,
    RefreshCw,
    ShoppingBag,
    Volume2,
    VolumeX,
    X,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

const playChime = () => {
    try {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (!AudioContextClass) return;
        const ctx = new AudioContextClass();
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, now); // D5
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.12); // A5

        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.35);
    } catch {
        // Silently catch audio block if user hasn't interacted with page
    }
};

export default function AdminNotificationBell({ className = '' }) {
    const { admin_notifications: initialData } = usePage().props;
    const [data, setData] = useState(() => initialData || {
        summary: { new_orders_count: 0, unread_chats_count: 0, total_count: 0 },
        new_orders: [],
        unread_conversations: [],
        latest_timestamp: 0,
    });
    const [open, setOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('all'); // 'all' | 'orders' | 'chats'
    const [loading, setLoading] = useState(false);
    const [soundEnabled, setSoundEnabled] = useState(() => {
        if (typeof window === 'undefined') return true;
        const stored = window.localStorage.getItem('tithoshop_admin_sound') ?? window.localStorage.getItem('stokara_admin_sound');
        return stored !== 'false';
    });
    const [toastMessage, setToastMessage] = useState(null);

    const prevTimestampRef = useRef(data?.latest_timestamp ?? 0);
    const prevCountRef = useRef(data?.summary?.total_count ?? 0);
    const dropdownRef = useRef(null);

    const toggleSound = () => {
        setSoundEnabled((prev) => {
            const next = !prev;
            if (typeof window !== 'undefined') {
                window.localStorage.setItem('tithoshop_admin_sound', next ? 'true' : 'false');
            }
            return next;
        });
    };

    const fetchNotifications = async (isManual = false) => {
        if (isManual) setLoading(true);
        try {
            const response = await axios.get(route('admin.notifications.index'));
            const fresh = response.data;

            const isNewActivity = fresh.latest_timestamp > prevTimestampRef.current;
            const isCountIncreased = fresh.summary.total_count > prevCountRef.current;

            if (isNewActivity && isCountIncreased) {
                if (soundEnabled) {
                    playChime();
                }

                if (fresh.summary.new_orders_count > (data?.summary?.new_orders_count ?? 0)) {
                    setToastMessage({
                        type: 'order',
                        title: 'Pesanan Baru Masuk!',
                        text: `Ada pesanan baru menunggu diproses (${fresh.summary.new_orders_count} belum diproses).`,
                    });
                } else if (fresh.summary.unread_chats_count > (data?.summary?.unread_chats_count ?? 0)) {
                    setToastMessage({
                        type: 'chat',
                        title: 'Pesan Chat Baru!',
                        text: 'Customer mengirimkan pesan baru.',
                    });
                }
            }

            prevTimestampRef.current = fresh.latest_timestamp;
            prevCountRef.current = fresh.summary.total_count;
            setData(fresh);
        } catch {
            // Ignore polling errors
        } finally {
            if (isManual) setLoading(false);
        }
    };

    // Close dropdown on click outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setOpen(false);
            }
        };

        if (open) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [open]);

    // Polling every 15 seconds
    useEffect(() => {
        const interval = window.setInterval(() => {
            fetchNotifications(false);
        }, 15000);

        return () => window.clearInterval(interval);
    }, [soundEnabled, data?.summary?.new_orders_count, data?.summary?.unread_chats_count]);

    // Auto-dismiss toast after 6 seconds
    useEffect(() => {
        if (!toastMessage) return undefined;
        const timer = window.setTimeout(() => setToastMessage(null), 6000);
        return () => window.clearTimeout(timer);
    }, [toastMessage]);

    const markChatAsRead = async (e, convId) => {
        e.preventDefault();
        e.stopPropagation();
        try {
            const response = await axios.post(route('admin.notifications.chats.read', convId));
            if (response.data?.notifications) {
                setData(response.data.notifications);
                prevCountRef.current = response.data.notifications.summary.total_count;
            }
        } catch {
            // fallback refresh
            fetchNotifications(false);
        }
    };

    const summary = data?.summary || { new_orders_count: 0, unread_chats_count: 0, total_count: 0 };
    const orders = data?.new_orders || [];
    const chats = data?.unread_conversations || [];
    const totalCount = summary.total_count || 0;

    return (
        <div className={`relative ${className}`} ref={dropdownRef}>
            {/* Notification Toast Alert */}
            {toastMessage && (
                <aside aria-label="Notifikasi Realtime" className="fixed right-6 top-24 z-50 flex max-w-sm items-start gap-3 rounded-2xl border border-blue-200 bg-white p-4 shadow-2xl transition animate-in fade-in slide-in-from-top-4">
                    <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-600">
                        {toastMessage.type === 'order' ? <ShoppingBag className="size-5" /> : <MessageCircle className="size-5" />}
                    </span>
                    <div className="min-w-0 flex-1">
                        <p className="text-sm font-extrabold text-slate-900">{toastMessage.title}</p>
                        <p className="mt-0.5 text-xs text-slate-600">{toastMessage.text}</p>
                    </div>
                    <button
                        type="button"
                        onClick={() => setToastMessage(null)}
                        className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                    >
                        <X className="size-4" />
                    </button>
                </aside>
            )}

            {/* Notification Bell Trigger Button */}
            <button
                type="button"
                onClick={() => setOpen(!open)}
                className={`relative grid size-10 place-items-center rounded-xl border transition ${
                    totalCount > 0
                        ? 'border-blue-300 bg-blue-50/80 text-blue-700 shadow-sm hover:bg-blue-100'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
                title="Notifikasi Masuk (Pesanan & Chat)"
                aria-label="Buka notifikasi"
            >
                <Bell className="size-5" />

                {totalCount > 0 && (
                    <>
                        <span className="absolute -top-1 -right-1 flex size-5 items-center justify-center rounded-full bg-red-600 text-[10px] font-black text-white shadow-md animate-in zoom-in">
                            {totalCount > 99 ? '99+' : totalCount}
                        </span>
                        <span className="absolute -top-1 -right-1 size-5 animate-ping rounded-full bg-red-400 opacity-75" />
                    </>
                )}
            </button>

            {/* Notification Popover Dropdown */}
            {open && (
                <div className="absolute right-0 mt-2 w-[calc(100vw-2rem)] max-w-sm sm:max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150">
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 sm:px-5">
                        <div className="flex items-center gap-2">
                            <span className="grid size-8 place-items-center rounded-lg bg-blue-50 text-blue-600">
                                <Bell className="size-4" />
                            </span>
                            <div>
                                <h3 className="text-sm font-extrabold text-slate-900">Notifikasi Masuk</h3>
                                <p className="text-[11px] text-slate-500">
                                    {totalCount > 0 ? `${totalCount} aktivitas perlu perhatian` : 'Semua telah ditinjau'}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                            <button
                                type="button"
                                onClick={toggleSound}
                                className={`rounded-lg p-1.5 text-xs font-semibold transition ${
                                    soundEnabled ? 'text-blue-600 hover:bg-blue-50' : 'text-slate-400 hover:bg-slate-100'
                                }`}
                                title={soundEnabled ? 'Suara notifikasi aktif (klik untuk membisukan)' : 'Suara notifikasi nonaktif (klik untuk mengaktifkan)'}
                            >
                                {soundEnabled ? <Volume2 className="size-4" /> : <VolumeX className="size-4" />}
                            </button>
                            <button
                                type="button"
                                onClick={() => fetchNotifications(true)}
                                className={`rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900 ${loading ? 'animate-spin' : ''}`}
                                title="Segarkan notifikasi"
                            >
                                <RefreshCw className="size-4" />
                            </button>
                        </div>
                    </div>

                    {/* Filter Tabs */}
                    <div className="flex border-b border-slate-100 bg-slate-50/70 p-1 text-xs font-bold text-slate-600">
                        <button
                            type="button"
                            onClick={() => setActiveTab('all')}
                            className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-1.5 transition ${
                                activeTab === 'all' ? 'bg-white text-blue-700 shadow-xs' : 'hover:text-slate-900'
                            }`}
                        >
                            Semua
                            {totalCount > 0 && (
                                <span className="rounded-full bg-blue-100 px-1.5 py-0.2 text-[10px] font-black text-blue-700">
                                    {totalCount}
                                </span>
                            )}
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('orders')}
                            className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-1.5 transition ${
                                activeTab === 'orders' ? 'bg-white text-blue-700 shadow-xs' : 'hover:text-slate-900'
                            }`}
                        >
                            Pesanan
                            {summary.new_orders_count > 0 && (
                                <span className="rounded-full bg-emerald-100 px-1.5 py-0.2 text-[10px] font-black text-emerald-700">
                                    {summary.new_orders_count}
                                </span>
                            )}
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('chats')}
                            className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-1.5 transition ${
                                activeTab === 'chats' ? 'bg-white text-blue-700 shadow-xs' : 'hover:text-slate-900'
                            }`}
                        >
                            Chat
                            {summary.unread_chats_count > 0 && (
                                <span className="rounded-full bg-violet-100 px-1.5 py-0.2 text-[10px] font-black text-violet-700">
                                    {summary.unread_chats_count}
                                </span>
                            )}
                        </button>
                    </div>

                    {/* Notification Items List */}
                    <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 p-1">
                        {/* Section: Incoming Orders */}
                        {(activeTab === 'all' || activeTab === 'orders') && orders.map((order) => (
                            <Link
                                key={`order-${order.id}`}
                                href={route('orders.index')}
                                onClick={() => setOpen(false)}
                                className="group flex items-start gap-3 rounded-xl p-3 hover:bg-slate-50 transition"
                            >
                                <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-600 group-hover:scale-105 transition">
                                    <ShoppingBag className="size-4" />
                                </span>
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center justify-between gap-2">
                                        <p className="truncate text-xs font-black text-slate-900">{order.order_number}</p>
                                        <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-[10px] text-emerald-700 font-bold px-1.5 py-0">
                                            Pesanan Baru
                                        </Badge>
                                    </div>
                                    <p className="mt-0.5 truncate text-xs text-slate-600 font-medium">
                                        {order.customer_name} · <strong className="text-slate-900 font-bold">{currency(order.total)}</strong>
                                    </p>
                                    <p className="mt-1 flex items-center gap-1 text-[11px] text-slate-400">
                                        <Clock className="size-3" /> {order.time_ago || 'Baru saja'}
                                    </p>
                                </div>
                            </Link>
                        ))}

                        {/* Section: Incoming Customer Chats */}
                        {(activeTab === 'all' || activeTab === 'chats') && chats.map((conv) => (
                            <div
                                key={`chat-${conv.id}`}
                                className="group flex items-start gap-3 rounded-xl p-3 hover:bg-slate-50 transition"
                            >
                                <Link
                                    href={route('admin.chats.index', conv.id)}
                                    onClick={() => setOpen(false)}
                                    className="flex min-w-0 flex-1 items-start gap-3"
                                >
                                    <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-violet-50 text-violet-600 font-extrabold text-xs group-hover:scale-105 transition">
                                        {conv.customer_name?.slice(0, 2).toUpperCase() || 'CU'}
                                    </span>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center justify-between gap-2">
                                            <p className="truncate text-xs font-black text-slate-900">{conv.customer_name}</p>
                                            <span className="rounded-full bg-violet-600 px-1.5 py-0.5 text-[10px] font-black text-white">
                                                {conv.unread_count} baru
                                            </span>
                                        </div>
                                        <p className="mt-0.5 truncate text-xs text-slate-600">
                                            {conv.preview || 'Mengirim lampiran'}
                                        </p>
                                        <p className="mt-1 flex items-center gap-1 text-[11px] text-slate-400">
                                            <Clock className="size-3" /> {conv.time_ago || 'Baru saja'}
                                        </p>
                                    </div>
                                </Link>

                                <button
                                    type="button"
                                    onClick={(e) => markChatAsRead(e, conv.id)}
                                    className="mt-1 rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700"
                                    title="Tandai chat sudah dibaca"
                                >
                                    <CheckCheck className="size-4" />
                                </button>
                            </div>
                        ))}

                        {/* Empty States */}
                        {orders.length === 0 && chats.length === 0 && (
                            <div className="p-8 text-center">
                                <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-emerald-50 text-emerald-600">
                                    <CheckCircle2 className="size-6" />
                                </span>
                                <p className="mt-3 text-sm font-black text-slate-900">Semua Terkendali!</p>
                                <p className="mt-1 text-xs text-slate-500">
                                    Tidak ada pesanan baru yang belum diproses atau chat pelanggan yang belum dibaca.
                                </p>
                            </div>
                        )}
                        {activeTab === 'orders' && orders.length === 0 && (
                            <div className="p-6 text-center text-xs text-slate-500">
                                Tidak ada pesanan dengan status baru.
                            </div>
                        )}
                        {activeTab === 'chats' && chats.length === 0 && (
                            <div className="p-6 text-center text-xs text-slate-500">
                                Tidak ada pesan chat pelanggan yang belum dibaca.
                            </div>
                        )}
                    </div>

                    {/* Footer Quick Links */}
                    <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/70 px-4 py-2.5 text-xs font-bold">
                        <Link
                            href={route('orders.index')}
                            onClick={() => setOpen(false)}
                            className="text-blue-600 hover:text-blue-700 flex items-center gap-1"
                        >
                            Kelola Pesanan <ExternalLink className="size-3" />
                        </Link>
                        <Link
                            href={route('admin.chats.index')}
                            onClick={() => setOpen(false)}
                            className="text-violet-600 hover:text-violet-700 flex items-center gap-1"
                        >
                            Inbox Chat <ExternalLink className="size-3" />
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
}
