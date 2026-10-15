import {
    Heart,
    Package,
    Search,
    Smile,
    ThumbsUp,
    X,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

const EMOJI_CATEGORIES = [
    {
        id: 'smileys',
        name: 'Senyum & Ekspresi',
        icon: Smile,
        emojis: [
            { char: '😀', keywords: 'grinning senyum senang' },
            { char: '😃', keywords: 'smiley bahagia senyum tertawa' },
            { char: '😄', keywords: 'smile tertawa mata tertutup riang' },
            { char: '😁', keywords: 'beam nyengir gembira' },
            { char: '😆', keywords: 'laughing tawa ngakak puas' },
            { char: '😅', keywords: 'sweat smile keringat lega senyum' },
            { char: '🤣', keywords: 'rofl ngakak guling lucu' },
            { char: '😂', keywords: 'joy tertawa menangis haru lucu' },
            { char: '🙂', keywords: 'slightly smiling senyum tipis sopan' },
            { char: '🙃', keywords: 'upside down terbalik canda' },
            { char: '😉', keywords: 'wink kedip genit paham' },
            { char: '😊', keywords: 'blush tersipu ramah hangat' },
            { char: '😇', keywords: 'innocent malaikat suci baik' },
            { char: '🥰', keywords: 'smiling hearts cinta sayang suka' },
            { char: '😍', keywords: 'heart eyes naksir takjub suka' },
            { char: '🤩', keywords: 'star struck terpukau bintang wow' },
            { char: '😘', keywords: 'kissing cium salam sayang' },
            { char: '😗', keywords: 'kiss ciuman' },
            { char: '😚', keywords: 'kiss closed eyes manis' },
            { char: '😋', keywords: 'yum enak lezat sedap' },
            { char: '😛', keywords: 'tongue julur lidah' },
            { char: '😜', keywords: 'wink tongue usil jail lucu' },
            { char: '🤪', keywords: 'zany gila konyol lucu' },
            { char: '😝', keywords: 'squinting tongue canda' },
            { char: '🤗', keywords: 'hugging peluk rangkul sambut' },
            { char: '🤭', keywords: 'hand over mouth tersipu kaget ops' },
            { char: '🤫', keywords: 'shushing diam rahasia sst' },
            { char: '🤔', keywords: 'thinking mikir bertanya ragu pertimbangan' },
            { char: '🤐', keywords: 'zipper mouth bungkam diam' },
            { char: '🤨', keywords: 'raised eyebrow heran curiga ragu' },
            { char: '😐', keywords: 'neutral netral datar biasa' },
            { char: '😑', keywords: 'expressionless tanpa ekspresi datar' },
            { char: '😶', keywords: 'no mouth hening tanpa kata' },
            { char: '😏', keywords: 'smirk nakal paham sinis' },
            { char: '😒', keywords: 'unamused malas kesal bosan' },
            { char: '🙄', keywords: 'rolling eyes memutar mata capek' },
            { char: '😬', keywords: 'grimacing canggung meringis waduh' },
            { char: '😌', keywords: 'relieved lega tenang rileks' },
            { char: '😔', keywords: 'pensive sedih murung lesu' },
            { char: '😪', keywords: 'sleepy mengantuk lelah' },
            { char: '😴', keywords: 'sleeping tidur lelap' },
            { char: '😷', keywords: 'mask masker sakit sehat' },
            { char: '🤒', keywords: 'thermometer demam tidak enak badan' },
            { char: '🤕', keywords: 'bandage luka perban' },
            { char: '🥵', keywords: 'hot kepanasan gerah terik' },
            { char: '🥶', keywords: 'cold kedinginan beku' },
            { char: '🥴', keywords: 'woozy pusing mabuk oleng' },
            { char: '😵', keywords: 'dizzy pusing muter' },
            { char: '🤯', keywords: 'exploding head pikiran meledak kaget luar biasa' },
            { char: '🥳', keywords: 'partying pesta selamat hore perayaan' },
            { char: '😎', keywords: 'cool keren kacamata mantap gaya' },
            { char: '🤓', keywords: 'nerd kacamata pintar teliti' },
            { char: '🧐', keywords: 'monocle teliti amati inspeksi' },
            { char: '😕', keywords: 'confused bingung tidak paham' },
            { char: '😟', keywords: 'worried cemas khawatir' },
            { char: '🥺', keywords: 'pleading mohon tolong memelas tatap' },
            { char: '😮', keywords: 'open mouth wow terbuka kaget' },
            { char: '😲', keywords: 'astonished terkejut kaget heran' },
            { char: '😳', keywords: 'flushed malu terkejut salah tingkah' },
            { char: '😦', keywords: 'frowning sedih cemas' },
            { char: '😨', keywords: 'fearful takut panik' },
            { char: '😰', keywords: 'anxious gugup panik keringat' },
            { char: '😥', keywords: 'sad relieved sedih tapi lega' },
            { char: '😢', keywords: 'crying menangis air mata sedih' },
            { char: '😭', keywords: 'sob nangis kejer sedih haru terharu' },
            { char: '😱', keywords: 'scream teriak histeris kaget banget' },
            { char: '😖', keywords: 'confounded kesal jengkel tertekan' },
            { char: '😣', keywords: 'persevering berjuang tahan sakit' },
            { char: '😞', keywords: 'disappointed kecewa patah semangat' },
            { char: '😓', keywords: 'downcast sweat lelah pasrah capek' },
            { char: '😩', keywords: 'weary mengeluh capek' },
            { char: '😫', keywords: 'tired lelah letih' },
            { char: '🥱', keywords: 'yawning menguap bosan ngantuk' },
            { char: '😤', keywords: 'triumph dengus bangga kesal tekad' },
            { char: '😡', keywords: 'pouting marah emosi ngamuk' },
            { char: '😠', keywords: 'angry marah kesal sewot' },
        ],
    },
    {
        id: 'gestures',
        name: 'Gestur & Tangan',
        icon: ThumbsUp,
        emojis: [
            { char: '👍', keywords: 'thumbs up jempol setuju mantap oke sip bagus yes ok' },
            { char: '👎', keywords: 'thumbs down tidak setuju jelek buruk no' },
            { char: '👌', keywords: 'ok hand oke mantap pas sempurna siap' },
            { char: '🤌', keywords: 'pinched fingers maksud apa lezat detail' },
            { char: '🤏', keywords: 'pinching hand sedikit mungil kecil tipis' },
            { char: '✌️', keywords: 'peace damai dua salam' },
            { char: '🤞', keywords: 'crossed fingers semoga harapan amin beruntung' },
            { char: '🤟', keywords: 'love you cinta metal salam' },
            { char: '🤘', keywords: 'sign of the horns rock keren metal' },
            { char: '🤙', keywords: 'call me hubungi telepon santai mantap' },
            { char: '👈', keywords: 'point left tunjuk kiri sini ini' },
            { char: '👉', keywords: 'point right tunjuk kanan itu sana cek' },
            { char: '👆', keywords: 'point up tunjuk atas lihat atas penting' },
            { char: '👇', keywords: 'point down tunjuk bawah link tautan berkas' },
            { char: '☝️', keywords: 'index up telunjuk ingat nomor satu' },
            { char: '✋', keywords: 'raised hand angkat tangan stop tunggu' },
            { char: '🤚', keywords: 'raised back of hand salam tunggu' },
            { char: '🖐️', keywords: 'hand splayed lima tangan terbuka' },
            { char: '👋', keywords: 'wave lambaian halo selamat tinggal dadah hi' },
            { char: '🤝', keywords: 'handshake jabat tangan sepakat deal terima kasih' },
            { char: '👏', keywords: 'clapping tepuk tangan apresiasi hebat selamat bravo' },
            { char: '🙌', keywords: 'raising hands angkat tangan hore syukur mantap' },
            { char: '🤲', keywords: 'palms up doa terima kasih harap' },
            { char: '🙏', keywords: 'folded hands terima kasih tolong maaf salam amin hormat' },
            { char: '✍️', keywords: 'writing menulis catat tanda tangan' },
            { char: '💪', keywords: 'flexed biceps semangat kuat perkasa dorongan' },
        ],
    },
    {
        id: 'hearts',
        name: 'Hati & Reaksi',
        icon: Heart,
        emojis: [
            { char: '❤️', keywords: 'red heart hati cinta merah suka sayang' },
            { char: '🧡', keywords: 'orange heart oranye hangat' },
            { char: '💛', keywords: 'yellow heart kuning ceria persahabatan' },
            { char: '💚', keywords: 'green heart hijau segar alami' },
            { char: '💙', keywords: 'blue heart biru tenang adem' },
            { char: '💜', keywords: 'purple heart ungu mewah manis' },
            { char: '🖤', keywords: 'black heart hitam elegan' },
            { char: '🤍', keywords: 'white heart putih tulus suci' },
            { char: '🤎', keywords: 'brown heart cokelat' },
            { char: '💔', keywords: 'broken heart patah hati sedih kecewa' },
            { char: '❣️', keywords: 'heart exclamation seru cinta mantap' },
            { char: '💕', keywords: 'two hearts dua hati manis' },
            { char: '💞', keywords: 'revolving hearts berputar suka' },
            { char: '💓', keywords: 'beating heart berdegup senang' },
            { char: '💗', keywords: 'growing heart berkembang cinta' },
            { char: '💖', keywords: 'sparkling heart bersinar kelap-kelip' },
            { char: '💘', keywords: 'cupid panah asmara' },
            { char: '💝', keywords: 'ribbon heart kado hadiah spesial' },
            { char: '✨', keywords: 'sparkles kilau bersih baru mengkilap berkilau' },
            { char: '⭐', keywords: 'star bintang favorit bagus' },
            { char: '🌟', keywords: 'glowing star bersinar terang jempolan' },
            { char: '💫', keywords: 'dizzy bintang keliling pusing' },
            { char: '💥', keywords: 'collision ledakan promo heboh boom' },
            { char: '🔥', keywords: 'fire api laris panas trending hot mantap' },
            { char: '💯', keywords: 'hundred seratus sempurna nilai maksimal oke banget' },
            { char: '🎉', keywords: 'party popper selamat hore perayaan berkah berhasil' },
            { char: '🎊', keywords: 'confetti pesta sukses' },
        ],
    },
    {
        id: 'commerce',
        name: 'Belanja & Pengiriman',
        icon: Package,
        emojis: [
            { char: '🛍️', keywords: 'shopping bags belanja kantong tas produk storefront' },
            { char: '🛒', keywords: 'shopping cart keranjang checkout order pesanan beli' },
            { char: '📦', keywords: 'package paket dus barang pengiriman kurir stok' },
            { char: '🏷️', keywords: 'label tag harga diskon promo kode voucher' },
            { char: '💳', keywords: 'credit card kartu kredit debit pembayaran transfer bayar' },
            { char: '💵', keywords: 'dollar uang tunai cash bayar cod' },
            { char: '💰', keywords: 'money bag kantong uang rupiah saldo hemat' },
            { char: '🪙', keywords: 'coin koin keping' },
            { char: '🧾', keywords: 'receipt struk kwitansi tagihan invoice nota bukti' },
            { char: '🚚', keywords: 'truck truk pengiriman ekspedisi kurir kirim' },
            { char: '🚛', keywords: 'lorry truk besar kargo antar' },
            { char: '🛵', keywords: 'scooter motor kurir cepat instan sameday' },
            { char: '🚲', keywords: 'bicycle sepeda ramah lingkungan' },
            { char: '🎁', keywords: 'gift kado hadiah bingkisan bonus gratis' },
            { char: '🏬', keywords: 'department store toko grosir retail mall' },
            { char: '🏪', keywords: 'convenience store toko minimarket buka' },
            { char: '📱', keywords: 'mobile phone hp handphone gadget chat whatsapp' },
            { char: '💻', keywords: 'laptop komputer pc admin' },
            { char: '📞', keywords: 'telephone telepon hubungi call suara kontak' },
            { char: '✉️', keywords: 'envelope surat email konfirmasi pesan' },
            { char: '📝', keywords: 'memo catatan memo tulis resep catatan' },
            { char: '📅', keywords: 'calendar kalender jadwal tanggal hari waktu' },
            { char: '⏰', keywords: 'alarm clock jam beker pengingat deadline' },
            { char: '⏱️', keywords: 'stopwatch waktu hitung mundur cepat' },
            { char: '⌛', keywords: 'hourglass jam pasir proses tunggu pending' },
            { char: '🔔', keywords: 'bell lonceng notifikasi pemberitahuan aktif' },
            { char: '📢', keywords: 'loudspeaker pengumuman info penting broadcast' },
            { char: '💡', keywords: 'bulb ide lampu solusi saran tips' },
            { char: '🔒', keywords: 'locked gembok aman privasi enkripsi' },
            { char: '✅', keywords: 'check checklist sukses selesai terverifikasi lunas' },
            { char: '📍', keywords: 'pin map lokasi alamat tujuan pengiriman tujuan' },
        ],
    },
];

const POPULAR_QUICK_EMOJIS = ['😀', '😊', '👍', '🙏', '❤️', '📦', '🛒', '🎉'];

export default function ChatEmojiPicker({
    onSelect,
    className = '',
    placement = 'top-left', // 'top-left' | 'top-right'
}) {
    const [open, setOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('smileys');
    const [search, setSearch] = useState('');
    const containerRef = useRef(null);
    const searchInputRef = useRef(null);

    // Close on click outside or Escape
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setOpen(false);
            }
        };

        const handleKeyDown = (event) => {
            if (event.key === 'Escape') {
                setOpen(false);
            }
        };

        if (open) {
            document.addEventListener('mousedown', handleClickOutside);
            document.addEventListener('keydown', handleKeyDown);
            window.setTimeout(() => searchInputRef.current?.focus(), 50);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [open]);

    const handleSelect = (emoji) => {
        if (onSelect) {
            onSelect(emoji);
        }
    };

    const filteredEmojis = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return null;

        const results = [];
        for (const cat of EMOJI_CATEGORIES) {
            for (const item of cat.emojis) {
                if (item.keywords.toLowerCase().includes(q) || item.char.includes(q)) {
                    results.push(item.char);
                }
            }
        }
        return results;
    }, [search]);

    const currentCategory = useMemo(() => {
        return EMOJI_CATEGORIES.find((c) => c.id === activeTab) || EMOJI_CATEGORIES[0];
    }, [activeTab]);

    return (
        <div className={`relative ${className}`} ref={containerRef}>
            <button
                type="button"
                onClick={() => setOpen(!open)}
                className={`grid size-9 sm:size-10 shrink-0 place-items-center rounded-xl border transition ${
                    open
                        ? 'border-amber-300 bg-amber-50 text-amber-700 shadow-xs'
                        : 'border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-amber-600'
                }`}
                title="Sisipkan Emotikon / Emoji"
                aria-label="Sisipkan emotikon"
            >
                <Smile className="size-4.5 sm:size-5" />
            </button>

            {open && (
                <div
                    className={`absolute bottom-full mb-2 z-50 flex w-[calc(100vw-2.5rem)] max-w-[320px] sm:max-w-[350px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-150 ${
                        placement === 'top-right' ? 'right-0' : 'left-0 sm:left-auto'
                    }`}
                >
                    {/* Header: Quick Bar & Search */}
                    <div className="border-b border-slate-100 bg-slate-50/80 p-2.5">
                        <div className="relative">
                            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
                            <input
                                ref={searchInputRef}
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Cari emotikon... (senyum, jempol, hati, paket)"
                                className="h-8 w-full rounded-xl border border-slate-200 bg-white pl-8 pr-7 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:border-amber-400 focus:ring-1 focus:ring-amber-200 outline-none"
                            />
                            {search && (
                                <button
                                    type="button"
                                    onClick={() => setSearch('')}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                >
                                    <X className="size-3.5" />
                                </button>
                            )}
                        </div>

                        {/* Quick Selection Bar */}
                        {!search && (
                            <div className="mt-2 flex items-center justify-between gap-1 px-1">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Cepat:</span>
                                <div className="flex items-center gap-1">
                                    {POPULAR_QUICK_EMOJIS.map((emoji) => (
                                        <button
                                            key={emoji}
                                            type="button"
                                            onClick={() => handleSelect(emoji)}
                                            className="grid size-7 place-items-center rounded-lg text-base hover:bg-white hover:scale-110 hover:shadow-xs transition"
                                        >
                                            {emoji}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Category Tabs (shown when not searching) */}
                    {!search && (
                        <div className="flex border-b border-slate-100 bg-white px-2 pt-1.5 gap-1">
                            {EMOJI_CATEGORIES.map((cat) => {
                                const Icon = cat.icon;
                                const isActive = activeTab === cat.id;
                                return (
                                    <button
                                        key={cat.id}
                                        type="button"
                                        onClick={() => setActiveTab(cat.id)}
                                        className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-bold transition ${
                                            isActive
                                                ? 'bg-amber-50 text-amber-800'
                                                : 'text-slate-400 hover:bg-slate-50 hover:text-slate-700'
                                        }`}
                                        title={cat.name}
                                    >
                                        <Icon className="size-3.5" />
                                        <span className="hidden sm:inline text-[11px] truncate">{cat.name.split(' ')[0]}</span>
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    {/* Emoji Grid Container */}
                    <div className="h-56 overflow-y-auto p-2.5">
                        {search ? (
                            <div>
                                <p className="mb-2 text-[11px] font-bold text-slate-500">
                                    Hasil pencarian ({filteredEmojis.length}):
                                </p>
                                <div className="grid grid-cols-7 sm:grid-cols-8 gap-1">
                                    {filteredEmojis.map((emoji, index) => (
                                        <button
                                            key={`${emoji}-${index}`}
                                            type="button"
                                            onClick={() => handleSelect(emoji)}
                                            className="grid size-9 place-items-center rounded-xl text-lg hover:bg-slate-100 hover:scale-115 active:scale-95 transition"
                                        >
                                            {emoji}
                                        </button>
                                    ))}
                                    {filteredEmojis.length === 0 && (
                                        <div className="col-span-full py-8 text-center text-xs text-slate-400">
                                            Tidak ada emotikon yang cocok dengan kata kunci.
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div>
                                <p className="mb-2 text-[11px] font-bold text-slate-500">
                                    {currentCategory.name}
                                </p>
                                <div className="grid grid-cols-7 sm:grid-cols-8 gap-1">
                                    {currentCategory.emojis.map((item) => (
                                        <button
                                            key={item.char}
                                            type="button"
                                            onClick={() => handleSelect(item.char)}
                                            className="grid size-9 place-items-center rounded-xl text-lg hover:bg-slate-100 hover:scale-115 active:scale-95 transition"
                                            title={item.keywords}
                                        >
                                            {item.char}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer Tip */}
                    <div className="border-t border-slate-100 bg-slate-50/70 px-3 py-1.5 text-center text-[10px] text-slate-400">
                        Klik emotikon untuk menyisipkan ke pesan
                    </div>
                </div>
            )}
        </div>
    );
}

/**
 * Utility helper to insert an emoji at the current cursor position of a textarea or input.
 */
export function insertEmojiAtCursor(inputRef, currentText, emoji, setTextCallback) {
    const el = inputRef?.current;
    if (!el) {
        setTextCallback((currentText || '') + emoji);
        return;
    }

    const start = el.selectionStart ?? (currentText?.length || 0);
    const end = el.selectionEnd ?? (currentText?.length || 0);
    const text = currentText || '';
    const updated = text.substring(0, start) + emoji + text.substring(end);

    setTextCallback(updated);

    window.setTimeout(() => {
        el.focus();
        const nextPos = start + emoji.length;
        el.selectionStart = nextPos;
        el.selectionEnd = nextPos;
    }, 0);
}
