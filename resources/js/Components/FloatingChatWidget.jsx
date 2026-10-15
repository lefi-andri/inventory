import { Link, usePage } from '@inertiajs/react';
import axios from 'axios';
import { CheckCheck, ChevronDown, Headphones, LoaderCircle, Maximize2, MessageCircle, Send, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { activeLocale } from '@/lib/format';

const messageTime = (value) => new Intl.DateTimeFormat(activeLocale(), {
    hour: '2-digit',
    minute: '2-digit',
}).format(new Date(value));

export default function FloatingChatWidget() {
    const { auth, site } = usePage().props;
    const isCustomer = auth?.roles?.includes('customer');
    const [open, setOpen] = useState(false);
    const [conversation, setConversation] = useState(null);
    const [body, setBody] = useState('');
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);
    const [error, setError] = useState('');
    const endRef = useRef(null);
    const inputRef = useRef(null);

    const refresh = useCallback(async (markRead = false, showLoading = false) => {
        if (!isCustomer) return;
        if (showLoading) setLoading(true);

        try {
            const response = await axios.get(route('customer.chat.messages.index'), {
                params: { mark_read: markRead ? 1 : 0 },
            });
            setConversation(response.data.conversation);
            setError('');
        } catch {
            setError('Chat belum dapat dimuat. Silakan coba lagi.');
        } finally {
            if (showLoading) setLoading(false);
        }
    }, [isCustomer]);

    useEffect(() => {
        if (!isCustomer || route().current('customer.chat.index')) return undefined;

        refresh(false, true);
        const interval = window.setInterval(() => {
            if (document.visibilityState === 'visible') refresh(open);
        }, 4000);

        return () => window.clearInterval(interval);
    }, [isCustomer, open, refresh]);

    useEffect(() => {
        if (!open) return;
        refresh(true);
        window.setTimeout(() => inputRef.current?.focus(), 150);
    }, [open, refresh]);

    useEffect(() => {
        if (open) endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [open, conversation?.messages?.length]);

    if (!isCustomer || route().current('customer.chat.index')) return null;

    const messages = conversation?.messages ?? [];
    const unread = conversation?.unread_count ?? 0;

    const send = async (event) => {
        event.preventDefault();
        const message = body.trim();
        if (!message || sending) return;

        setSending(true);
        setError('');
        try {
            const response = await axios.post(route('customer.chat.messages.store'), { body: message });
            setConversation(response.data.conversation);
            setBody('');
            window.setTimeout(() => inputRef.current?.focus(), 0);
        } catch (requestError) {
            setError(requestError.response?.data?.message || 'Pesan gagal dikirim. Coba kembali.');
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="fixed bottom-5 right-4 z-[60] sm:bottom-6 sm:right-6">
            {open && (
                <section className="absolute bottom-20 right-0 flex h-[min(70vh,570px)] w-[calc(100vw-2rem)] max-w-[390px] origin-bottom-right flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,.28)] animate-in fade-in zoom-in-95">
                    <header className="relative overflow-hidden bg-gradient-to-br from-blue-700 to-blue-600 px-4 py-4 text-white">
                        <div className="absolute -right-7 -top-9 size-28 rounded-full bg-white/10" />
                        <div className="relative flex items-center gap-3">
                            <span className="relative grid size-11 shrink-0 place-items-center rounded-full bg-white/15 ring-1 ring-white/20"><Headphones className="size-5" /><span className="absolute bottom-0 right-0 size-3 rounded-full border-2 border-blue-600 bg-emerald-400" /></span>
                            <div className="min-w-0 flex-1"><h2 className="truncate font-extrabold">Bantuan {site.brand_name}</h2><p className="mt-0.5 text-xs text-blue-100">Admin siap membantu · diperbarui otomatis</p></div>
                            <Link href={route('customer.chat.index')} className="grid size-9 place-items-center rounded-full text-blue-100 hover:bg-white/10 hover:text-white" aria-label="Buka layar penuh"><Maximize2 className="size-4" /></Link>
                            <button type="button" onClick={() => setOpen(false)} className="grid size-9 place-items-center rounded-full text-blue-100 hover:bg-white/10 hover:text-white" aria-label="Tutup chat"><X className="size-5" /></button>
                        </div>
                    </header>

                    <div className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-[#f4f7fb] px-4 py-4">
                        {loading && <div className="grid h-full place-items-center"><LoaderCircle className="size-6 animate-spin text-blue-600" /></div>}
                        {!loading && !messages.length && <div className="grid h-full place-items-center px-6 text-center"><div><span className="mx-auto grid size-14 place-items-center rounded-2xl bg-white text-blue-600 shadow-sm"><MessageCircle className="size-6" /></span><p className="mt-4 font-extrabold text-slate-900">Halo, {auth.user.name.split(' ')[0]}!</p><p className="mt-1 text-sm leading-6 text-slate-500">Tanyakan apa saja tentang produk, akun, atau pesanan Anda.</p></div></div>}
                        {messages.map((message) => {
                            const mine = message.sender_id === auth.user.id;
                            return <div key={message.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}><div className={`max-w-[82%] px-3.5 py-2.5 shadow-sm ${mine ? 'rounded-2xl rounded-br-md bg-blue-600 text-white' : 'rounded-2xl rounded-bl-md border border-slate-200 bg-white text-slate-800'}`}><p className="whitespace-pre-wrap break-words text-sm leading-5">{message.body}</p><p className={`mt-1 flex items-center justify-end gap-1 text-[10px] ${mine ? 'text-blue-100' : 'text-slate-400'}`}>{messageTime(message.created_at)}{mine && message.read_at && <CheckCheck className="size-3" />}</p></div></div>;
                        })}
                        <div ref={endRef} />
                    </div>

                    <form onSubmit={send} className="border-t border-slate-100 bg-white p-3">
                        {conversation?.status === 'closed' && <p className="mb-2 rounded-lg bg-amber-50 px-3 py-2 text-[11px] font-semibold text-amber-700">Pesan baru akan membuka kembali percakapan.</p>}
                        {error && <p className="mb-2 text-xs font-semibold text-red-600">{error}</p>}
                        <div className="flex items-end gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-1.5 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100">
                            <textarea ref={inputRef} value={body} onChange={(event) => setBody(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); send(event); } }} rows="1" maxLength="2000" placeholder="Ketik pesan..." className="max-h-24 min-h-10 flex-1 resize-none border-0 bg-transparent px-2 py-2 text-sm leading-5 outline-none focus:ring-0" aria-label="Ketik pesan" />
                            <button type="submit" disabled={sending || !body.trim()} className="grid size-10 shrink-0 place-items-center rounded-xl bg-blue-600 text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40" aria-label="Kirim pesan">{sending ? <LoaderCircle className="size-4 animate-spin" /> : <Send className="size-4" />}</button>
                        </div>
                        <p className="mt-2 text-center text-[10px] text-slate-400">Enter untuk kirim · Shift + Enter untuk baris baru</p>
                    </form>
                </section>
            )}

            <button type="button" onClick={() => setOpen((current) => !current)} className={`group relative flex h-14 items-center gap-3 rounded-full bg-blue-600 px-4 text-white shadow-[0_12px_35px_rgba(37,99,235,.4)] transition hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-[0_16px_40px_rgba(37,99,235,.45)] ${open ? 'w-14 justify-center px-0' : ''}`} aria-label={open ? 'Minimalkan chat' : 'Buka chat dengan admin'} aria-expanded={open}>
                {open ? <ChevronDown className="size-6" /> : <><MessageCircle className="size-6" /><span className="hidden text-sm font-extrabold sm:inline">Chat Admin</span></>}
                {!open && unread > 0 && <span className="absolute -right-1 -top-1 grid min-w-5 place-items-center rounded-full border-2 border-white bg-red-500 px-1 py-0.5 text-[10px] font-black">{unread > 9 ? '9+' : unread}</span>}
            </button>
        </div>
    );
}
