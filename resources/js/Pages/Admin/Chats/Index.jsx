import SearchSelect from '@/Components/SearchSelect';
import { Button } from '@/Components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/Components/ui/dialog';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import {
    CheckCheck,
    Inbox,
    Lock,
    MessageCircle,
    MessageSquarePlus,
    RotateCcw,
    Send,
    UserRound,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { activeLocale } from '@/lib/format';

const messageTime = (value) => new Intl.DateTimeFormat(activeLocale(), {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
}).format(new Date(value));

export default function ChatIndex({ customers, conversations, activeConversation }) {
    const { auth } = usePage().props;
    const replyForm = useForm({ body: '' });
    const startForm = useForm({ customer_id: '', body: '' });
    const [startOpen, setStartOpen] = useState(false);
    const endRef = useRef(null);
    const messages = activeConversation?.messages ?? [];
    const customerOptions = customers.map((customer) => ({
        value: customer.id,
        label: `${customer.name} — ${customer.email}`,
    }));
    const selectedCustomer = customers.find(
        (customer) => String(customer.id) === String(startForm.data.customer_id),
    );

    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [activeConversation?.id, messages.length]);

    useEffect(() => {
        const interval = window.setInterval(() => {
            if (!replyForm.processing && !startForm.processing && document.visibilityState === 'visible') {
                router.reload({
                    only: ['conversations', 'activeConversation'],
                    preserveScroll: true,
                    preserveState: true,
                });
            }
        }, 4000);

        return () => window.clearInterval(interval);
    }, [replyForm.processing, startForm.processing]);

    const submitReply = (event) => {
        event.preventDefault();

        if (!activeConversation || !replyForm.data.body.trim()) return;

        replyForm.post(route('admin.chats.messages.store', activeConversation.id), {
            preserveScroll: true,
            onSuccess: () => replyForm.reset('body'),
        });
    };

    const submitStart = (event) => {
        event.preventDefault();

        if (!startForm.data.customer_id || !startForm.data.body.trim()) return;

        startForm.post(route('admin.chats.store'), {
            onSuccess: () => {
                setStartOpen(false);
                startForm.reset();
            },
        });
    };

    const changeStartDialog = (open) => {
        setStartOpen(open);

        if (!open && !startForm.processing) {
            startForm.reset();
            startForm.clearErrors();
        }
    };

    const toggleStatus = () => {
        if (!activeConversation) return;

        router.patch(route('admin.chats.status.update', activeConversation.id), {
            status: activeConversation.status === 'closed' ? 'open' : 'closed',
        }, { preserveScroll: true });
    };

    return (
        <AuthenticatedLayout title="Chat Customer" eyebrow="Layanan pelanggan">
            <Head title="Chat Customer" />

            <div className="grid min-h-[650px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:grid-cols-[340px_1fr]">
                <aside className="border-b border-slate-200 lg:border-b-0 lg:border-r">
                    <div className="border-b border-slate-100 p-5">
                        <div className="flex items-center justify-between gap-3">
                            <h2 className="flex items-center gap-2 font-extrabold">
                                <Inbox className="size-5 text-blue-600" /> Inbox
                            </h2>
                            <Button
                                type="button"
                                size="sm"
                                onClick={() => setStartOpen(true)}
                                className="rounded-xl bg-blue-600 hover:bg-blue-700"
                            >
                                <MessageSquarePlus /> Chat baru
                            </Button>
                        </div>
                        <p className="mt-1 text-sm text-slate-500">
                            {conversations.length} percakapan customer
                        </p>
                    </div>

                    <div className="max-h-72 overflow-y-auto lg:max-h-[590px]">
                        {conversations.map((conversation) => (
                            <Link
                                key={conversation.id}
                                href={route('admin.chats.index', conversation.id)}
                                preserveScroll
                                className={`block border-b border-slate-100 p-4 transition hover:bg-slate-50 ${activeConversation?.id === conversation.id ? 'bg-blue-50/70' : ''}`}
                            >
                                <div className="flex items-start gap-3">
                                    <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-600">
                                        <UserRound className="size-5" />
                                    </span>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2">
                                            <p className="truncate text-sm font-extrabold">{conversation.customer.name}</p>
                                            {conversation.unread_count > 0 && (
                                                <span className="ml-auto grid min-w-5 place-items-center rounded-full bg-blue-600 px-1.5 py-0.5 text-[10px] font-black text-white">
                                                    {conversation.unread_count}
                                                </span>
                                            )}
                                        </div>
                                        <p className="mt-0.5 truncate text-xs text-slate-500">
                                            {conversation.last_message || 'Belum ada pesan'}
                                        </p>
                                        <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
                                            <span>{conversation.last_message_at ? messageTime(conversation.last_message_at) : ''}</span>
                                            <span className={conversation.status === 'closed' ? 'text-slate-500' : 'text-emerald-600'}>
                                                {conversation.status === 'closed' ? 'Ditutup' : 'Aktif'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))}

                        {!conversations.length && (
                            <div className="px-5 py-16 text-center">
                                <MessageCircle className="mx-auto size-8 text-slate-300" />
                                <p className="mt-3 text-sm font-semibold text-slate-500">Belum ada percakapan.</p>
                                <button
                                    type="button"
                                    onClick={() => setStartOpen(true)}
                                    className="mt-2 text-sm font-bold text-blue-600 hover:text-blue-700"
                                >
                                    Mulai chat dengan customer
                                </button>
                            </div>
                        )}
                    </div>
                </aside>

                {activeConversation ? (
                    <section className="flex min-h-[540px] flex-col">
                        <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
                            <div className="min-w-0">
                                <p className="truncate font-extrabold">{activeConversation.customer.name}</p>
                                <p className="truncate text-xs text-slate-500">
                                    {activeConversation.customer.email}
                                    {activeConversation.customer.phone ? ` · ${activeConversation.customer.phone}` : ''}
                                </p>
                            </div>
                            <Button type="button" variant="outline" onClick={toggleStatus} className="rounded-xl">
                                {activeConversation.status === 'closed'
                                    ? <><RotateCcw /> Buka kembali</>
                                    : <><Lock /> Tutup chat</>}
                            </Button>
                        </div>

                        <div className="flex-1 space-y-4 overflow-y-auto bg-slate-50/60 p-4 sm:p-6">
                            {messages.map((message) => {
                                const mine = message.sender_id !== activeConversation.customer.id;

                                return (
                                    <div key={message.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[85%] rounded-2xl px-4 py-3 sm:max-w-[70%] ${mine ? 'rounded-br-md bg-slate-900 text-white' : 'rounded-bl-md border border-slate-200 bg-white text-slate-800'}`}>
                                            <p className={`mb-1 text-[11px] font-bold ${mine ? 'text-slate-300' : 'text-blue-600'}`}>
                                                {mine
                                                    ? (message.sender_id === auth.user.id ? 'Anda' : message.sender_name)
                                                    : message.sender_name}
                                            </p>
                                            <p className="whitespace-pre-wrap break-words text-sm leading-6">{message.body}</p>
                                            <p className="mt-1.5 flex items-center justify-end gap-1 text-[11px] text-slate-400">
                                                {messageTime(message.created_at)}
                                                {mine && message.read_at && <CheckCheck className="size-3.5" />}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                            <div ref={endRef} />
                        </div>

                        <form onSubmit={submitReply} className="border-t border-slate-100 p-4">
                            <div className="flex items-end gap-3">
                                <div className="flex-1">
                                    <textarea
                                        value={replyForm.data.body}
                                        onChange={(event) => replyForm.setData('body', event.target.value)}
                                        onKeyDown={(event) => {
                                            if (event.key === 'Enter' && !event.shiftKey) {
                                                event.preventDefault();
                                                submitReply(event);
                                            }
                                        }}
                                        rows="2"
                                        maxLength="2000"
                                        placeholder="Tulis balasan..."
                                        className="app-field resize-none"
                                        aria-label="Balasan"
                                    />
                                    {replyForm.errors.body && (
                                        <p className="mt-1 text-xs font-semibold text-red-600">{replyForm.errors.body}</p>
                                    )}
                                </div>
                                <Button
                                    disabled={replyForm.processing || !replyForm.data.body.trim()}
                                    className="h-11 rounded-xl bg-blue-600 px-4 hover:bg-blue-700"
                                >
                                    <Send /> Kirim
                                </Button>
                            </div>
                        </form>
                    </section>
                ) : (
                    <section className="grid min-h-[540px] place-items-center bg-slate-50/50 text-center">
                        <div>
                            <MessageCircle className="mx-auto size-12 text-slate-300" />
                            <p className="mt-4 font-extrabold">Mulai percakapan</p>
                            <p className="mt-1 text-sm text-slate-500">Pilih percakapan atau buat chat baru dengan customer.</p>
                        </div>
                    </section>
                )}
            </div>

            <Dialog open={startOpen} onOpenChange={changeStartDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Mulai chat baru</DialogTitle>
                        <DialogDescription>
                            Pilih customer terdaftar dan kirim pesan pertama dari admin.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={submitStart} className="space-y-4">
                        <label className="block">
                            <span className="mb-1.5 block text-sm font-bold">Customer</span>
                            <SearchSelect
                                options={customerOptions}
                                value={startForm.data.customer_id}
                                onChange={(value) => startForm.setData('customer_id', value)}
                                placeholder="Cari nama atau email customer..."
                                noOptionsMessage="Customer tidak ditemukan"
                                aria-label="Pilih customer"
                            />
                            {startForm.errors.customer_id && (
                                <span className="mt-1 block text-xs font-semibold text-red-600">
                                    {startForm.errors.customer_id}
                                </span>
                            )}
                        </label>

                        {selectedCustomer?.conversation_id && (
                            <p className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800">
                                Customer ini sudah memiliki percakapan. Pesan baru akan ditambahkan dan chat akan dibuka kembali.
                            </p>
                        )}

                        <label className="block">
                            <span className="mb-1.5 block text-sm font-bold">Pesan pertama</span>
                            <textarea
                                value={startForm.data.body}
                                onChange={(event) => startForm.setData('body', event.target.value)}
                                rows="5"
                                maxLength="2000"
                                placeholder="Tulis pesan untuk customer..."
                                className="app-field resize-none"
                                required
                            />
                            {startForm.errors.body && (
                                <span className="mt-1 block text-xs font-semibold text-red-600">
                                    {startForm.errors.body}
                                </span>
                            )}
                        </label>

                        {!customers.length && (
                            <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                                Belum ada akun customer terdaftar.
                            </p>
                        )}

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => changeStartDialog(false)}>
                                Batal
                            </Button>
                            <Button
                                disabled={startForm.processing || !startForm.data.customer_id || !startForm.data.body.trim()}
                                className="bg-blue-600 hover:bg-blue-700"
                            >
                                <Send /> Kirim dan buka chat
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </AuthenticatedLayout>
    );
}
