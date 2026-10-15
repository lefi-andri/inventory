import ChatAttachment, { formatFileSize } from '@/Components/ChatAttachment';
import ChatEmojiPicker, { insertEmojiAtCursor } from '@/Components/ChatEmojiPicker';
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
    FileText,
    Inbox,
    Lock,
    MessageCircle,
    MessageSquarePlus,
    Paperclip,
    RotateCcw,
    Send,
    UserRound,
    X,
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
    const replyForm = useForm({ body: '', attachment: null });
    const startForm = useForm({ customer_id: '', body: '', attachment: null });
    const [startOpen, setStartOpen] = useState(false);
    const [replyFilePreview, setReplyFilePreview] = useState(null);
    const [replyFileError, setReplyFileError] = useState('');
    const [startFilePreview, setStartFilePreview] = useState(null);
    const [startFileError, setStartFileError] = useState('');
    const endRef = useRef(null);
    const replyFileInputRef = useRef(null);
    const startFileInputRef = useRef(null);
    const replyTextareaRef = useRef(null);
    const startTextareaRef = useRef(null);

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

    const handleReplyFileSelect = (event) => {
        const file = event.target.files?.[0];
        setReplyFileError('');
        if (!file) return;

        if (file.size > 10 * 1024 * 1024) {
            setReplyFileError('Ukuran file maksimal 10MB.');
            event.target.value = '';
            return;
        }

        const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'];
        if (!allowed.includes(file.type)) {
            setReplyFileError('Format file tidak didukung. Pilih gambar (JPG, PNG, WebP) atau file PDF.');
            event.target.value = '';
            return;
        }

        replyForm.setData('attachment', file);
        const isImage = file.type.startsWith('image/');
        setReplyFilePreview({
            name: file.name,
            size: file.size,
            isImage,
            url: isImage ? URL.createObjectURL(file) : null,
        });
    };

    const clearReplyAttachment = () => {
        if (replyFilePreview?.url) {
            URL.revokeObjectURL(replyFilePreview.url);
        }
        setReplyFilePreview(null);
        setReplyFileError('');
        replyForm.setData('attachment', null);
        if (replyFileInputRef.current) {
            replyFileInputRef.current.value = '';
        }
    };

    const handleStartFileSelect = (event) => {
        const file = event.target.files?.[0];
        setStartFileError('');
        if (!file) return;

        if (file.size > 10 * 1024 * 1024) {
            setStartFileError('Ukuran file maksimal 10MB.');
            event.target.value = '';
            return;
        }

        const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'];
        if (!allowed.includes(file.type)) {
            setStartFileError('Format file tidak didukung. Pilih gambar atau PDF.');
            event.target.value = '';
            return;
        }

        startForm.setData('attachment', file);
        const isImage = file.type.startsWith('image/');
        setStartFilePreview({
            name: file.name,
            size: file.size,
            isImage,
            url: isImage ? URL.createObjectURL(file) : null,
        });
    };

    const clearStartAttachment = () => {
        if (startFilePreview?.url) {
            URL.revokeObjectURL(startFilePreview.url);
        }
        setStartFilePreview(null);
        setStartFileError('');
        startForm.setData('attachment', null);
        if (startFileInputRef.current) {
            startFileInputRef.current.value = '';
        }
    };

    const submitReply = (event) => {
        event.preventDefault();

        const hasText = Boolean(replyForm.data.body?.trim());
        const hasFile = Boolean(replyForm.data.attachment);
        if (!activeConversation || (!hasText && !hasFile)) return;

        replyForm.post(route('admin.chats.messages.store', activeConversation.id), {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                replyForm.reset('body');
                clearReplyAttachment();
            },
        });
    };

    const submitStart = (event) => {
        event.preventDefault();

        const hasText = Boolean(startForm.data.body?.trim());
        const hasFile = Boolean(startForm.data.attachment);
        if (!startForm.data.customer_id || (!hasText && !hasFile)) return;

        startForm.post(route('admin.chats.store'), {
            forceFormData: true,
            onSuccess: () => {
                setStartOpen(false);
                startForm.reset();
                clearStartAttachment();
            },
        });
    };

    const changeStartDialog = (open) => {
        setStartOpen(open);

        if (!open && !startForm.processing) {
            startForm.reset();
            startForm.clearErrors();
            clearStartAttachment();
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
                                        <div className="flex items-center justify-between gap-2">
                                            <p className="truncate font-bold text-slate-900">
                                                {conversation.customer.name}
                                            </p>
                                            {conversation.last_message_at && (
                                                <span className="shrink-0 text-[10px] text-slate-400">
                                                    {messageTime(conversation.last_message_at)}
                                                </span>
                                            )}
                                        </div>
                                        <p className="truncate text-xs text-slate-500">
                                            {conversation.last_message || 'Belum ada pesan'}
                                        </p>
                                        <div className="mt-2 flex items-center gap-2">
                                            <span className={`inline-block size-2 rounded-full ${conversation.status === 'closed' ? 'bg-slate-300' : 'bg-emerald-500'}`} />
                                            <span className="text-[11px] capitalize text-slate-400">
                                                {conversation.status === 'closed' ? 'Ditutup' : 'Aktif'}
                                            </span>
                                            {conversation.unread_count > 0 && (
                                                <span className="ml-auto rounded-full bg-blue-600 px-2 py-0.5 text-[10px] font-bold text-white">
                                                    {conversation.unread_count} baru
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))}

                        {!conversations.length && (
                            <div className="p-8 text-center text-sm text-slate-400">
                                Belum ada percakapan.
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
                                            {message.attachment && (
                                                <ChatAttachment attachment={message.attachment} isMine={mine} />
                                            )}
                                            {message.body && (
                                                <p className={`whitespace-pre-wrap break-words text-sm leading-6 ${message.attachment ? 'mt-2' : ''}`}>
                                                    {message.body}
                                                </p>
                                            )}
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
                            {/* File Attachment Preview */}
                            {replyFilePreview && (
                                <div className="mb-3 flex items-center justify-between gap-3 rounded-xl border border-blue-200 bg-blue-50/70 p-2.5 sm:max-w-md">
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        {replyFilePreview.isImage ? (
                                            <img
                                                src={replyFilePreview.url}
                                                alt="Preview"
                                                className="size-11 rounded-lg object-cover border border-blue-200 shrink-0"
                                            />
                                        ) : (
                                            <span className="grid size-11 shrink-0 place-items-center rounded-lg bg-rose-100 text-rose-600 font-bold">
                                                <FileText className="size-6" />
                                            </span>
                                        )}
                                        <div className="min-w-0">
                                            <p className="truncate text-xs font-bold text-slate-900">{replyFilePreview.name}</p>
                                            <p className="text-[10px] text-slate-500 font-semibold">{formatFileSize(replyFilePreview.size)}</p>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={clearReplyAttachment}
                                        className="rounded-lg p-1 text-slate-400 hover:bg-white hover:text-slate-700 transition"
                                        title="Hapus lampiran"
                                    >
                                        <X className="size-4" />
                                    </button>
                                </div>
                            )}

                            {replyFileError && <p className="mb-2 text-xs font-semibold text-red-600">{replyFileError}</p>}
                            {replyForm.errors.attachment && <p className="mb-2 text-xs font-semibold text-red-600">{replyForm.errors.attachment}</p>}

                            <div className="flex items-end gap-2.5">
                                <input
                                    type="file"
                                    ref={replyFileInputRef}
                                    onChange={handleReplyFileSelect}
                                    accept="image/jpeg,image/png,image/webp,image/gif,application/pdf"
                                    className="hidden"
                                />
                                <ChatEmojiPicker
                                    onSelect={(emoji) => insertEmojiAtCursor(replyTextareaRef, replyForm.data.body, emoji, (text) => replyForm.setData('body', text))}
                                    placement="top-left"
                                />
                                <button
                                    type="button"
                                    onClick={() => replyFileInputRef.current?.click()}
                                    disabled={replyForm.processing}
                                    className="grid size-11 shrink-0 place-items-center rounded-xl border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-blue-600 transition disabled:opacity-50"
                                    title="Lampirkan Gambar atau PDF (Maks. 10MB)"
                                    aria-label="Lampirkan file"
                                >
                                    <Paperclip className="size-5" />
                                </button>

                                <div className="flex-1">
                                    <textarea
                                        ref={replyTextareaRef}
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
                                        placeholder={replyFilePreview ? "Keterangan balasan (opsional)..." : "Tulis balasan..."}
                                        className="app-field resize-none"
                                        aria-label="Balasan"
                                    />
                                    {replyForm.errors.body && (
                                        <p className="mt-1 text-xs font-semibold text-red-600">{replyForm.errors.body}</p>
                                    )}
                                </div>
                                <Button
                                    type="submit"
                                    disabled={replyForm.processing || (!replyForm.data.body?.trim() && !replyForm.data.attachment)}
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
                            Pilih customer terdaftar dan kirim pesan atau dokumen pertama dari admin.
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

                        {/* File Attachment in Start Dialog */}
                        {startFilePreview && (
                            <div className="flex items-center justify-between gap-3 rounded-xl border border-blue-200 bg-blue-50/70 p-2.5">
                                <div className="flex items-center gap-3 overflow-hidden">
                                    {startFilePreview.isImage ? (
                                        <img
                                            src={startFilePreview.url}
                                            alt="Preview"
                                            className="size-11 rounded-lg object-cover border border-blue-200 shrink-0"
                                        />
                                    ) : (
                                        <span className="grid size-11 shrink-0 place-items-center rounded-lg bg-rose-100 text-rose-600 font-bold">
                                            <FileText className="size-6" />
                                        </span>
                                    )}
                                    <div className="min-w-0">
                                        <p className="truncate text-xs font-bold text-slate-900">{startFilePreview.name}</p>
                                        <p className="text-[10px] text-slate-500 font-semibold">{formatFileSize(startFilePreview.size)}</p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={clearStartAttachment}
                                    className="rounded-lg p-1 text-slate-400 hover:bg-white hover:text-slate-700 transition"
                                    title="Hapus lampiran"
                                >
                                    <X className="size-4" />
                                </button>
                            </div>
                        )}

                        {startFileError && <p className="text-xs font-semibold text-red-600">{startFileError}</p>}
                        {startForm.errors.attachment && <p className="text-xs font-semibold text-red-600">{startForm.errors.attachment}</p>}

                        <label className="block">
                            <div className="mb-2 flex items-center justify-between gap-2">
                                <span className="text-sm font-bold">Pesan {startFilePreview ? '(opsional jika ada lampiran)' : ''}</span>
                                <div className="flex items-center gap-2">
                                    <ChatEmojiPicker
                                        onSelect={(emoji) => insertEmojiAtCursor(startTextareaRef, startForm.data.body, emoji, (text) => startForm.setData('body', text))}
                                        placement="top-right"
                                    />
                                    <input
                                        type="file"
                                        ref={startFileInputRef}
                                        onChange={handleStartFileSelect}
                                        accept="image/jpeg,image/png,image/webp,image/gif,application/pdf"
                                        className="hidden"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => startFileInputRef.current?.click()}
                                        className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-100 hover:text-blue-600 transition"
                                    >
                                        <Paperclip className="size-3.5" /> Lampirkan File
                                    </button>
                                </div>
                            </div>
                            <textarea
                                ref={startTextareaRef}
                                value={startForm.data.body}
                                onChange={(event) => startForm.setData('body', event.target.value)}
                                rows="4"
                                maxLength="2000"
                                placeholder="Tulis pesan untuk customer..."
                                className="app-field resize-none"
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
                                type="submit"
                                disabled={startForm.processing || !startForm.data.customer_id || (!startForm.data.body?.trim() && !startForm.data.attachment)}
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
