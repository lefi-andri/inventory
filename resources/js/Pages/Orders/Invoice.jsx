import BrandLogo from '@/Components/BrandLogo';
import { Badge } from '@/Components/ui/badge';
import { Button } from '@/Components/ui/button';
import { currency, shortDate, statusLabel } from '@/lib/format';
import { Head, Link } from '@inertiajs/react';
import {
    ArrowLeft,
    Check,
    CheckCircle2,
    Clock,
    Copy,
    CreditCard,
    FileText,
    HelpCircle,
    Printer,
    ShieldCheck,
    Truck,
    XCircle,
} from 'lucide-react';
import { useState } from 'react';

const statusBadge = (status) => {
    switch (status) {
        case 'paid':
        case 'completed':
            return {
                label: statusLabel[status] || 'Lunas',
                className: 'border-emerald-300 bg-emerald-50 text-emerald-800 font-extrabold',
                icon: CheckCircle2,
            };
        case 'pending':
        case 'new':
            return {
                label: statusLabel[status] || 'Menunggu',
                className: 'border-amber-300 bg-amber-50 text-amber-800 font-extrabold',
                icon: Clock,
            };
        case 'processing':
        case 'shipped':
            return {
                label: statusLabel[status] || 'Diproses',
                className: 'border-blue-300 bg-blue-50 text-blue-800 font-extrabold',
                icon: Truck,
            };
        case 'cancelled':
        case 'failed':
            return {
                label: statusLabel[status] || 'Batal',
                className: 'border-red-300 bg-red-50 text-red-800 font-extrabold',
                icon: XCircle,
            };
        default:
            return {
                label: statusLabel[status] || status,
                className: 'border-slate-300 bg-slate-50 text-slate-700 font-extrabold',
                icon: HelpCircle,
            };
    }
};

export default function OrderInvoice({ order, store, isStaff }) {
    const [copied, setCopied] = useState(false);

    const backUrl = isStaff ? route('orders.index') : route('customer.orders.index');
    const paymentStatus = statusBadge(order.payment_status);
    const orderStatus = statusBadge(order.status);
    const details = order.payment_details || {};
    const curr = order.currency || 'IDR';

    const handlePrint = () => {
        window.print();
    };

    const handleCopy = () => {
        if (typeof window !== 'undefined') {
            navigator.clipboard.writeText(window.location.href);
            setCopied(true);
            setTimeout(() => setCopied(false), 2500);
        }
    };

    return (
        <div className="min-h-screen bg-slate-100/80 py-6 sm:py-10 text-slate-900 print:bg-white print:py-0">
            <Head title={`Invoice #${order.order_number} - ${store.name}`} />

            {/* Top Interactive Bar (Hidden when printing) */}
            <div className="mx-auto mb-6 max-w-4xl px-4 print:hidden">
                <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm">
                    <div className="flex items-center gap-3">
                        <Button variant="outline" size="sm" asChild className="rounded-xl">
                            <Link href={backUrl}>
                                <ArrowLeft className="size-4" />
                                {isStaff ? 'Kembali ke Pesanan' : 'Kembali ke Pesanan Saya'}
                            </Link>
                        </Button>
                        <div className="hidden sm:block h-6 w-px bg-slate-200" />
                        <span className="hidden sm:inline-flex items-center gap-2 text-xs font-semibold text-slate-500">
                            Invoice <strong className="text-slate-800">#{order.order_number}</strong>
                        </span>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleCopy}
                            className="rounded-xl"
                            title="Salin tautan invoice"
                        >
                            {copied ? (
                                <>
                                    <Check className="size-4 text-emerald-600" />
                                    <span className="text-emerald-700 font-bold">Tersalin!</span>
                                </>
                            ) : (
                                <>
                                    <Copy className="size-4 text-slate-600" />
                                    <span className="hidden sm:inline">Salin Link</span>
                                </>
                            )}
                        </Button>

                        <Button
                            type="button"
                            size="sm"
                            onClick={handlePrint}
                            className="rounded-xl bg-blue-600 font-extrabold text-white shadow-sm hover:bg-blue-700 gap-2"
                        >
                            <Printer className="size-4" />
                            <span>Cetak / Unduh PDF</span>
                        </Button>
                    </div>
                </div>
            </div>

            {/* Printable Invoice Paper Canvas */}
            <main
                id="invoice-paper"
                className="mx-auto max-w-4xl rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-12 shadow-xl print:m-0 print:max-w-none print:rounded-none print:border-none print:p-0 print:shadow-none"
            >
                {/* Invoice Header */}
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6 border-b border-slate-200/90 pb-8">
                    <div className="space-y-3">
                        <div className="flex items-center gap-3">
                            {store.logo ? (
                                <img
                                    src={store.logo}
                                    alt={store.name}
                                    className="h-12 w-auto max-w-[180px] object-contain rounded-xl"
                                />
                            ) : (
                                <BrandLogo className="size-11 rounded-xl" />
                            )}
                            <div>
                                <h1 className="text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
                                    {store.name}
                                </h1>
                                <p className="text-xs font-semibold text-blue-600 uppercase tracking-widest">
                                    Official Store Receipt
                                </p>
                            </div>
                        </div>

                        {store.description && (
                            <p className="max-w-sm text-xs text-slate-500 leading-relaxed">
                                {store.description}
                            </p>
                        )}
                    </div>

                    <div className="text-left sm:text-right space-y-2">
                        <div className="inline-flex items-center gap-2 rounded-xl bg-blue-50 px-3.5 py-1.5 border border-blue-100">
                            <FileText className="size-4 text-blue-600" />
                            <span className="text-xs font-black uppercase tracking-wider text-blue-700">INVOICE</span>
                        </div>

                        <p className="text-lg font-black tracking-tight text-slate-900">
                            #{order.order_number}
                        </p>

                        <div className="flex flex-wrap items-center gap-2 sm:justify-end pt-1">
                            <Badge variant="outline" className={`gap-1 px-2.5 py-1 text-xs ${paymentStatus.className}`}>
                                <paymentStatus.icon className="size-3.5" />
                                {paymentStatus.label}
                            </Badge>

                            <Badge variant="outline" className={`gap-1 px-2.5 py-1 text-xs ${orderStatus.className}`}>
                                <orderStatus.icon className="size-3.5" />
                                {orderStatus.label}
                            </Badge>
                        </div>
                    </div>
                </div>

                {/* Meta details (Dates & Reference) */}
                <div className="grid grid-cols-2 gap-4 border-b border-slate-100 py-4 text-xs text-slate-600 sm:grid-cols-4">
                    <div>
                        <span className="block font-medium text-slate-400">Tanggal Transaksi</span>
                        <strong className="text-slate-800">{order.created_at ? shortDate(order.created_at) : '-'}</strong>
                    </div>
                    <div>
                        <span className="block font-medium text-slate-400">Tanggal Cetak</span>
                        <strong className="text-slate-800">{shortDate(new Date())}</strong>
                    </div>
                    <div>
                        <span className="block font-medium text-slate-400">Metode Pembayaran</span>
                        <strong className="text-slate-800">{order.payment_method_label}</strong>
                    </div>
                    <div>
                        <span className="block font-medium text-slate-400">Mata Uang</span>
                        <strong className="text-slate-800">{curr} ({curr === 'USD' ? 'US Dollar' : 'Rupiah'})</strong>
                    </div>
                </div>

                {/* Billed To & Shipping Details Grid */}
                <div className="grid gap-6 py-6 sm:grid-cols-2">
                    <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-5">
                        <h2 className="text-xs font-black uppercase tracking-wider text-slate-500 mb-3">
                            Informasi Pembeli
                        </h2>
                        <div className="space-y-1.5 text-sm">
                            <p className="font-extrabold text-slate-950 text-base">{order.customer_name}</p>
                            <p className="text-slate-600 text-xs">{order.customer_email}</p>
                            {order.customer_phone && (
                                <p className="text-slate-600 text-xs">{order.customer_phone}</p>
                            )}
                            <div className="pt-2">
                                <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                    Alamat Pengiriman
                                </span>
                                <p className="mt-1 text-xs leading-relaxed text-slate-700 whitespace-pre-line">
                                    {order.shipping_address || '-'}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-5">
                        <h2 className="text-xs font-black uppercase tracking-wider text-slate-500 mb-3">
                            Logistik & Pengiriman
                        </h2>
                        <div className="space-y-2 text-sm">
                            <div>
                                <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                    Ekspedisi / Kurir
                                </span>
                                <p className="font-bold text-slate-800 text-xs">{order.shipping_method}</p>
                            </div>

                            {order.received_at && (
                                <div>
                                    <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                        Waktu Penerimaan
                                    </span>
                                    <p className="font-bold text-emerald-700 text-xs flex items-center gap-1.5">
                                        <CheckCircle2 className="size-3.5" /> Diterima pada {shortDate(order.received_at)}
                                    </p>
                                </div>
                            )}

                            {details.bank_name && (
                                <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-2.5 text-xs">
                                    <p className="font-bold text-blue-900">
                                        Transfer: {details.bank_name} {details.account_number}
                                    </p>
                                    <p className="text-blue-700 text-[11px]">a.n. {details.account_name}</p>
                                </div>
                            )}

                            {order.notes && (
                                <div className="pt-1">
                                    <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                        Catatan Pelanggan
                                    </span>
                                    <p className="text-xs text-slate-600 italic">"{order.notes}"</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Line Items Table */}
                <div className="mt-2 overflow-hidden rounded-2xl border border-slate-200">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-[11px] font-black uppercase tracking-wider text-slate-500 border-b border-slate-200">
                            <tr>
                                <th className="py-3 px-4 w-12 text-center">#</th>
                                <th className="py-3 px-4">Deskripsi Produk</th>
                                <th className="py-3 px-4 w-28">SKU</th>
                                <th className="py-3 px-4 text-right w-32">Harga Satuan</th>
                                <th className="py-3 px-4 text-center w-20">Qty</th>
                                <th className="py-3 px-4 text-right w-36">Total</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {order.items.map((item, index) => (
                                <tr key={item.id} className="hover:bg-slate-50/50">
                                    <td className="py-3.5 px-4 text-center text-xs font-semibold text-slate-400">
                                        {index + 1}
                                    </td>
                                    <td className="py-3.5 px-4">
                                        <p className="font-extrabold text-slate-900">{item.product_name}</p>
                                    </td>
                                    <td className="py-3.5 px-4 font-mono text-xs text-slate-500">
                                        {item.sku}
                                    </td>
                                    <td className="py-3.5 px-4 text-right font-semibold text-slate-700">
                                        {currency(item.price, curr)}
                                    </td>
                                    <td className="py-3.5 px-4 text-center font-bold text-slate-800">
                                        {item.quantity}
                                    </td>
                                    <td className="py-3.5 px-4 text-right font-extrabold text-slate-900">
                                        {currency(item.subtotal, curr)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Financial Summary & Verification Seal */}
                <div className="mt-6 grid gap-6 sm:grid-cols-2 items-start">
                    {/* Left: Verification Badge & Payment Confirmation Notice */}
                    <div className="space-y-4">
                        <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
                            <div className="flex items-center gap-3">
                                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-emerald-100 text-emerald-700">
                                    <ShieldCheck className="size-5" />
                                </span>
                                <div>
                                    <p className="text-xs font-black uppercase tracking-wider text-slate-800">
                                        Dokumen Transaksi Digital Sah
                                    </p>
                                    <p className="text-[11px] text-slate-500 leading-relaxed mt-0.5">
                                        Diterbitkan secara otomatis oleh sistem {store.name} dengan integritas catatan transaksi permanen.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {details.instructions && (
                            <div className="rounded-2xl border border-slate-200 bg-white p-4 text-xs text-slate-600">
                                <span className="block font-bold text-slate-800 mb-1">Petunjuk Pembayaran:</span>
                                <p className="whitespace-pre-line leading-relaxed text-[11px]">{details.instructions}</p>
                            </div>
                        )}
                    </div>

                    {/* Right: Calculation Table */}
                    <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-5 space-y-2.5 text-sm">
                        <div className="flex justify-between text-slate-600">
                            <span>Subtotal Belanja</span>
                            <span className="font-bold text-slate-800">{currency(order.subtotal, curr)}</span>
                        </div>

                        {order.discount_amount > 0 && (
                            <div className="flex justify-between font-bold text-emerald-700">
                                <span>Diskon Promosi {order.promotion_code ? `(${order.promotion_code})` : ''}</span>
                                <span>-{currency(order.discount_amount, curr)}</span>
                            </div>
                        )}

                        <div className="flex justify-between text-slate-600">
                            <span>Biaya Pengiriman ({order.shipping_method})</span>
                            <span className="font-bold text-slate-800">
                                {order.shipping_cost > 0 ? currency(order.shipping_cost, curr) : 'Gratis'}
                            </span>
                        </div>

                        <div className="border-t border-slate-200 pt-3 flex justify-between items-baseline">
                            <div>
                                <span className="text-base font-black text-slate-950 block">Total Tagihan</span>
                                <span className="text-[11px] font-semibold text-slate-500">Termasuk pajak & biaya admin</span>
                            </div>
                            <span className="text-2xl font-black tracking-tight text-blue-600">
                                {currency(order.total, curr)}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Footer notes */}
                <div className="mt-10 border-t border-slate-200/90 pt-6 text-center text-xs text-slate-400 space-y-1">
                    <p className="font-semibold text-slate-500">
                        Terima kasih telah berbelanja di {store.name}. Simpan invoice ini sebagai bukti transaksi resmi Anda.
                    </p>
                    <p className="text-[11px]">
                        {store.copyright || `© ${new Date().getFullYear()} ${store.name}. Semua hak dilindungi.`}
                    </p>
                </div>
            </main>

            {/* Print style block */}
            <style>{`
                @media print {
                    body {
                        background-color: #ffffff !important;
                        color: #000000 !important;
                    }
                    @page {
                        size: A4;
                        margin: 12mm 15mm;
                    }
                    #invoice-paper {
                        box-shadow: none !important;
                        border: none !important;
                        padding: 0 !important;
                        max-width: 100% !important;
                        margin: 0 !important;
                    }
                }
            `}</style>
        </div>
    );
}
