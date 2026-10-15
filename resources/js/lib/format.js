export const activeLocale = () => (typeof document !== 'undefined' && document.documentElement?.lang === 'en' ? 'en-US' : 'id-ID');

export const getActiveCurrency = () => {
    if (typeof window !== 'undefined' && (window.__TITHOSHOP_CURRENCY__ || window.__STOKARA_CURRENCY__)) {
        return window.__TITHOSHOP_CURRENCY__ || window.__STOKARA_CURRENCY__;
    }
    if (typeof document !== 'undefined' && document.documentElement?.dataset?.currency) {
        return document.documentElement.dataset.currency;
    }
    return 'IDR';
};

export const setGlobalCurrency = (curr) => {
    if (!curr) return;
    const normalized = curr.toUpperCase() === 'USD' ? 'USD' : 'IDR';
    if (typeof window !== 'undefined') {
        window.__TITHOSHOP_CURRENCY__ = normalized;
        window.__STOKARA_CURRENCY__ = normalized;
    }
    if (typeof document !== 'undefined' && document.documentElement) {
        document.documentElement.dataset.currency = normalized;
    }
};

export const currencySymbol = (customCurrency) => {
    const activeCurr = (customCurrency ? customCurrency.toUpperCase() : null) || getActiveCurrency();
    return activeCurr === 'USD' ? '$' : 'Rp';
};

export const currency = (value, customCurrency) => {
    const activeCurr = (customCurrency ? customCurrency.toUpperCase() : null) || getActiveCurrency();
    const isUSD = activeCurr === 'USD';
    const locale = isUSD ? 'en-US' : activeLocale();

    return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: isUSD ? 'USD' : 'IDR',
        minimumFractionDigits: isUSD ? 2 : 0,
        maximumFractionDigits: isUSD ? 2 : 0,
    }).format(Number(value || 0));
};

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
