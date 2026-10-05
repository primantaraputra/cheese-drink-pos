# CHEESE DRINK POS 🧀🥤

> Aplikasi Kasir (Point of Sale) Web Modern, Cepat, dan Tangguh untuk UMKM Penjual Dimsum & Aneka Minuman Keju.

Aplikasi ini dibangun untuk mengatasi kendala pencatatan manual nota tulis UMKM F&B: mempercepat transaksi kasir (≤ 5 ketukan), mencegah kecurangan harga dengan validasi database (RLS & RPC), memonitor persediaan bahan baku, rekonsiliasi kas per shift, serta menghasilkan laporan keuangan dan analitik bisnis otomatis bagi pemilik.

---

## 🚀 Fitur Utama

- ⚡ **Layar Kasir (POS) Ultra Cepat**:
  - Desain responsif penuh (Mobile 375px dengan bottom sheet, Tablet 768px, Desktop 1280px split-view).
  - Mode 1-Tap langsung masuk keranjang untuk menu tanpa opsi.
  - Dialog pemilihan varian dimsum (porsi 3/5) dan kustomisasi minuman (level gula, es, topping cheese foam/boba).
  - Keranjang belanja instan dengan Zustand dan persistensi `localStorage`.
- 💵 **Pembayaran Lengkap & Akurat**:
  - Tunai (dengan Numpad interaktif, tombol uang pas, dan pecahan cepat 10k-100k, realtime kembalian).
  - Non-Tunai: QRIS, Transfer Bank, E-Wallet.
  - **Split Payment**: Kombinasi pembayaran sebagian tunai dan sebagian non-tunai.
  - Perhitungan uang final dihitung di database Postgres via RPC (`create_order`), anti manipulasi harga client.
- 🖨️ **Struk Kasir Termal & Berbagi Digital**:
  - Komponen struk presisi untuk printer thermal **58mm dan 80mm** via CSS `@media print`.
  - Format cetak ulang dengan label **"SALINAN"**.
  - Ekspor struk format PDF dan format pesan WhatsApp (`wa.me`).
- 🕒 **Manajemen Shift Kasir & Arus Kas Laci**:
  - Gerbang buka shift (input modal awal) sebelum melayani pelanggan.
  - Rekap tutup shift otomatis: menghitung kas masuk, pengeluaran laci, kas fisik aktual, dan indikator selisih kas.
  - Cetak slip rekap shift kasir.
- ⏸️ **Parkir Pesanan (Hold Order)**:
  - Tunda pesanan yang sedang menunggu dan lanjutkan kembali ke keranjang kasir kapan saja.
- 🛡️ **Pembatalan Transaksi Aman (Void)**:
  - Pembatalan transaksi completed wajib mengisi alasan minimal 5 karakter.
  - Otorisasi PIN Owner untuk kasir.
  - Rollback otomatis stok produk dan bahan baku racikan resep.
- 📊 **Dashboard Analitik & 8 Modul Laporan (Owner)**:
  - KPI Cards: Omzet harian, jumlah transaksi, rata-rata tiket, laba kotor.
  - Grafik tren penjualan 7/30 hari (Recharts).
  - Analisis jam tersibuk pelanggan (00:00 - 23:00 WIB).
  - Komposisi metode pembayaran (Donut Chart).
  - 8 Modul Laporan lengkap dengan ekspor **Excel (.xlsx)**, **CSV**, dan dokumen **PDF**.
- 📦 **Inventori & Pengeluaran Toko**:
  - Pemantauan stok produk dan bahan baku (ingredients).
  - Mutasi stok: Pembelian (Barang Masuk), Opname (Penyesuaian), dan Waste (Basi/Rusak).
  - Pencatatan biaya operasional kedai dengan opsi potong kas laci kasir.
- 📱 **PWA & Offline Ready**:
  - Installable sebagai aplikasi di Android/iOS/Desktop.
  - Halaman offline informatif.
  - Review log keamanan di menu Audit Trail.

---

## 🛠️ Tech Stack

- **Frontend**: Next.js 15+ (App Router), React 19, TypeScript strict mode.
- **Styling**: Tailwind CSS v4, shadcn/ui (Radix UI Primitives), Lucide Icons.
- **State Management**: Zustand (Cart Store dengan persistensi localStorage).
- **Data Fetching**: TanStack React Query v5, Server Actions, Server Components.
- **Backend & Database**: Supabase PostgreSQL dengan Row Level Security (RLS) di seluruh tabel.
- **Database Logic**: PostgreSQL Stored Procedures / RPC (PL/pgSQL) untuk atomisitas uang dan mutasi stok.
- **Visualisasi & Ekspor**: Recharts, `xlsx` (Excel/CSV), `jspdf` & `jspdf-autotable` (PDF).
- **Pengujian**: Vitest (Unit Testing logika finansial & utilitas).

---

## 📋 Prasyarat Sistem

- **Node.js**: Versi 20.x atau lebih baru.
- **NPM**: Versi 10.x atau lebih baru.
- Akun proyek [Supabase](https://supabase.com).

---

## ⚡ Langkah Setup Lokal

### 1. Kloning Repositori & Pasang Dependensi
```bash
git clone <url-repositori>
cd cheese-drink-pos
npm install
```

### 2. Konfigurasi Environment Variables
Salin template `.env.example` menjadi `.env.local`:
```bash
cp .env.example .env.local
```
Buka `.env.local` dan isi kredensial Supabase Anda:
```env
NEXT_PUBLIC_SUPABASE_URL=https://proyek-anda.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJh...
SUPABASE_SERVICE_ROLE_KEY=eyJh...
NEXT_PUBLIC_APP_NAME="Cheese Drink POS"
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Eksekusi Migrasi Database di Supabase
Buka **SQL Editor** pada Supabase Dashboard Anda, lalu jalankan file migrasi berikut secara berurutan:
1. `supabase/migrations/0001_initial_schema.sql` (Tabel, Enum, Indeks)
2. `supabase/migrations/0002_functions_and_triggers.sql` (Trigger & Profil)
3. `supabase/migrations/0003_rls_policies.sql` (Kebijakan Row Level Security)
4. `supabase/migrations/0004_core_rpc.sql` (Fungsi Shift & PIN Void)
5. `supabase/migrations/0005_create_order_rpc.sql` (RPC Transaksi Atomik POS)
6. `supabase/migrations/0006_void_order_rpc.sql` (RPC Pembatalan Void & Rollback Stok)
7. `supabase/migrations/0007_reports_rpc.sql` (RPC Analitik & Laporan Keuangan)

### 4. Masukkan Data Awal (Seed Data)
Jalankan file `supabase/seed.sql` di SQL Editor untuk memuat produk sampel dimsum, aneka varian minuman keju, kategori, dan grup topping.

### 5. Buat Akun Owner Pertama
1. Buka Supabase Dashboard > **Authentication > Users**.
2. Klik **Add user > Create user**:
   - Email: `owner@cheesedrink.com`
   - Password: `Password123!`
   - Centang **Auto Confirm User**.
3. Di SQL Editor, berikan peran `owner`:
   ```sql
   update profiles
   set role = 'owner',
       full_name = 'Owner Cheese Drink'
   where id = (select id from auth.users where email = 'owner@cheesedrink.com');
   ```

### 6. Jalankan Server Pengembangan
```bash
npm run dev
```
Buka peramban di [http://localhost:3000](http://localhost:3000).

---

## 📜 Skrip NPM yang Tersedia

| Perintah | Deskripsi |
|---|---|
| `npm run dev` | Menjalankan Next.js development server lokal |
| `npm run build` | Menjalankan kompilasi produksi Next.js |
| `npm run start` | Menjalankan bundle produksi lokal |
| `npm run lint` | Memeriksa kepatuhan kode via ESLint |
| `npm run typecheck` | Memvalidasi seluruh tipe TypeScript (`tsc --noEmit`) |
| `npm run test` | Menjalankan unit test logika bisnis via Vitest |
| `npm run format` | Memformat kode dengan Prettier |

---

## 📚 Dokumentasi Lengkap Proyek

Seluruh dokumentasi teknis dan operasional tersimpan di folder `docs/`:
- 🗺️ [**docs/ERD.md**](docs/ERD.md): Diagram relasi entitas Mermaid dari 18 tabel database.
- 📖 [**docs/USER_GUIDE.md**](docs/USER_GUIDE.md): Panduan pemakaian lengkap berbahasa awam untuk Owner & Staf Kasir.
- 🚀 [**docs/DEPLOYMENT.md**](docs/DEPLOYMENT.md): Panduan deploy publik ke Supabase Cloud & Vercel.
- ✅ [**docs/TEST_CHECKLIST.md**](docs/TEST_CHECKLIST.md): Daftar uji penerimaan & skenario QA menyeluruh.
- 📝 [**docs/ASSUMPTIONS.md**](docs/ASSUMPTIONS.md): Daftar keputusan bisnis dan asumsi teknis yang diambil.

---

## 🔒 Hak Cipta & Lisensi
Dikembangkan dengan standar rekayasa perangkat lunak modern untuk mitra UMKM F&B **Cheese Drink**.
