# 📦 TithoShop - Sistem Manajemen Inventaris & E-Commerce

Aplikasi web modern berbasis **Laravel 13**, **Inertia.js (React)**, dan **Tailwind CSS** untuk mengelola inventaris gudang, katalog produk, pesanan, promosi, hingga live chat interaktif antara pelanggan dan admin toko.

---

> [!WARNING]
> ### PEMBERITAHUAN HAK CIPTA & LISENSI PENGGUNAAN TERBATAS
> 
> Seluruh kode sumber (*source code*), rancangan sistem, dan aset dalam repositori ini merupakan hak cipta intelektual milik:
> 
> **Pencipta / Pemegang Hak Cipta:**  
> **LEFI ANDRI LESTARI**  
> 📧 Email Kontak Izin: [lefi.andri@kokek.com](mailto:lefi.andri@kokek.com)
> 
> #### Ketentuan Penggunaan (Bebas Terbatas):
> 1. Kode sumber ini berstatus **Bebas Terbatas**. Penggunaan, pengunduhan, pengujian, maupun penerapan sistem ini **WAJIB** memperoleh izin resmi tertulis terlebih dahulu dari pembuat.
> 2. Dilarang keras menyalin, menggandakan, memodifikasi, mendistribusikan ulang, mempublikasikan, memperjualbelikan, atau memanfaatkan sistem ini baik sebagian maupun secara keseluruhan untuk keperluan komersial, institusional, maupun personal tanpa adanya izin tertulis sah dari pemegang hak cipta.
> 
> #### Konsekuensi Hukum & Sanksi:
> Penggunaan dan pemanfaatan kode sumber ini tanpa izin tertulis merupakan **PERBUATAN ILEGAL** dan pelanggaran hak cipta. Segala bentuk pelanggaran akan diproses melalui jalur hukum yang berlaku di wilayah Republik Indonesia sesuai dengan:
> - **Undang-Undang Republik Indonesia Nomor 28 Tahun 2014 tentang Hak Cipta**
> - Ketentuan sanksi pidana (termasuk ancaman hukuman penjara dan denda finansial maksimal hingga miliaran rupiah) serta gugatan ganti rugi secara perdata sesuai peraturan perundang-undangan RI.

---

## 🚀 Fitur Utama Aplikasi

- **Katalog & Storefront Publik**: Tampilan beranda belanja responsif, banner hero dinamis, filter kategori, pencarian produk, serta dukungan multibahasa (ID / EN).
- **Manajemen Inventaris & Mutasi Stok**: Pencatatan histori pergerakan stok (*stock ledger*), penyesuaian stok fisik (*stock adjustment*), stok minimum (*low stock alert*), dan saldo awal (*opening balance*).
- **Katalog Produk & Varian**: Manajemen SKU produk, harga jual, harga pokok penjualan (HPP/cost), deskripsi, status aktif/discontinue, dan galeri media produk.
- **Checkout & Manajemen Pesanan (Orders)**: Alur belanja pelanggan, validasi diskon/promo, rincian biaya kirim, verifikasi pembayaran, serta konfirmasi penerimaan barang.
- **Live Chat Terintegrasi**: Fitur perpesanan instan antara pembeli (Customer) dan pengelola toko (Admin) secara real-time.
- **Promosi & Pengaturan Toko**: Pengaturan kode voucher/promo, diskon flat/persentase, kuota promo, pengaturan tarif ongkir, metode pembayaran, banner hero, dan informasi identitas website.
- **Role-Based Access Control (RBAC)**: Pengendalian hak akses pengguna berbasis peran (*Spatie Permission*).

---

## 👥 User Role & Kredensial Login

Sistem telah dilengkapi dengan akun bawaan (*default seeder*) yang dapat digunakan untuk masuk ke sistem:

| Role | Nama Pengguna | Email Login | Password | Akses & Tanggung Jawab |
| :--- | :--- | :--- | :--- | :--- |
| **Admin** | Admin TithoShop | `admin@tithoshop.id` | `password` | **Akses Penuh**: Seluruh modul sistem (Dashboard, Produk, Stok, Pesanan, User, Banner, Promosi, Ongkir, Pembayaran, Pengaturan Toko, dan Admin Live Chat). |
| **Inventory Manager** | Rina Gudang | `gudang@tithoshop.id` | `password` | **Gudang & Inventaris**: Manajemen stok, mutasi/penyesuaian stok (*adjust movements*), katalog produk, dan monitoring pesanan. |
| **Sales** | Dimas Sales | `sales@tithoshop.id` | `password` | **Penjualan**: Memantau dashboard, melihat ketersediaan produk, serta memperbarui status pesanan pelanggan (*orders*). |
| **Customer** | Pelanggan Toko | *(Daftar via Register)* | *(Sesuai registrasi)* | **Belanja & Akun Pribadi**: Akses storefront belanja, checkout pesanan, melihat riwayat pesanan (`/my-orders`), konfirmasi terima barang, dan live chat (`/chat`). |

> [!TIP]
> - URL halaman Login: `/login`
> - URL halaman Register Customer: `/register`
> - Akun di atas dibuat otomatis setelah menjalankan perintah `php artisan migrate --seed`.

---

## 🛠️ Kebutuhan Sistem (Prerequisites)

Pastikan lingkungan server / komputer Anda memenuhi spesifikasi berikut:

- **PHP**: Versi `^8.2` atau `^8.5` (dengan ekstensi `pdo`, `mbstring`, `openssl`, `fileinfo`, `gd`/`imagick`, `intl`)
- **Composer**: Versi 2.x
- **Node.js**: Versi 18.x atau lebih tinggi & **NPM**
- **Database**: MariaDB / MySQL versi 8.0+ (atau SQLite untuk keperluan lokal ringan)
- **Web Server / Dev Tool**: Laravel Herd, Laragon, XAMPP, atau PHP Built-in Server

---

## 💻 Panduan Instalasi & Cara Menggunakan

Ikuti langkah-langkah berikut untuk menginstal dan menjalankan aplikasi pada lingkungan lokal:

### 1. Clone & Buka Direktori Repositori
```bash
git clone <URL_REPOSITORY>
cd inventory
```

### 2. Konfigurasi Environment File
Salin file `.env.example` menjadi `.env`:
```bash
cp .env.example .env
```
Buka file `.env` dan sesuaikan konfigurasi koneksi database Anda, contohnya:
```env
APP_NAME=TithoShop
APP_URL=http://localhost:8000

DB_CONNECTION=mariadb
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=master_inertia_11
DB_USERNAME=root
DB_PASSWORD=
```

### 3. Install Dependensi PHP (Composer)
```bash
composer install
```

### 4. Generate Application Key
```bash
php artisan key:generate
```

### 5. Jalankan Migrasi & Database Seeder
Perintah ini akan membuat seluruh tabel database, permission, produk contoh, kategori, banner, serta membuat akun bawaan:
```bash
php artisan migrate --seed
```

### 6. Hubungkan Storage Link (Aset Gambar)
Pastikan storage link aktif agar foto produk dan banner dapat ditampilkan:
```bash
php artisan storage:link
```

### 7. Install Dependensi Frontend (NPM)
```bash
npm install
```

### 8. Menjalankan Server Aplikasi

Anda dapat menjalankan seluruh layanan aplikasi secara otomatis menggunakan script:
```bash
composer run dev
```

Atau jika ingin menjalankan proses secara manual di terminal terpisah:
```bash
# Terminal 1: Web Server Laravel
php artisan serve

# Terminal 2: Vite Dev Server (Asset Bundler)
npm run dev

# Terminal 3: Queue Worker (Untuk pemrosesan antrean data/event)
php artisan queue:work
```

### 9. Mengakses Aplikasi
Buka peramban (*browser*) dan arahkan ke:
- **Aplikasi Utama (Storefront / Beranda):** [http://localhost:8000](http://localhost:8000) *(atau URL Laravel Herd Anda)*
- **Halaman Masuk (Login):** [http://localhost:8000/login](http://localhost:8000/login)
- **Halaman Pendaftaran Customer:** [http://localhost:8000/register](http://localhost:8000/register)

---

## 📖 Alur Penggunaan Aplikasi

1. **Sebagai Administrator (`admin@tithoshop.id` / `password`)**:
   - Masuk melalui `/login`.
   - Mengakses Dashboard utama untuk melihat analitik penjualan dan stok menipis.
   - Mengelola master produk, kategori, dan batas stok minimum pada menu **Produk**.
   - Mengelola akun staf gudang atau sales pada menu **Users**.
   - Menata tampilan toko melalui menu **Site Settings**, **Hero Banners**, serta mengatur kupon diskon di menu **Promotions**.
   - Membalas chat pelanggan pada menu **Live Chats**.

2. **Sebagai Staf Gudang / Inventory Manager (`gudang@tithoshop.id` / `password`)**:
   - Masuk melalui `/login`.
   - Memantau persediaan barang di menu **Inventory**.
   - Melakukan penyesuaian stok (*Stock Adjustment*) ketika barang masuk dari supplier atau barang rusak/hilang.

3. **Sebagai Tim Sales (`sales@tithoshop.id` / `password`)**:
   - Masuk melalui `/login`.
   - Memantau daftar pesanan baru di menu **Orders**.
   - Memperbarui status pesanan dari *processing* menjadi *completed* atau status terkait lainnya.

4. **Sebagai Pelanggan (Customer)**:
   - Menjelajahi katalog produk pada halaman utama (`/`).
   - Melakukan pendaftaran akun di menu **Register** dan login.
   - Memasukkan produk ke keranjang belanja dan melakukan proses **Checkout**.
   - Menggunakan kode promo aktif untuk mendapatkan potongan harga.
   - Memantau proses pengiriman di menu **Pesanan Saya** (`/my-orders`) dan menekan tombol konfirmasi barang diterima saat produk tiba.
   - Menghubungi admin secara langsung melalui menu **Chat** (`/chat`).

---

## 🧰 Teknologi yang Digunakan

- **Backend**: [Laravel 13](https://laravel.com), PHP 8.2+
- **Frontend**: [React 19](https://react.dev), [Inertia.js v2](https://inertiajs.com)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com), Lucide React Icons
- **Authorization & Role**: [Spatie Laravel Permission](https://spatie.be/docs/laravel-permission)
- **Media Storage**: [Spatie Laravel Medialibrary](https://spatie.be/docs/laravel-medialibrary)
- **Build Tool**: [Vite 6](https://vitejs.dev)

---

## ⚖️ Kontak & Perizinan

Untuk informasi kerja sama, permohonan izin penggunaan kode, lisensi khusus, atau keperluan lainnya, silakan menghubungi:

- **Nama**: LEFI ANDRI LESTARI
- **Email**: [lefi.andri@kokek.com](mailto:lefi.andri@kokek.com)
