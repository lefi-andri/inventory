export const activeLocale = () => document.documentElement.lang === 'en' ? 'en-US' : 'id-ID';

export const currency = (value) =>
    new Intl.NumberFormat(activeLocale(), {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0,
    }).format(Number(value || 0));

export const shortDate = (value) =>
    new Intl.DateTimeFormat(activeLocale(), {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    }).format(new Date(value));

export const statusLabel = {
    new: 'Baru',
    processing: 'Diproses',
    shipped: 'Dikirim',
    completed: 'Selesai',
    cancelled: 'Dibatalkan',
    pending: 'Menunggu',
    paid: 'Lunas',
    failed: 'Gagal',
    refunded: 'Dikembalikan',
    purchase: 'Pembelian',
    adjustment: 'Penyesuaian',
    return: 'Retur',
    damaged: 'Rusak',
    sale: 'Penjualan',
    opening_balance: 'Stok awal',
    order_reservation: 'Alokasi pesanan',
    order_cancellation: 'Pembatalan pesanan',
};
