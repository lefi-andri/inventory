import { Button } from '@/Components/ui/button';
import CustomerAccountLayout from '@/Layouts/CustomerAccountLayout';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import { CheckCheck, Headphones, Send } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { activeLocale } from '@/lib/format';

const messageTime = (value) => new Intl.DateTimeFormat(activeLocale(), {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
}).format(new Date(value));

export default function Chat({ conversation }) {
    const { auth, site } = usePage().props;
    const form = useForm({ body: '' });
    const endRef = useRef(null);
    const messages = conversation?.messages ?? [];

    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages.length]);

    useEffect(() => {
        const interval = window.setInterval(() => {
            if (!form.processing && document.visibilityState === 'visible') {
                router.reload({ only: ['conversation'], preserveScroll: true, preserveState: true });
            }
        }, 4000);

        return () => window.clearInterval(interval);
    }, [form.processing]);

    const submit = (event) => {
        event.preventDefault();
        if (!form.data.body.trim()) return;

        form.post(route('customer.chat.messages.store'), {
            preserveScroll: true,
            onSuccess: () => form.reset('body'),
        });
    };

    return (
        <CustomerAccountLayout title="Chat Bantuan" description={`Hubungi admin ${site.brand_name} untuk bantuan akun, produk, atau pesanan Anda.`}>
            <Head title="Chat Bantuan" />

            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                    <div className="flex items-center gap-3">
                        <span className="grid size-11 place-items-center rounded-xl bg-blue-50 text-blue-600"><Headphones className="size-5" /></span>
                        <div><p className="font-extrabold">Admin {site.brand_name}</p><p className="text-xs text-slate-500">Balasan diperbarui otomatis</p></div>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-bold ${conversation?.status === 'closed' ? 'bg-slate-100 text-slate-600' : 'bg-emerald-50 text-emerald-700'}`}>
                        {conversation?.status === 'closed' ? 'Ditutup' : 'Aktif'}
                    </span>
                </div>

                <div className="h-[min(55vh,520px)] space-y-4 overflow-y-auto bg-slate-50/60 p-4 sm:p-6">
                    {!messages.length && (
                        <div className="grid h-full place-items-center text-center">
                            <div><span className="mx-auto grid size-16 place-items-center rounded-2xl bg-white text-blue-600 shadow-sm"><Headphones className="size-7" /></span><p className="mt-4 font-extrabold">Ada yang bisa kami bantu?</p><p className="mt-1 text-sm text-slate-500">Kirim pesan pertama Anda kepada admin.</p></div>
                        </div>
                    )}

                    {messages.map((message) => {
                        const mine = message.sender_id === auth.user.id;
                        return <div key={message.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}><div className={`max-w-[85%] rounded-2xl px-4 py-3 sm:max-w-[70%] ${mine ? 'rounded-br-md bg-blue-600 text-white' : 'rounded-bl-md border border-slate-200 bg-white text-slate-800'}`}><p className="whitespace-pre-wrap break-words text-sm leading-6">{message.body}</p><p className={`mt-1.5 flex items-center justify-end gap-1 text-[11px] ${mine ? 'text-blue-100' : 'text-slate-400'}`}>{messageTime(message.created_at)} {mine && message.read_at && <CheckCheck className="size-3.5" />}</p></div></div>;
                    })}
                    <div ref={endRef} />
                </div>

                <form onSubmit={submit} className="border-t border-slate-100 p-4">
                    {conversation?.status === 'closed' && <p className="mb-3 text-xs font-semibold text-amber-700">Mengirim pesan baru akan membuka kembali percakapan ini.</p>}
                    <div className="flex items-end gap-3">
                        <div className="flex-1"><textarea value={form.data.body} onChange={(event) => form.setData('body', event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); submit(event); } }} rows="2" maxLength="2000" placeholder="Tulis pesan Anda..." className="app-field resize-none" aria-label="Pesan" />{form.errors.body && <p className="mt-1 text-xs font-semibold text-red-600">{form.errors.body}</p>}</div>
                        <Button disabled={form.processing || !form.data.body.trim()} className="h-11 rounded-xl bg-blue-600 px-4 hover:bg-blue-700"><Send /> <span className="hidden sm:inline">Kirim</span></Button>
                    </div>
                </form>
            </div>
        </CustomerAccountLayout>
    );
}
