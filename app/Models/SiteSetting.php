<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;

class SiteSetting extends Model implements HasMedia
{
    use InteractsWithMedia;

    protected $fillable = [
        'brand_name',
        'theme_color',
        'navbar_links',
        'footer_description',
        'footer_copyright',
        'footer_links',
        'cookie_consent_enabled',
        'cookie_consent_title',
        'cookie_consent_message',
        'privacy_policy_title',
        'privacy_policy_content',
        'cookie_policy_title',
        'cookie_policy_content',
    ];

    protected function casts(): array
    {
        return [
            'navbar_links' => 'array',
            'footer_links' => 'array',
            'cookie_consent_enabled' => 'boolean',
        ];
    }

    public function registerMediaCollections(): void
    {
        $this->addMediaCollection('site-logo')
            ->singleFile()
            ->acceptsMimeTypes(['image/jpeg', 'image/png', 'image/webp']);

        $this->addMediaCollection('site-favicon')
            ->singleFile()
            ->acceptsMimeTypes([
                'image/x-icon',
                'image/vnd.microsoft.icon',
                'image/png',
                'image/jpeg',
                'image/webp',
                'image/svg+xml',
            ]);
    }

    public static function current(): self
    {
        return static::query()->first() ?? static::query()->create([
            'brand_name' => 'Stokara',
            'theme_color' => \App\Support\ThemeColor::DEFAULT_COLOR,
            'navbar_links' => static::defaultNavbarLinks(),
            'footer_description' => 'Produk fungsional untuk keseharian modern.',
            'footer_copyright' => '© '.now()->year.' Stokara. Semua hak dilindungi.',
            'footer_links' => [],
            'cookie_consent_enabled' => true,
            'cookie_consent_title' => static::defaultCookieConsentTitle(),
            'cookie_consent_message' => static::defaultCookieConsentMessage(),
            'privacy_policy_title' => static::defaultPrivacyPolicyTitle(),
            'privacy_policy_content' => static::defaultPrivacyPolicyContent(),
            'cookie_policy_title' => static::defaultCookiePolicyTitle(),
            'cookie_policy_content' => static::defaultCookiePolicyContent(),
        ]);
    }

    public static function defaultNavbarLinks(): array
    {
        return [
            ['label' => 'Produk', 'url' => '#produk', 'is_active' => true],
            ['label' => 'Layanan', 'url' => '#benefit', 'is_active' => true],
        ];
    }

    public static function defaultCookieConsentTitle(): string
    {
        return 'Persetujuan Privasi & Cookie';
    }

    public static function defaultCookieConsentMessage(): string
    {
        return 'Kami menggunakan cookie dan teknologi serupa untuk memastikan sistem berfungsi optimal, menjaga keamanan sesi belanja, serta mempersonalisasi preferensi bahasa dan tema Anda sesuai regulasi perlindungan data yang berlaku.';
    }

    public static function defaultPrivacyPolicyTitle(): string
    {
        return 'Kebijakan Privasi';
    }

    public static function defaultPrivacyPolicyContent(): string
    {
        return <<<'MARKDOWN'
# Kebijakan Privasi

Terakhir diperbarui: 15 Oktober 2026

Selamat datang di platform kami. Kami sangat menghargai privasi Anda dan berkomitmen penuh untuk melindungi data pribadi Anda sesuai dengan **Undang-Undang Republik Indonesia Nomor 27 Tahun 2022 tentang Pelindungan Data Pribadi (UU PDP)** serta standar kepatuhan privasi data global.

Kebijakan Privasi ini menjelaskan bagaimana kami mengumpulkan, menggunakan, menyimpan, membagikan, dan melindungi informasi pribadi Anda saat mengakses storefront, membuat akun, serta melakukan transaksi pembelian.

---

### 1. Informasi Pribadi yang Kami Kumpulkan
Kami hanya mengumpulkan informasi yang diperlukan untuk operasional toko dan pemrosesan pesanan Anda:
* **Data Identitas Akun:** Nama lengkap, alamat email, nomor telepon, dan kata sandi terenkripsi (hashed menggunakan algoritma bcrypt yang aman).
* **Data Pengiriman & Transaksi:** Alamat lengkap tujuan pengiriman, metode pengiriman yang dipilih, rincian barang pesanan, catatan pesanan, dan metode pembayaran yang Anda gunakan.
* **Histori Transaksi:** Catatan permanen nama barang, SKU, harga, dan kuantitas saat pesanan dibuat (snapshot histori tidak dapat diubah sepihak demi integritas audit).
* **Data Komunikasi:** Pertanyaan dan riwayat pesan dalam fitur Live Chat Customer Service.
* **Data Teknis & Peramban:** Alamat IP, preferensi bahasa pilihan (ID/EN), pilihan palet warna tema situs, serta informasi sesi melalui cookie esensial.

---

### 2. Dasar Hukum & Tujuan Pemrosesan Data
Pemrosesan data pribadi Anda dilakukan berdasarkan dasar hukum yang sah, meliputi:
1. **Pelaksanaan Kontrak Penjualan:** Memproses pembayaran, memverifikasi status pesanan, mengalokasikan stok barang, dan mengirimkan paket ke alamat tujuan.
2. **Kewajiban Hukum & Pembukuan:** Memenuhi ketentuan perpajakan, audit transaksi niaga elektronik, dan pencatatan riwayat perpindahan barang.
3. **Komunikasi Resmi:** Mengirimkan email konfirmasi pesanan, bukti pembayaran, resi ekspedisi, serta pemberitahuan status penerimaan barang.
4. **Kepentingan yang Sah:** Meningkatkan keamanan platform, mencegah transaksi penipuan (fraud detection), dan mengoptimalkan performa katalog toko.

---

### 3. Penyimpanan, Retensi, dan Keamanan Data
* **Keamanan Tingkat Tinggi:** Seluruh transmisi data sensitif dilindungi menggunakan enkripsi SSL/TLS. Kata sandi pengguna tidak pernah disimpan dalam bentuk teks biasa.
* **Integritas Database:** Transaksi dan bukti pemesanan dilindungi secara integritas transaksi database (ACID) untuk mencegah korupsi atau manipulasi data.
* **Masa Retensi:** Kami menyimpan data pribadi Anda selama akun Anda aktif atau selama diperlukan untuk memenuhi kewajiban pelaporan hukum dan audit transaksi.

---

### 4. Pengungkapan kepada Pihak Ketiga
Kami **tidak pernah menjual, menyewakan, atau memperdagangkan** data pribadi Anda kepada pihak ketiga untuk kepentingan komersial. Data hanya diteruskan secara terbatas kepada:
* **Penyedia Jasa Logistik/Kurir:** Hanya nama, alamat pengiriman, dan nomor telepon penerima untuk keperluan pengantaran pesanan.
* **Layanan Infrastruktur & Pengiriman Email:** Penyedia layanan email resmi untuk dispatch notifikasi pesanan.
* **Otoritas Berwenang:** Jika diwajibkan secara tegas oleh hukum atau penetapan pengadilan yang berkekuatan hukum tetap di wilayah Negara Kesatuan Republik Indonesia.

---

### 5. Hak-Hak Pemilik Data Pribadi (Subjek Data)
Berdasarkan UU Pelindungan Data Pribadi, Anda memiliki hak-hak berikut:
* **Hak Akses:** Melihat seluruh data profil dan histori transaksi lengkap yang tercatat pada akun Anda.
* **Hak Pembaruan & Koreksi:** Memperbarui data diri, kata sandi, dan alamat melalui menu Pengaturan Profil Akun.
* **Hak Penarikan Persetujuan:** Mengubah preferensi cookie non-esensial sewaktu-waktu.
* **Hak Penghapusan (Right to Erasure):** Mengajukan permohonan penutupan akun dan penghapusan data pribadi, sepanjang tidak bertentangan dengan kewajiban retensi arsip hukum transaksi keuangan.

---

### 6. Kontak Pengendali Data & Pertanyaan
Jika Anda memiliki pertanyaan, keberatan, atau ingin menggunakan hak perlindungan data Anda, silakan hubungi Pengendali Data resmi kami:
* **Pengelola & Penanggung Jawab:** LEFI ANDRI LESTARI
* **Email Resmi:** lefi.andri@kokek.com
* **Alamat Operasional:** Sistem Manajemen Inventori & Commerce
MARKDOWN;
    }

    public static function defaultCookiePolicyTitle(): string
    {
        return 'Kebijakan Cookie';
    }

    public static function defaultCookiePolicyContent(): string
    {
        return <<<'MARKDOWN'
# Kebijakan Cookie

Terakhir diperbarui: 15 Oktober 2026

Situs kami menggunakan cookie dan teknologi serupa untuk memberikan pengalaman belanja terbaik, menjaga sesi login Anda tetap aman, dan mengingat preferensi tampilan Anda. Kebijakan ini menjelaskan apa itu cookie, jenis cookie yang kami gunakan, serta cara Anda mengelolanya.

---

### 1. Apa itu Cookie?
Cookie adalah berkas teks kecil yang disimpan pada peramban (browser) komputer atau perangkat seluler Anda ketika Anda mengunjungi sebuah situs web. Cookie membantu situs web mengingat aktivitas dan preferensi Anda selama jangka waktu tertentu.

---

### 2. Kategori Cookie yang Digunakan pada Platform Ini
Kami mengelompokkan cookie ke dalam beberapa kategori berdasarkan fungsinya:

#### A. Cookie Wajib & Esensial (Strictly Necessary Cookies)
Cookie ini mutlak diperlukan agar fitur dasar situs dapat beroperasi. Tanpa cookie ini, fungsi-fungsi krusial tidak dapat berjalan:
* **Otentikasi & Sesi Pengguna (`laravel_session`):** Mengidentifikasi sesi login Anda secara aman sehingga Anda tetap terotentikasi saat berpindah halaman.
* **Perlindungan Keamanan (`XSRF-TOKEN`):** Melindungi formulir dari serangan pemalsuan permintaan antar-situs (Cross-Site Request Forgery / CSRF).
* **Keranjang Belanja:** Menyimpan barang belanjaan sementara sebelum Anda menyelesaikan checkout.
* **Status Persetujuan Cookie (`cookie_consent`):** Menyimpan preferensi persetujuan banner cookie Anda.

#### B. Cookie Fungsionalitas & Preferensi (Functional Cookies)
Cookie ini memungkinkan situs mengingat preferensi personal Anda untuk menghadirkan kenyamanan yang dipersonalisasi:
* **Preferensi Bahasa:** Mengingat apakah Anda memilih Bahasa Indonesia (ID) atau English (EN).
* **Nuansa Tema Situs:** Mengingat preferensi palet warna tema yang diatur untuk memberikan tampilan konsisten di setiap kunjungan.

#### C. Cookie Kinerja & Analitik (Performance & Analytics)
Cookie ini (jika diaktifkan) membantu kami mengumpulkan informasi statistik agregat secara anonim mengenai cara pengunjung menjelajahi katalog produk, halaman yang paling sering dikunjungi, serta mendeteksi kendala navigasi guna perbaikan kualitas sistem.

---

### 3. Pengaturan dan Persetujuan Cookie Anda
Saat pertama kali mengunjungi platform kami, Anda akan melihat banner **Persetujuan Cookie**. Anda dapat:
* **Menerima Semua:** Mengaktifkan seluruh cookie esensial dan fungsional.
* **Hanya Wajib (Esensial):** Menolak cookie opsional dan hanya mengizinkan cookie wajib yang diperlukan untuk operasional toko.
* **Ubah Pengaturan:** Anda dapat meninjau dan memperbarui persetujuan cookie Anda kapan saja melalui banner cookie di bagian bawah halaman atau tautan Kebijakan Cookie ini.

---

### 4. Mengelola Cookie Melalui Peramban (Browser)
Selain melalui banner persetujuan kami, Anda dapat mengatur atau menghapus cookie langsung melalui pengaturan peramban web Anda:
* **Google Chrome:** Pengaturan > Privasi dan Keamanan > Cookie dan data situs pihak ketiga.
* **Mozilla Firefox:** Pengaturan > Privasi & Keamanan > Cookie dan Data Situs.
* **Microsoft Edge:** Pengaturan > Cookie dan izin situs > Kelola dan hapus cookie.
* **Apple Safari:** Preferensi > Privasi > Kelola Data Situs Web.

*Catatan: Menonaktifkan seluruh cookie pada peramban dapat menyebabkan fitur otentikasi akun, keranjang belanja, dan proses pembayaran checkout tidak dapat berfungsi dengan baik.*

---

### 5. Kontak Informasi
Jika Anda memiliki pertanyaan seputar penggunaan cookie pada platform ini, hubungi kami melalui:
* **Email:** lefi.andri@kokek.com
* **Penanggung Jawab:** LEFI ANDRI LESTARI
MARKDOWN;
    }

    public function getEffectiveCookieConsentTitle(): string
    {
        return ! empty($this->cookie_consent_title) ? $this->cookie_consent_title : static::defaultCookieConsentTitle();
    }

    public function getEffectiveCookieConsentMessage(): string
    {
        return ! empty($this->cookie_consent_message) ? $this->cookie_consent_message : static::defaultCookieConsentMessage();
    }

    public function getEffectivePrivacyPolicyTitle(): string
    {
        return ! empty($this->privacy_policy_title) ? $this->privacy_policy_title : static::defaultPrivacyPolicyTitle();
    }

    public function getEffectivePrivacyPolicyContent(): string
    {
        return ! empty($this->privacy_policy_content) ? $this->privacy_policy_content : static::defaultPrivacyPolicyContent();
    }

    public function getEffectiveCookiePolicyTitle(): string
    {
        return ! empty($this->cookie_policy_title) ? $this->cookie_policy_title : static::defaultCookiePolicyTitle();
    }

    public function getEffectiveCookiePolicyContent(): string
    {
        return ! empty($this->cookie_policy_content) ? $this->cookie_policy_content : static::defaultCookiePolicyContent();
    }

    public function toSharedArray(): array
    {
        $themeColor = $this->theme_color ?: \App\Support\ThemeColor::DEFAULT_COLOR;

        return [
            'brand_name' => $this->brand_name,
            'theme_color' => $themeColor,
            'theme_palette' => \App\Support\ThemeColor::generatePalette($themeColor),
            'theme_presets' => \App\Support\ThemeColor::PRESETS,
            'logo' => $this->getFirstMediaUrl('site-logo') ?: null,
            'favicon' => $this->getFirstMediaUrl('site-favicon') ?: null,
            'navbar_links' => $this->navbar_links ?? self::defaultNavbarLinks(),
            'footer_description' => $this->footer_description,
            'footer_copyright' => $this->footer_copyright,
            'footer_links' => $this->footer_links ?? [],
            'cookie_consent' => [
                'enabled' => (bool) ($this->cookie_consent_enabled ?? true),
                'title' => $this->getEffectiveCookieConsentTitle(),
                'message' => $this->getEffectiveCookieConsentMessage(),
            ],
            'privacy_policy' => [
                'title' => $this->getEffectivePrivacyPolicyTitle(),
                'url' => route('privacy-policy'),
            ],
            'cookie_policy' => [
                'title' => $this->getEffectiveCookiePolicyTitle(),
                'url' => route('cookie-policy'),
            ],
        ];
    }
}
